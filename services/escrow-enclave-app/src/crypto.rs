//! WebCrypto-compatible escrow envelopes. These primitives do not authorize release.
//! Returned secret-bearing types and temporary plaintext/key buffers zeroize on drop;
//! callers must likewise protect any copies they make. Never log these values.

use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use hkdf::Hkdf;
use p256::{
    ecdh::diffie_hellman,
    elliptic_curve::sec1::ToEncodedPoint,
    pkcs8::{DecodePrivateKey, DecodePublicKey, EncodePrivateKey, EncodePublicKey},
    PublicKey, SecretKey,
};
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use subtle::ConstantTimeEq;
use thiserror::Error;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use crate::wire::EscrowEnvelope;

pub const ESCROW_ENVELOPE_VERSION: u32 = 1;
pub const ESCROW_ALGORITHM: &str = "P-256-HKDF-SHA256-AES-256-GCM";
pub const ESCROW_BLOB_INFO: &str = "learncard-escrow-blob-v1";
pub const ESCROW_RELEASE_INFO: &str = "learncard-escrow-release-v1";
pub const ESCROW_CLIENT_KEY_ID: &str = "client";
/// Includes surrounding whitespace; checked before trimming or base64 allocation.
const MAX_ENCODED_KEY_BYTES: usize = 512;

/// Deliberately excludes underlying errors and secret input from diagnostics.
#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("Invalid escrow {0}")]
    Invalid(&'static str),
    #[error("Invalid escrow key")]
    Key,
    #[error("Escrow encryption or authentication failed")]
    Authentication,
    #[error("Invalid escrow plaintext JSON")]
    Json,
}

/// Base64 SPKI public key and PKCS#8 private key. No Debug implementation.
#[derive(Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase")]
pub struct EscrowKeyPair {
    pub public_key: String,
    pub private_key: String,
}

/// `share_version` mirrors JS Number.isInteger, not Number.isSafeInteger.
/// Policy must separately constrain versions to its own supported integer range.
#[derive(Clone, Serialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase")]
pub struct EscrowBlobPlaintext {
    pub version: u32,
    pub recovery_share: String,
    pub did: String,
    #[serde(serialize_with = "serialize_share_version")]
    pub share_version: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pin_verifier: Option<String>,
}

impl<'de> Deserialize<'de> for EscrowBlobPlaintext {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        // Guard completed fields during partial deserialization, as for releases below.
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct Fields {
            version: u32,
            #[serde(deserialize_with = "secret_string")]
            recovery_share: Zeroizing<String>,
            #[serde(deserialize_with = "secret_string")]
            did: Zeroizing<String>,
            share_version: f64,
            #[serde(default, deserialize_with = "optional_secret_string")]
            pin_verifier: Option<Zeroizing<String>>,
        }
        let mut fields = Fields::deserialize(d)?;
        Ok(Self {
            version: fields.version,
            recovery_share: std::mem::take(&mut *fields.recovery_share),
            did: std::mem::take(&mut *fields.did),
            share_version: fields.share_version,
            pin_verifier: fields
                .pin_verifier
                .as_mut()
                .map(|s| std::mem::take(&mut **s)),
        })
    }
}

fn serialize_share_version<S: serde::Serializer>(value: &f64, s: S) -> Result<S::Ok, S::Error> {
    // Keep JS's wider Number.isInteger range, but emit ordinary versions as 1, not 1.0.
    // The strict upper bound avoids saturating an f64 rounded up to 2^64.
    if value.is_finite() && *value >= 0.0 && *value < u64::MAX as f64 && value.fract() == 0.0 {
        s.serialize_u64(*value as u64)
    } else {
        s.serialize_f64(*value)
    }
}

#[derive(Clone, Serialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase")]
pub struct EscrowReleasePlaintext {
    #[serde(flatten)]
    pub blob: EscrowBlobPlaintext,
    pub hold_id: String,
}

