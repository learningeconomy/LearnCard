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
use p256::pkcs8::{EncodePrivateKey, EncodePublicKey};
use rand_core::{OsRng, RngCore};
use rsa::{pkcs8::spki::AlgorithmIdentifierOwned, Oaep, RsaPrivateKey};
use sha2::Sha256;
use thiserror::Error;
use zeroize::Zeroizing;

use crate::{
    crypto::EscrowKeyPair,
    nsm::{AttestationRequest, NsmDriver},
};

#[cfg(feature = "kms")]
mod aws;
mod ber;
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
pub struct GeneratedDataKey {
    pub ciphertext_for_recipient: Vec<u8>,
    pub ciphertext_blob: Vec<u8>,
}
pub type GenerateFuture<'a> =
    Pin<Box<dyn Future<Output = Result<GeneratedDataKey, KmsError>> + Send + 'a>>;

pub trait KmsClient: Send + Sync {
    fn decrypt_for_recipient<'a>(
        &'a self,
        ciphertext: &'a [u8],
        encryption_context: &'a BTreeMap<String, String>,
        attestation_document: &'a [u8],
    ) -> KmsFuture<'a>;
    fn generate_data_key_for_recipient<'a>(
        &'a self,
        encryption_context: &'a BTreeMap<String, String>,
        attestation_document: &'a [u8],
    ) -> GenerateFuture<'a>;
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

struct RecipientEnvelope {
    encrypted_key: Vec<u8>,
    iv: Vec<u8>,
    ciphertext: Vec<u8>,
}

/// KMS BER normalised to DER, then strict CMS: one RSA-OAEP SHA-256 recipient,
/// AES-256-CBC and PKCS#7 only. No fallback to direct RSA, legacy padding,
/// SHA-1 or another content cipher.
fn parse_ciphertext_for_recipient(cms_ber: &[u8]) -> Result<RecipientEnvelope, KmsError> {
    let cms_der = ber::normalize_kms_cms(cms_ber)?;
    let info = ContentInfo::from_der(&cms_der).map_err(|_| KmsError::Encoding)?;
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
    let ciphertext = content
        .encrypted_content
        .as_ref()
        .ok_or(KmsError::Encoding)?;
    Ok(RecipientEnvelope {
        encrypted_key: key.enc_key.as_bytes().to_vec(),
        iv: iv.as_bytes().to_vec(),
        ciphertext: ciphertext.as_bytes().to_vec(),
    })
}

pub fn open_ciphertext_for_recipient(
    cms_ber: &[u8],
    recipient: &RecipientKey,
) -> Result<Zeroizing<Vec<u8>>, KmsError> {
    let envelope = parse_ciphertext_for_recipient(cms_ber)?;
    let cek = Zeroizing::new(
        recipient
            .0
            .decrypt_blinded(&mut OsRng, Oaep::new::<Sha256>(), &envelope.encrypted_key)
            .map_err(|_| KmsError::Crypto)?,
    );
    let cipher = cbc::Decryptor::<aes::Aes256>::new_from_slices(&cek, &envelope.iv)
        .map_err(|_| KmsError::Crypto)?;
    // In-place unpadding keeps even failed plaintext in a zeroizing allocation.
    let mut plaintext = Zeroizing::new(envelope.ciphertext);
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
    let mut nonce = vec![0; 32];
    OsRng.fill_bytes(&mut nonce);
    let attestation = nsm
        .attest(AttestationRequest {
            user_data: key_id.as_bytes().to_vec(),
            nonce,
            public_key: Some(recipient.public_key_der()?),
        })
        .map_err(|_| KmsError::Attestation)?;
    let (cms, new_blob) = if let Some(sealed) = sealed {
        let cms = kms
            .decrypt_for_recipient(&sealed, &context, &attestation)
            .await?;
        (cms, None)
    } else {
        let generated = kms
            .generate_data_key_for_recipient(&context, &attestation)
            .await?;
        if generated.ciphertext_blob.is_empty() || generated.ciphertext_for_recipient.is_empty() {
            return Err(KmsError::UnexpectedResponse);
        }
        (
            generated.ciphertext_for_recipient,
            Some(generated.ciphertext_blob),
        )
    };
    let seed = open_ciphertext_for_recipient(&cms, recipient)?;
    Ok((derive_escrow_key(&seed, key_id)?, new_blob))
}

fn derive_escrow_key(seed: &[u8], key_id: &str) -> Result<EscrowKeyPair, KmsError> {
    if seed.len() != 32 {
        return Err(KmsError::UnexpectedResponse);
    }
    let hkdf = hkdf::Hkdf::<Sha256>::new(Some(b"learncard-escrow-seed-v1"), seed);
    for counter in 0u32..256 {
        let mut info = b"ecdh-p256-escrow-key\0".to_vec();
        info.extend_from_slice(&(key_id.len() as u32).to_be_bytes());
        info.extend_from_slice(key_id.as_bytes());
        info.extend_from_slice(&counter.to_be_bytes());
        let mut scalar = Zeroizing::new([0u8; 32]);
        hkdf.expand(&info, scalar.as_mut())
            .map_err(|_| KmsError::Crypto)?;
        if let Ok(secret) = p256::SecretKey::from_slice(scalar.as_ref()) {
            let private = secret.to_pkcs8_der().map_err(|_| KmsError::Crypto)?;
            let public = secret
                .public_key()
                .to_public_key_der()
                .map_err(|_| KmsError::Crypto)?;
            return Ok(EscrowKeyPair {
                private_key: STANDARD.encode(private.as_bytes()),
                public_key: STANDARD.encode(public.as_bytes()),
            });
        }
    }
    Err(KmsError::Crypto)
}

#[cfg(test)]
mod tests;
