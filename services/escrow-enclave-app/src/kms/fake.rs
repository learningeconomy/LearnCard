//! TEST ONLY: parses attestation claims but does not authenticate Nitro signatures.
use super::*;
use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use cbc::cipher::BlockEncryptMut;
use cms::{
    content_info::CmsVersion,
    enveloped_data::{
        EncryptedContentInfo, KeyTransRecipientInfo, RecipientIdentifier, RecipientInfos,
    },
};
use der::{
    asn1::{OctetString, SetOfVec},
    Any, Encode,
};
use rsa::{pkcs8::DecodePublicKey, RsaPublicKey};

/// In-memory KMS substitute. A fresh instance cannot open another instance's blobs.
/// Bind each instance to the expected boot recipient; optional PCR0 pins mimic policy.
pub struct FakeKmsClient {
    key: Zeroizing<[u8; 32]>,
    recipient_spki: Vec<u8>,
    allowed_pcr0: Option<Vec<[u8; 48]>>,
}

impl FakeKmsClient {
    pub fn new(
        recipient_spki: Vec<u8>,
        allowed_pcr0: Option<Vec<[u8; 48]>>,
    ) -> Result<Self, KmsError> {
        use rsa::traits::PublicKeyParts;
        let public =
            RsaPublicKey::from_public_key_der(&recipient_spki).map_err(|_| KmsError::Encoding)?;
        if public.n().bits() != 2048 {
            return Err(KmsError::Configuration);
        }
        let mut key = Zeroizing::new([0; 32]);
        OsRng.fill_bytes(key.as_mut());
        Ok(Self {
            key,
            recipient_spki,
            allowed_pcr0,
        })
    }

    /// Simulate a new boot without rotating the fake service's persistent KMS key.
    pub fn set_recipient(&mut self, recipient: &RecipientKey) -> Result<(), KmsError> {
        self.recipient_spki = recipient.public_key_der()?;
        Ok(())
    }
}

fn context_bytes(context: &BTreeMap<String, String>) -> Result<Vec<u8>, KmsError> {
    if context.get("purpose").map(String::as_str) != Some("escrow-enclave-key") {
        return Err(KmsError::Configuration);
    }
    serde_json::to_vec(context).map_err(|_| KmsError::Encoding)
}

impl KmsClient for FakeKmsClient {
    fn encrypt<'a>(
        &'a self,
        plaintext: &'a [u8],
        context: &'a BTreeMap<String, String>,
    ) -> KmsFuture<'a> {
        Box::pin(async move {
            let aad = context_bytes(context)?;
            let cipher =
                Aes256Gcm::new_from_slice(self.key.as_ref()).map_err(|_| KmsError::Crypto)?;
            let mut nonce = [0; 12];
            OsRng.fill_bytes(&mut nonce);
            let encrypted = cipher
                .encrypt(
                    Nonce::from_slice(&nonce),
                    Payload {
                        msg: plaintext,
                        aad: &aad,
                    },
                )
                .map_err(|_| KmsError::Crypto)?;
            let mut sealed = nonce.to_vec();
            sealed.extend(encrypted);
            Ok(sealed)
        })
    }

    fn decrypt_for_recipient<'a>(
        &'a self,
        ciphertext: &'a [u8],
        context: &'a BTreeMap<String, String>,
        document: &'a [u8],
    ) -> KmsFuture<'a> {
        Box::pin(async move {
            let claims = crate::nsm::parse_attestation_document(document)
                .map_err(|_| KmsError::Attestation)?;
            if claims.public_key.as_ref().map(|key| key.as_slice())
                != Some(self.recipient_spki.as_slice())
            {
                return Err(KmsError::Attestation);
            }
            if let Some(allowed) = &self.allowed_pcr0 {
                let pcr = claims.pcrs.get(&0).ok_or(KmsError::Attestation)?;
                if !allowed.iter().any(|pin| pin.as_slice() == pcr.as_slice()) {
                    return Err(KmsError::Attestation);
                }
            }
            let aad = context_bytes(context)?;
            if ciphertext.len() < 28 {
                return Err(KmsError::Crypto);
            }
            let cipher =
                Aes256Gcm::new_from_slice(self.key.as_ref()).map_err(|_| KmsError::Crypto)?;
            let plaintext = Zeroizing::new(
                cipher
                    .decrypt(
                        Nonce::from_slice(&ciphertext[..12]),
                        Payload {
                            msg: &ciphertext[12..],
                            aad: &aad,
                        },
                    )
                    .map_err(|_| KmsError::Crypto)?,
            );
            wrap(&plaintext, &self.recipient_spki)
        })
    }
}

pub(super) fn wrap(plaintext: &[u8], spki: &[u8]) -> Result<Vec<u8>, KmsError> {
    let encode = || -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let public = RsaPublicKey::from_public_key_der(spki)?;
        let mut cek = Zeroizing::new([0; 32]);
        let mut iv = [0; 16];
        OsRng.fill_bytes(cek.as_mut());
        OsRng.fill_bytes(&mut iv);
        let wrapped = public.encrypt(&mut OsRng, Oaep::new::<Sha256>(), cek.as_ref())?;
        let cipher = cbc::Encryptor::<aes::Aes256>::new_from_slices(cek.as_ref(), &iv)?;
        let mut buffer = Zeroizing::new(vec![0; plaintext.len() + 16]);
        buffer[..plaintext.len()].copy_from_slice(plaintext);
        let encrypted = cipher
            .encrypt_padded_mut::<Pkcs7>(&mut buffer, plaintext.len())
            .map_err(|_| KmsError::Crypto)?;
        let hash = AlgorithmIdentifierOwned {
            oid: SHA256,
            parameters: Some(Any::null()),
        };
        let params = OaepParameters {
            hash: hash.clone(),
            mask: AlgorithmIdentifierOwned {
                oid: MGF1,
                parameters: Some(Any::encode_from(&hash)?),
            },
            source: None,
        };
        let key = KeyTransRecipientInfo {
            version: CmsVersion::V2,
            rid: RecipientIdentifier::SubjectKeyIdentifier(OctetString::new(vec![1])?.into()),
            key_enc_alg: AlgorithmIdentifierOwned {
                oid: OAEP,
                parameters: Some(Any::encode_from(&params)?),
            },
            enc_key: OctetString::new(wrapped)?,
        };
        let envelope = EnvelopedData {
            version: CmsVersion::V2,
            originator_info: None,
            unprotected_attrs: None,
            recip_infos: RecipientInfos(SetOfVec::try_from(vec![RecipientInfo::Ktri(key)])?),
            encrypted_content: EncryptedContentInfo {
                content_type: DATA,
                content_enc_alg: AlgorithmIdentifierOwned {
                    oid: AES256_CBC,
                    parameters: Some(Any::encode_from(&OctetString::new(iv.to_vec())?)?),
                },
                encrypted_content: Some(OctetString::new(encrypted.to_vec())?),
            },
        };
        Ok(ContentInfo {
            content_type: ENVELOPED,
            content: Any::encode_from(&envelope)?,
        }
        .to_der()?)
    };
    encode().map_err(|_| KmsError::Crypto)
}
