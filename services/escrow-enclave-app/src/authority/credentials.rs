//! Dormant attested credential-CMK unsealing. There is deliberately no key
//! generation, host plaintext input, or fallback to the escrow CMK here.
use super::{
    aws::{CredentialPurpose, DedicatedCredentials},
    config::{AuthorityConfig, EmailConfig},
    AuthorityError as Error,
};
use crate::{
    kms::{open_ciphertext_for_recipient, AwsKmsClient, Credentials, KmsClient, RecipientKey},
    nsm::{AttestationRequest, NsmDriver},
    time::TimeSource,
};
use rand_core::{OsRng, RngCore};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, sync::Arc};

pub struct CredentialUnsealer {
    authority: AuthorityConfig,
    email: Option<EmailConfig>,
    kms: AwsKmsClient,
}

fn env(name: &str) -> Result<Option<String>, Error> {
    match std::env::var(name) {
        Ok(v) if !v.is_empty() => Ok(Some(v)),
        Ok(_) | Err(std::env::VarError::NotPresent) => Ok(None),
        Err(_) => Err(Error::Configuration),
    }
}

fn validate_key(
    config: &AuthorityConfig,
    key: &str,
    escrow_key: &str,
    kms_region: &str,
    tenant: &str,
) -> Result<(), Error> {
    let prefix = format!("arn:aws:kms:{}:{}:key/", config.region, config.account);
    let id = key.strip_prefix(&prefix).ok_or(Error::Configuration)?;
    let uuid = id.len() == 36
        && id.bytes().enumerate().all(|(i, b)| {
            if [8, 13, 18, 23].contains(&i) {
                b == b'-'
            } else {
                b.is_ascii_hexdigit()
            }
        });
    if !uuid
        || key.eq_ignore_ascii_case(escrow_key)
        || config.region != kms_region
        || config.tenant != tenant
    {
        return Err(Error::Configuration);
    }
    Ok(())
}

impl CredentialUnsealer {
    /// Measured configuration only. Unset groups return None without invoking KMS
    /// or NSM. Configured boot unseals the writer; email activation is still deferred.
    pub fn from_measured_env(
        boot_credentials: Credentials,
        time: Arc<dyn TimeSource>,
    ) -> Result<Option<Self>, Error> {
        let authority = AuthorityConfig::from_measured_env()?;
        let email = EmailConfig::from_measured_env()?;
        let key = env("ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN")?;
        if authority.is_none() && email.is_none() && key.is_none() {
            return Ok(None);
        }
        let authority = authority.ok_or(Error::Configuration)?;
        let key = key.ok_or(Error::Configuration)?;
        validate_key(
            &authority,
            &key,
            &env("ESCROW_KMS_KEY_ARN")?.ok_or(Error::Configuration)?,
            &env("ESCROW_KMS_REGION")?.ok_or(Error::Configuration)?,
            &env("ESCROW_TENANT")?.ok_or(Error::Configuration)?,
        )?;
        if email
            .as_ref()
            .is_some_and(|e| e.account != authority.account)
        {
            return Err(Error::Configuration);
        }
        let kms = AwsKmsClient::new(boot_credentials, &authority.region, key, time)
            .map_err(|_| Error::Configuration)?;
        Ok(Some(Self {
            authority,
            email,
            kms,
        }))
    }

    /// KMS returns only CiphertextForRecipient over enclave-terminated TLS. Each
    /// call generates a new ephemeral recipient key and fresh attestation nonce.
    pub async fn unseal(
        &self,
        purpose: CredentialPurpose,
        ciphertext: &[u8],
        nsm: &dyn NsmDriver,
    ) -> Result<DedicatedCredentials, Error> {
        check_ciphertext(ciphertext)?;
        let context = credential_context(&self.authority, self.email.as_ref(), purpose)?;
        let recipient = RecipientKey::generate().map_err(|_| Error::Unavailable)?;
        unseal_with(&self.kms, nsm, &recipient, ciphertext, &context, purpose).await
    }
}

fn check_ciphertext(ciphertext: &[u8]) -> Result<(), Error> {
    if ciphertext.is_empty() || ciphertext.len() > 6144 {
        return Err(Error::InvalidRequest);
    }
    Ok(())
}

fn credential_context(
    authority: &AuthorityConfig,
    email: Option<&EmailConfig>,
    purpose: CredentialPurpose,
) -> Result<BTreeMap<String, String>, Error> {
    let (purpose, principal) = match purpose {
        CredentialPurpose::AuthorityWriter => ("authority-writer", authority.writer_arn()),
        CredentialPurpose::EmailSender => (
            "email-sender",
            email.ok_or(Error::Configuration)?.sender_arn(),
        ),
    };
    Ok(BTreeMap::from([
        ("purpose".into(), purpose.into()),
        ("tenant".into(), authority.tenant.clone()),
        ("environment".into(), authority.environment.clone()),
        ("authorityGeneration".into(), authority.generation.clone()),
        ("principalArn".into(), principal),
    ]))
}

// Borrow string values directly from the zeroizing plaintext buffer. Reject
// escapes BEFORE Serde: its escape decoder would otherwise allocate a scratch
// copy even when the borrowed-string visitor subsequently rejects the value.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Payload<'a> {
    access_key_id: &'a str,
    secret_access_key: &'a str,
    principal_arn: &'a str,
}

async fn unseal_with(
    kms: &dyn KmsClient,
    nsm: &dyn NsmDriver,
    recipient: &RecipientKey,
    ciphertext: &[u8],
    context: &BTreeMap<String, String>,
    purpose: CredentialPurpose,
) -> Result<DedicatedCredentials, Error> {
    check_ciphertext(ciphertext)?;
    let mut nonce = vec![0; 32];
    OsRng
        .try_fill_bytes(&mut nonce)
        .map_err(|_| Error::Unavailable)?;
    let user_data =
        Sha256::digest(serde_json::to_vec(context).map_err(|_| Error::Configuration)?).to_vec();
    let attestation = nsm
        .attest(AttestationRequest {
            user_data,
            nonce,
            public_key: Some(recipient.public_key_der().map_err(|_| Error::Unavailable)?),
        })
        .map_err(|_| Error::Unavailable)?;
    let cms = kms
        .decrypt_for_recipient(ciphertext, context, &attestation)
        .await
        .map_err(|_| Error::Unavailable)?;
    let plaintext =
        open_ciphertext_for_recipient(&cms, recipient).map_err(|_| Error::Unavailable)?;
    parse_credentials(
        &plaintext,
        context.get("principalArn").ok_or(Error::Configuration)?,
        purpose,
    )
}

fn parse_credentials(
    plaintext: &[u8],
    principal: &str,
    purpose: CredentialPurpose,
) -> Result<DedicatedCredentials, Error> {
    // All three fixed fields and their restricted ASCII values need no escapes.
    // Reject before deserialization, not after a parser-owned secret copy exists.
    if plaintext.is_empty() || plaintext.len() > 4096 || plaintext.contains(&b'\\') {
        return Err(Error::Unavailable);
    }
    let payload: Payload<'_> = serde_json::from_slice(plaintext).map_err(|_| Error::Unavailable)?;
    if principal != payload.principal_arn {
        return Err(Error::Unavailable);
    }
    DedicatedCredentials::from_unsealed(
        payload.access_key_id.to_owned(),
        payload.secret_access_key.to_owned(),
        payload.principal_arn.to_owned(),
        purpose,
    )
    .map_err(|_| Error::Unavailable)
}

#[cfg(test)]
mod tests;