impl<'de> Deserialize<'de> for EscrowReleasePlaintext {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        // Deserialize flat fields directly, without serde(flatten)'s owned Content buffer.
        // Each completed string is guarded even when a later field fails. serde_json's
        // internal scratch buffer for escaped strings (e.g. a Unicode-escaped DID) is
        // outside our control and is not wiped; this is best-effort memory hygiene,
        // not a claim that parser/compiler temporaries are comprehensively erased.
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct Fields {
            version: u32,
            #[serde(deserialize_with = "secret_string")]
            recovery_share: Zeroizing<String>,
            #[serde(deserialize_with = "secret_string")]
            did: Zeroizing<String>,
            share_version: f64,
            #[serde(default, deserialize_with = "optional_secret_string")]
            pin_verifier: Option<Zeroizing<String>>,
            #[serde(deserialize_with = "secret_string")]
            hold_id: Zeroizing<String>,
        }
        let mut fields = Fields::deserialize(d)?;
        Ok(Self {
            blob: EscrowBlobPlaintext {
                version: fields.version,
                recovery_share: std::mem::take(&mut *fields.recovery_share),
                did: std::mem::take(&mut *fields.did),
                share_version: fields.share_version,
                pin_verifier: fields
                    .pin_verifier
                    .as_mut()
                    .map(|s| std::mem::take(&mut **s)),
            },
            hold_id: std::mem::take(&mut *fields.hold_id),
        })
    }
}

fn secret_string<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Zeroizing<String>, D::Error> {
    String::deserialize(d).map(Zeroizing::new)
}

fn optional_secret_string<'de, D: serde::Deserializer<'de>>(
    d: D,
) -> Result<Option<Zeroizing<String>>, D::Error> {
    // Absent is optional; explicit null must still fail, as in the TS parser.
    secret_string(d).map(Some)
}

fn bounded(value: &str, field: &'static str, min: usize, max: usize) -> Result<(), CryptoError> {
    // JS string.length counts UTF-16 code units, not UTF-8 bytes or Unicode scalars.
    if !(min..=max).contains(&value.encode_utf16().count()) {
        return Err(CryptoError::Invalid(field));
    }
    Ok(())
}

fn identifier(value: &str, field: &'static str) -> Result<(), CryptoError> {
    bounded(value, field, 1, 128)?;
    if !value
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
    {
        return Err(CryptoError::Invalid(field));
    }
    Ok(())
}

impl EscrowBlobPlaintext {
    fn normalize(&mut self) -> Result<(), CryptoError> {
        if self.version != ESCROW_ENVELOPE_VERSION {
            return Err(CryptoError::Invalid("plaintext version"));
        }
        if !self.share_version.is_finite()
            || self.share_version <= 0.0
            || self.share_version.fract() != 0.0
        {
            return Err(CryptoError::Invalid("shareVersion"));
        }
        bounded(&self.recovery_share, "recoveryShare", 5, 4096)?;
        if !self.recovery_share.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err(CryptoError::Invalid("recoveryShare"));
        }
        self.recovery_share.make_ascii_lowercase();
        bounded(&self.did, "did", 1, 2048)?;
        if !self.did.starts_with("did:") {
            return Err(CryptoError::Invalid("did"));
        }
        if let Some(pin) = &mut self.pin_verifier {
            bounded(pin, "pinVerifier", 64, 64)?;
            if !pin.bytes().all(|b| b.is_ascii_hexdigit()) {
                return Err(CryptoError::Invalid("pinVerifier"));
            }
            pin.make_ascii_lowercase();
        }
        Ok(())
    }
}

