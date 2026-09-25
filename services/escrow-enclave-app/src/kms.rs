//! Attested KMS sealing. CMS is confidential, not independently authenticated:
//! only open responses obtained from the authenticated KMS TLS connection.
use std::{collections::BTreeMap, future::Future, pin::Pin};

use base64::{engine::general_purpose::STANDARD, Engine};
use cbc::cipher::{block_padding::Pkcs7, BlockDecryptMut, KeyIvInit};
use cms::{
    content_info::ContentInfo,
    enveloped_data::{EnvelopedData, RecipientInfo},
};
use der::{asn1::ObjectIdentifier, Decode, Sequence};
use p256::pkcs8::{DecodePrivateKey, EncodePublicKey};
use rand_core::{OsRng, RngCore};
use rsa::{pkcs8::spki::AlgorithmIdentifierOwned, Oaep, RsaPrivateKey};
use sha2::Sha256;
use thiserror::Error;
use zeroize::Zeroizing;

use crate::{
    crypto::{self, EscrowKeyPair},
    nsm::{AttestationRequest, NsmDriver},
};

#[cfg(feature = "kms")]
mod aws;
#[cfg(feature = "kms")]
pub use aws::{AwsKmsClient, Credentials};
#[cfg(any(test, feature = "fake-kms"))]
mod fake;
#[cfg(all(target_os = "linux", feature = "kms"))]
pub mod vsock_forward;
#[cfg(any(test, feature = "fake-kms"))]
pub use fake::FakeKmsClient;

const ENVELOPED: ObjectIdentifier = ObjectIdentifier::new_unwrap("1.2.840.113549.1.7.3");
const DATA: ObjectIdentifier = ObjectIdentifier::new_unwrap("1.2.840.113549.1.7.1");
const OAEP: ObjectIdentifier = ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.7");
const MGF1: ObjectIdentifier = ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.8");
const P_SPECIFIED: ObjectIdentifier = ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.9");
const SHA256: ObjectIdentifier = ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.1");
const AES256_CBC: ObjectIdentifier = ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.1.42");

/// Intentionally excludes SDK errors, credentials and secret inputs.
#[derive(Debug, Error)]
pub enum KmsError {
    #[error("Invalid KMS recipient encoding or algorithm")]
    Encoding,
    #[error("KMS cryptographic operation failed")]
    Crypto,
    #[error("KMS attestation failed")]
    Attestation,
    #[error("KMS unavailable")]
    Unavailable,
    #[error("Unexpected KMS response")]
    UnexpectedResponse,
    #[error("Invalid KMS configuration")]
    Configuration,
}

/// Explicit boxed Send futures keep this trait dyn-compatible without async-trait.
pub type KmsFuture<'a> = Pin<Box<dyn Future<Output = Result<Vec<u8>, KmsError>> + Send + 'a>>;

pub trait KmsClient: Send + Sync {
    fn decrypt_for_recipient<'a>(
        &'a self,
        ciphertext: &'a [u8],
        encryption_context: &'a BTreeMap<String, String>,
        attestation_document: &'a [u8],
    ) -> KmsFuture<'a>;
    fn encrypt<'a>(
        &'a self,
        plaintext: &'a [u8],
        encryption_context: &'a BTreeMap<String, String>,
    ) -> KmsFuture<'a>;
}

/// A distinct, ephemeral boot key. RsaPrivateKey implements ZeroizeOnDrop.
/// Not Clone/Debug and never persisted alongside the sealed escrow key.
pub struct RecipientKey(RsaPrivateKey);

impl RecipientKey {
    pub fn generate() -> Result<Self, KmsError> {
        RsaPrivateKey::new(&mut OsRng, 2048)
            .map(Self)
            .map_err(|_| KmsError::Crypto)
    }

    pub fn public_key_der(&self) -> Result<Vec<u8>, KmsError> {
        self.0
            .to_public_key()
            .to_public_key_der()
            .map(|doc| doc.as_bytes().to_vec())
            .map_err(|_| KmsError::Encoding)
    }
}

// SHA-1 defaults are deliberately NOT accepted: both SHA-256 fields must appear.
#[derive(Sequence)]
struct OaepParameters {
    #[asn1(context_specific = "0", tag_mode = "EXPLICIT")]
    hash: AlgorithmIdentifierOwned,
    #[asn1(context_specific = "1", tag_mode = "EXPLICIT")]
    mask: AlgorithmIdentifierOwned,
    #[asn1(context_specific = "2", tag_mode = "EXPLICIT", optional = "true")]
    source: Option<AlgorithmIdentifierOwned>,
}

fn sha256_algorithm(alg: &AlgorithmIdentifierOwned) -> bool {
    alg.oid == SHA256 && alg.parameters.as_ref().is_none_or(|p| p.is_null())
}

fn validate_oaep(alg: &AlgorithmIdentifierOwned) -> Result<(), KmsError> {
    if alg.oid != OAEP {
        return Err(KmsError::Encoding);
    }
    let params: OaepParameters = alg
        .parameters
        .as_ref()
        .ok_or(KmsError::Encoding)?
        .decode_as()
        .map_err(|_| KmsError::Encoding)?;
    let mask_hash: AlgorithmIdentifierOwned = params
        .mask
        .parameters
        .as_ref()
        .ok_or(KmsError::Encoding)?
        .decode_as()
        .map_err(|_| KmsError::Encoding)?;
    if !sha256_algorithm(&params.hash) || params.mask.oid != MGF1 || !sha256_algorithm(&mask_hash) {
        return Err(KmsError::Encoding);
    }
    if let Some(source) = params.source {
        let label: der::asn1::OctetString = source
            .parameters
            .as_ref()
            .ok_or(KmsError::Encoding)?
            .decode_as()
            .map_err(|_| KmsError::Encoding)?;
        if source.oid != P_SPECIFIED || !label.as_bytes().is_empty() {
            return Err(KmsError::Encoding);
        }
    }
    Ok(())
}