fn validate_envelope(envelope: &EscrowEnvelope) -> Result<(), CryptoError> {
    if envelope.version != ESCROW_ENVELOPE_VERSION {
        return Err(CryptoError::Invalid("envelope version"));
    }
    if !bool::from(
        envelope
            .algorithm
            .as_bytes()
            .ct_eq(ESCROW_ALGORITHM.as_bytes()),
    ) {
        return Err(CryptoError::Invalid("algorithm"));
    }
    identifier(&envelope.key_id, "keyId")?;
    for (value, field, max) in [
        (&envelope.ephemeral_public_key, "ephemeralPublicKey", 256),
        (&envelope.salt, "salt", 128),
        (&envelope.iv, "iv", 64),
        (&envelope.ciphertext, "ciphertext", 16_384),
    ] {
        bounded(value, field, 1, max)?;
    }
    Ok(())
}

fn aad(envelope: &EscrowEnvelope) -> String {
    format!(
        "{}|{}|{}",
        envelope.version, envelope.algorithm, envelope.key_id
    )
}

fn decode(value: &str) -> Result<Vec<u8>, CryptoError> {
    STANDARD
        .decode(value)
        .map_err(|_| CryptoError::Invalid("base64"))
}

fn decode_key(value: &str, field: &'static str) -> Result<Vec<u8>, CryptoError> {
    if value.len() > MAX_ENCODED_KEY_BYTES {
        return Err(CryptoError::Invalid(field));
    }
    decode(value.trim())
}

fn aes_key(
    secret: &SecretKey,
    public: &PublicKey,
    salt: &[u8],
    info: &str,
) -> Result<Zeroizing<[u8; 32]>, CryptoError> {
    // RustCrypto SharedSecret zeroizes on drop; raw_secret_bytes is the 32-byte x coordinate.
    let shared = diffie_hellman(secret.to_nonzero_scalar(), public.as_affine());
    let mut key = Zeroizing::new([0u8; 32]);
    Hkdf::<Sha256>::new(Some(salt), shared.raw_secret_bytes())
        .expand(info.as_bytes(), key.as_mut())
        .map_err(|_| CryptoError::Key)?;
    Ok(key)
}

/// Generate an extractable P-256 pair in the same formats as WebCrypto.
pub fn generate_escrow_key_pair() -> Result<EscrowKeyPair, CryptoError> {
    let secret = SecretKey::random(&mut OsRng);
    let public = secret
        .public_key()
        .to_public_key_der()
        .map_err(|_| CryptoError::Key)?;
    let private = secret.to_pkcs8_der().map_err(|_| CryptoError::Key)?;
    Ok(EscrowKeyPair {
        public_key: STANDARD.encode(public.as_bytes()),
        private_key: STANDARD.encode(private.as_bytes()),
    })
}

fn encrypt(
    plaintext: &[u8],
    spki: &str,
    key_id: &str,
    info: &str,
) -> Result<EscrowEnvelope, CryptoError> {
    identifier(key_id, "keyId")?;
    let public = PublicKey::from_public_key_der(&decode_key(spki, "publicKey")?)
        .map_err(|_| CryptoError::Key)?;
    let secret = SecretKey::random(&mut OsRng);
    let mut salt = [0u8; 32];
    let mut iv = [0u8; 12];
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut iv);
    let key = aes_key(&secret, &public, &salt, info)?;
    let cipher = Aes256Gcm::new_from_slice(key.as_ref()).map_err(|_| CryptoError::Key)?;
    let mut envelope = EscrowEnvelope {
        version: ESCROW_ENVELOPE_VERSION,
        algorithm: ESCROW_ALGORITHM.into(),
        key_id: key_id.into(),
        ephemeral_public_key: STANDARD
            .encode(secret.public_key().to_encoded_point(false).as_bytes()),
        salt: STANDARD.encode(salt),
        iv: STANDARD.encode(iv),
        ciphertext: String::new(),
    };
    envelope.ciphertext = STANDARD.encode(
        cipher
            .encrypt(
                Nonce::from_slice(&iv),
                Payload {
                    msg: plaintext,
                    aad: aad(&envelope).as_bytes(),
                },
            )
            .map_err(|_| CryptoError::Authentication)?,
    );
    Ok(envelope)
}

fn decrypt(
    envelope: &EscrowEnvelope,
    pkcs8: &str,
    info: &str,
) -> Result<Zeroizing<Vec<u8>>, CryptoError> {
    validate_envelope(envelope)?;
    let der = Zeroizing::new(decode_key(pkcs8, "privateKey")?);
    let secret = SecretKey::from_pkcs8_der(&der).map_err(|_| CryptoError::Key)?;
    let point = decode(&envelope.ephemeral_public_key)?;
    if point.len() != 65 || point.first() != Some(&4) {
        return Err(CryptoError::Invalid("ephemeralPublicKey"));
    }
    let public = PublicKey::from_sec1_bytes(&point).map_err(|_| CryptoError::Key)?;
    let salt = decode(&envelope.salt)?;
    let iv = decode(&envelope.iv)?;
    if salt.len() != 32 || iv.len() != 12 {
        return Err(CryptoError::Invalid("salt or iv length"));
    }
    let key = aes_key(&secret, &public, &salt, info)?;
    let cipher = Aes256Gcm::new_from_slice(key.as_ref()).map_err(|_| CryptoError::Key)?;
    cipher
        .decrypt(
            Nonce::from_slice(&iv),
            Payload {
                msg: &decode(&envelope.ciphertext)?,
                aad: aad(envelope).as_bytes(),
            },
        )
        .map(Zeroizing::new)
        .map_err(|_| CryptoError::Authentication)
}

/// Normalize and encrypt a recovery share to the enclave's SPKI public key.
pub fn encrypt_escrow_blob(
    plaintext: &EscrowBlobPlaintext,
    recipient_spki_b64: &str,
    key_id: &str,
) -> Result<EscrowEnvelope, CryptoError> {
    let mut plaintext = plaintext.clone();
    plaintext.version = ESCROW_ENVELOPE_VERSION;
    plaintext.normalize()?;
    let json = Zeroizing::new(serde_json::to_vec(&plaintext).map_err(|_| CryptoError::Json)?);
    encrypt(&json, recipient_spki_b64, key_id, ESCROW_BLOB_INFO)
}

/// Authenticate, decrypt, and validate a blob. Unknown plaintext fields are omitted.
pub fn decrypt_escrow_blob(
    envelope: &EscrowEnvelope,
    private_pkcs8_b64: &str,
) -> Result<EscrowBlobPlaintext, CryptoError> {
    let json = decrypt(envelope, private_pkcs8_b64, ESCROW_BLOB_INFO)?;
    let mut plaintext: EscrowBlobPlaintext =
        serde_json::from_slice(&json).map_err(|_| CryptoError::Json)?;
    plaintext.normalize()?;
    Ok(plaintext)
}

/// Seal a release to the client's SPKI key, with the fixed key ID `client`.
pub fn seal_escrow_release(
    plaintext: &EscrowReleasePlaintext,
    client_spki_b64: &str,
) -> Result<EscrowEnvelope, CryptoError> {
    let mut plaintext = plaintext.clone();
    plaintext.blob.version = ESCROW_ENVELOPE_VERSION;
    plaintext.blob.normalize()?;
    identifier(&plaintext.hold_id, "holdId")?;
    let json = Zeroizing::new(serde_json::to_vec(&plaintext).map_err(|_| CryptoError::Json)?);
    encrypt(
        &json,
        client_spki_b64,
        ESCROW_CLIENT_KEY_ID,
        ESCROW_RELEASE_INFO,
    )
}