/// Strict DER CMS, one RSA-OAEP SHA-256 recipient, AES-256-CBC and PKCS#7 only.
/// No fallback to direct RSA, legacy padding, SHA-1 or another content cipher.
pub fn open_ciphertext_for_recipient(
    cms_der: &[u8],
    recipient: &RecipientKey,
) -> Result<Zeroizing<Vec<u8>>, KmsError> {
    if cms_der.len() > 16_384 {
        return Err(KmsError::Encoding);
    }
    let info = ContentInfo::from_der(cms_der).map_err(|_| KmsError::Encoding)?;
    if info.content_type != ENVELOPED {
        return Err(KmsError::Encoding);
    }
    let envelope: EnvelopedData = info.content.decode_as().map_err(|_| KmsError::Encoding)?;
    if envelope.recip_infos.0.len() != 1
        || envelope.originator_info.is_some()
        || envelope.unprotected_attrs.is_some()
    {
        return Err(KmsError::Encoding);
    }
    let Some(RecipientInfo::Ktri(key)) = envelope.recip_infos.0.iter().next() else {
        return Err(KmsError::Encoding);
    };
    validate_oaep(&key.key_enc_alg)?;
    let content = &envelope.encrypted_content;
    if content.content_type != DATA || content.content_enc_alg.oid != AES256_CBC {
        return Err(KmsError::Encoding);
    }
    let iv: der::asn1::OctetString = content
        .content_enc_alg
        .parameters
        .as_ref()
        .ok_or(KmsError::Encoding)?
        .decode_as()
        .map_err(|_| KmsError::Encoding)?;
    if iv.as_bytes().len() != 16 {
        return Err(KmsError::Encoding);
    }
    let encrypted = content
        .encrypted_content
        .as_ref()
        .ok_or(KmsError::Encoding)?;
    let cek = Zeroizing::new(
        recipient
            .0
            .decrypt_blinded(&mut OsRng, Oaep::new::<Sha256>(), key.enc_key.as_bytes())
            .map_err(|_| KmsError::Crypto)?,
    );
    let cipher = cbc::Decryptor::<aes::Aes256>::new_from_slices(&cek, iv.as_bytes())
        .map_err(|_| KmsError::Crypto)?;
    // In-place unpadding keeps even failed plaintext in a zeroizing allocation.
    let mut plaintext = Zeroizing::new(encrypted.as_bytes().to_vec());
    let len = cipher
        .decrypt_padded_mut::<Pkcs7>(&mut plaintext)
        .map_err(|_| KmsError::Crypto)?
        .len();
    // Wipe padding too before truncation (Vec zeroization covers only its length).
    use zeroize::Zeroize;
    plaintext[len..].zeroize();
    plaintext.truncate(len);
    Ok(plaintext)
}

/// Caller must durably persist the returned new blob via the parent before serving.
/// A failed unseal NEVER falls back to generating a replacement key.
pub async fn unseal_or_generate_escrow_key(
    kms: &dyn KmsClient,
    nsm: &dyn NsmDriver,
    recipient: &RecipientKey,
    sealed: Option<Vec<u8>>,
    key_id: &str,
) -> Result<(EscrowKeyPair, Option<Vec<u8>>), KmsError> {
    if key_id.is_empty()
        || key_id.len() > 128
        || !key_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
    {
        return Err(KmsError::Configuration);
    }
    let context = BTreeMap::from([
        ("purpose".into(), "escrow-enclave-key".into()),
        ("keyId".into(), key_id.into()),
    ]);
    if let Some(sealed) = sealed {
        let mut nonce = vec![0; 32];
        OsRng.fill_bytes(&mut nonce);
        let attestation = nsm
            .attest(AttestationRequest {
                user_data: key_id.as_bytes().to_vec(),
                nonce,
                public_key: Some(recipient.public_key_der()?),
            })
            .map_err(|_| KmsError::Attestation)?;
        let cms = kms
            .decrypt_for_recipient(&sealed, &context, &attestation)
            .await?;
        let pkcs8 = open_ciphertext_for_recipient(&cms, recipient)?;
        let secret = p256::SecretKey::from_pkcs8_der(&pkcs8).map_err(|_| KmsError::Crypto)?;
        let public = secret
            .public_key()
            .to_public_key_der()
            .map_err(|_| KmsError::Crypto)?;
        Ok((
            EscrowKeyPair {
                public_key: STANDARD.encode(public.as_bytes()),
                private_key: STANDARD.encode(&*pkcs8),
            },
            None,
        ))
    } else {
        let keys = crypto::generate_escrow_key_pair().map_err(|_| KmsError::Crypto)?;
        let pkcs8 = Zeroizing::new(
            STANDARD
                .decode(&keys.private_key)
                .map_err(|_| KmsError::Encoding)?,
        );
        let sealed = kms.encrypt(&pkcs8, &context).await?;
        if sealed.is_empty() {
            return Err(KmsError::UnexpectedResponse);
        }
        Ok((keys, Some(sealed)))
    }
}

#[cfg(test)]
mod tests;