/// Authenticate, open, and validate a release using the client's PKCS#8 key.
pub fn open_escrow_release(
    envelope: &EscrowEnvelope,
    client_private_pkcs8_b64: &str,
) -> Result<EscrowReleasePlaintext, CryptoError> {
    let json = decrypt(envelope, client_private_pkcs8_b64, ESCROW_RELEASE_INFO)?;
    let mut plaintext: EscrowReleasePlaintext =
        serde_json::from_slice(&json).map_err(|_| CryptoError::Json)?;
    plaintext.blob.normalize()?;
    identifier(&plaintext.hold_id, "holdId")?;
    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    #[derive(Serialize, Deserialize)]
    struct Vector<T> {
        plaintext: T,
        envelope: EscrowEnvelope,
    }
    #[derive(Deserialize)]
    struct Vectors {
        enclave: EscrowKeyPair,
        client: EscrowKeyPair,
        blobs: Vec<Vector<EscrowBlobPlaintext>>,
        releases: Vec<Vector<EscrowReleasePlaintext>>,
    }

    fn fixtures() -> Vectors {
        serde_json::from_str(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
        )))
        .unwrap()
    }

    #[test]
    fn rust_vectors_roundtrip() {
        #[derive(Serialize, Deserialize)]
        struct RustVectors {
            enclave: EscrowKeyPair,
            blobs: Vec<Vector<EscrowBlobPlaintext>>,
            releases: Vec<Vector<EscrowReleasePlaintext>>,
        }
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/sss-key-manager/src/__fixtures__/escrow-vectors-rust.json");
        let ts = fixtures();
        if std::env::var("ESCROW_WRITE_RUST_VECTORS").as_deref() == Ok("1") {
            let enclave = generate_escrow_key_pair().unwrap();
            let blobs = ts
                .blobs
                .iter()
                .take(2)
                .map(|v| Vector {
                    envelope: encrypt_escrow_blob(&v.plaintext, &enclave.public_key, "rust-key.1")
                        .unwrap(),
                    plaintext: v.plaintext.clone(),
                })
                .collect();
            let releases = ts
                .releases
                .iter()
                .map(|v| Vector {
                    envelope: seal_escrow_release(&v.plaintext, &ts.client.public_key).unwrap(),
                    plaintext: v.plaintext.clone(),
                })
                .collect();
            let vectors = RustVectors {
                enclave,
                blobs,
                releases,
            };
            // These are intentionally public test keys and fake recovery shares only.
            std::fs::write(
                &path,
                serde_json::to_string_pretty(&vectors).unwrap() + "\n",
            )
            .unwrap();
        }
        let vectors: RustVectors = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
        assert_eq!(vectors.blobs.len(), 2);
        assert_eq!(vectors.releases.len(), 2);
        for vector in &vectors.blobs {
            same(
                &decrypt_escrow_blob(&vector.envelope, &vectors.enclave.private_key).unwrap(),
                &vector.plaintext,
            );
            assert_integral_json(
                &vector.envelope,
                &vectors.enclave.private_key,
                ESCROW_BLOB_INFO,
                vector.plaintext.share_version,
            );
        }
        for vector in &vectors.releases {
            same(
                &open_escrow_release(&vector.envelope, &ts.client.private_key).unwrap(),
                &vector.plaintext,
            );
            assert_integral_json(
                &vector.envelope,
                &ts.client.private_key,
                ESCROW_RELEASE_INFO,
                vector.plaintext.blob.share_version,
            );
        }
    }

    fn assert_integral_json(envelope: &EscrowEnvelope, private: &str, info: &str, version: f64) {
        let bytes = decrypt(envelope, private, info).unwrap();
        let text = std::str::from_utf8(&bytes).unwrap();
        let token = format!("\"shareVersion\":{}", version as u64);
        assert!(text.contains(&(token.clone() + ",")) || text.contains(&(token.clone() + "}")));
        assert!(!text.contains(&(token + ".")));
    }

    #[test]
    fn rejects_oversized_keys_before_base64_decoding() {
        let ts = fixtures();
        for oversized in [
            "A".repeat(516),
            "!".repeat(513),
            format!("{}{}", " ".repeat(512), ts.client.public_key),
        ] {
            assert!(matches!(
                encrypt_escrow_blob(&ts.blobs[0].plaintext, &oversized, "client"),
                Err(CryptoError::Invalid("publicKey"))
            ));
            assert!(matches!(
                seal_escrow_release(&ts.releases[0].plaintext, &oversized),
                Err(CryptoError::Invalid("publicKey"))
            ));
            assert!(matches!(
                decrypt_escrow_blob(&ts.blobs[0].envelope, &oversized),
                Err(CryptoError::Invalid("privateKey"))
            ));
            assert!(matches!(
                open_escrow_release(&ts.releases[0].envelope, &oversized),
                Err(CryptoError::Invalid("privateKey"))
            ));
        }
        // Boundary is admitted to decoding, rather than misclassified as oversized.
        assert_eq!(
            decode_key(&"A".repeat(512), "publicKey").unwrap().len(),
            384
        );
    }

    fn same<T: Serialize>(a: &T, b: &T) {
        assert_eq!(
            serde_json::to_value(a).unwrap(),
            serde_json::to_value(b).unwrap()
        );
    }

    fn format(envelope: &EscrowEnvelope, key_id: &str) {
        validate_envelope(envelope).unwrap();
        assert_eq!(
            aad(envelope),
            format!("1|P-256-HKDF-SHA256-AES-256-GCM|{key_id}")
        );
        let point = decode(&envelope.ephemeral_public_key).unwrap();
        assert_eq!(point.len(), 65);
        assert_eq!(point[0], 4);
        assert_eq!(decode(&envelope.salt).unwrap().len(), 32);
        assert_eq!(decode(&envelope.iv).unwrap().len(), 12);
        assert!(decode(&envelope.ciphertext).unwrap().len() > 16);
    }

    #[test]
    fn ts_vectors_roundtrip() {
        let vectors = fixtures();
        assert_eq!(vectors.blobs.len(), 3);
        assert_eq!(vectors.releases.len(), 2);
        for vector in vectors.blobs {
            let plaintext =
                decrypt_escrow_blob(&vector.envelope, &vectors.enclave.private_key).unwrap();
            same(&plaintext, &vector.plaintext);
            let sealed = encrypt_escrow_blob(
                &plaintext,
                &vectors.enclave.public_key,
                &vector.envelope.key_id,
            )
            .unwrap();
            format(&sealed, &vector.envelope.key_id);
            same(
                &decrypt_escrow_blob(&sealed, &vectors.enclave.private_key).unwrap(),
                &plaintext,
            );
        }
        for vector in vectors.releases {
            let plaintext =
                open_escrow_release(&vector.envelope, &vectors.client.private_key).unwrap();
            same(&plaintext, &vector.plaintext);
            let sealed = seal_escrow_release(&plaintext, &vectors.client.public_key).unwrap();
            format(&sealed, "client");
            same(
                &open_escrow_release(&sealed, &vectors.client.private_key).unwrap(),
                &plaintext,
            );
        }
    }

    #[test]
    fn fresh_randomness_wrong_keys_tampering_and_domains() {
        let keys = generate_escrow_key_pair().unwrap();
        let wrong = generate_escrow_key_pair().unwrap();
        let plaintext = &fixtures().releases[0].plaintext;
        let a = encrypt_escrow_blob(&plaintext.blob, &keys.public_key, "client").unwrap();
        let b = encrypt_escrow_blob(&plaintext.blob, &keys.public_key, "client").unwrap();
        let release = seal_escrow_release(plaintext, &keys.public_key).unwrap();
        assert_ne!(a.ephemeral_public_key, b.ephemeral_public_key);
        assert_ne!(a.salt, b.salt);
        assert_ne!(a.iv, b.iv);
        assert_ne!(a.ciphertext, b.ciphertext);
        assert!(matches!(
            open_escrow_release(&a, &keys.private_key),
            Err(CryptoError::Authentication)
        ));
        assert!(matches!(
            decrypt_escrow_blob(&release, &keys.private_key),
            Err(CryptoError::Authentication)
        ));
        for (envelope, info) in [(&a, ESCROW_BLOB_INFO), (&release, ESCROW_RELEASE_INFO)] {
            assert!(decrypt(envelope, &wrong.private_key, info).is_err());
            let mut changed = envelope.clone();
            changed.key_id = "other".into();
            assert!(matches!(
                decrypt(&changed, &keys.private_key, info),
                Err(CryptoError::Authentication)
            ));
            for field in ["ciphertext", "salt", "iv", "ephemeralPublicKey"] {
                let mut value = serde_json::to_value(envelope).unwrap();
                let mut bytes = decode(value[field].as_str().unwrap()).unwrap();
                let last = bytes.len() - 1;
                bytes[last] ^= 1;
                value[field] = json!(STANDARD.encode(bytes));
                let changed = serde_json::from_value(value).unwrap();
                assert!(decrypt(&changed, &keys.private_key, info).is_err());
            }
        }
    }

    #[test]
    fn plaintext_validation_after_authentication() {
        let keys = generate_escrow_key_pair().unwrap();
        let base = json!({"version":1,"recoveryShare":"ABCDE","did":"did:","shareVersion":1,"holdId":"hold"});
        for (field, bad) in [
            ("version", json!(2)),
            ("recoveryShare", json!("abcd")),
            ("recoveryShare", json!("abcgh")),
            ("recoveryShare", json!("a".repeat(4097))),
            ("did", json!("no:did")),
            ("did", json!(format!("did:{}", "x".repeat(2045)))),
            ("shareVersion", json!(0)),
            ("shareVersion", json!(-1)),
            ("shareVersion", json!(1.5)),
            ("pinVerifier", Value::Null),
            ("pinVerifier", json!("a".repeat(63))),
            ("pinVerifier", json!("g".repeat(64))),
            ("holdId", json!("bad|hold")),
            ("holdId", json!("a".repeat(129))),
        ] {
            let mut bad_json = base.clone();
            bad_json[field] = bad;
            let envelope = encrypt(
                &serde_json::to_vec(&bad_json).unwrap(),
                &keys.public_key,
                "client",
                ESCROW_RELEASE_INFO,
            )
            .unwrap();
            assert!(
                open_escrow_release(&envelope, &keys.private_key).is_err(),
                "{field}"
            );
        }
        let envelope = encrypt(
            &serde_json::to_vec(&base).unwrap(),
            &keys.public_key,
            "client",
            ESCROW_BLOB_INFO,
        )
        .unwrap();
        let parsed = decrypt_escrow_blob(&envelope, &keys.private_key).unwrap();
        assert_eq!(parsed.recovery_share, "abcde");
        assert!(serde_json::to_value(parsed)
            .unwrap()
            .get("holdId")
            .is_none());
    }

    #[test]
    fn envelope_bounds_and_malformed_encodings() {
        let vector = &fixtures().blobs[0];
        for (field, max) in [
            ("keyId", 128),
            ("ephemeralPublicKey", 256),
            ("salt", 128),
            ("iv", 64),
            ("ciphertext", 16384),
        ] {
            for bad in [String::new(), "a".repeat(max + 1)] {
                let mut value = serde_json::to_value(&vector.envelope).unwrap();
                value[field] = json!(bad);
                assert!(validate_envelope(&serde_json::from_value(value).unwrap()).is_err());
            }
        }
        for (field, bad) in [
            ("version", json!(2)),
            ("algorithm", json!("AES-GCM")),
            ("keyId", json!("bad|key")),
            ("iv", json!("AA==")),
            ("salt", json!("!")),
            ("ephemeralPublicKey", json!("BA==")),
            ("ciphertext", json!("AA==")),
        ] {
            let mut value = serde_json::to_value(&vector.envelope).unwrap();
            value[field] = bad;
            assert!(decrypt_escrow_blob(
                &serde_json::from_value(value).unwrap(),
                &fixtures().enclave.private_key
            )
            .is_err());
        }
    }
}
