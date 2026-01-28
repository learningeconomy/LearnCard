use std::convert::TryFrom;

use didkit::{error::Error, ssi::jwk::Params, DID_METHODS, JWK};
use sha2::Digest;

use anyhow::Result;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use byteorder::{BigEndian, WriteBytesExt};
use chacha20poly1305::{
    aead::{Aead, Payload},
    KeyInit, XChaCha20Poly1305, XNonce,
};
use rand_chacha::{
    rand_core::{OsRng, RngCore, SeedableRng},
    ChaCha20Rng,
};
use serde::{Deserialize, Serialize};
use x25519_dalek::{PublicKey as X25519Public, StaticSecret};

#[derive(Serialize, Deserialize)]
struct ProtectedHeader {
    enc: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RecipientHeader {
    alg: String,
    iv: String,
    tag: String,
    epk: EphemeralPublicKey,
    kid: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Recipient {
    encrypted_key: String,
    header: RecipientHeader,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct EphemeralPublicKey {
    kty: String,
    crv: String,
    x: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JWE {
    #[serde(rename = "protected")]
    protected_header: String,
    iv: String,
    ciphertext: String,
    tag: String,
    recipients: Vec<RecipientInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct RecipientInfo {
    encrypted_key: String,
    header: RecipientHeader,
}

impl JWE {
    /// Encrypts content to multiple recipients using XChaCha20Poly1305
    ///
    /// # Arguments
    /// * `content` - Byte slice of the content to encrypt
    /// * `recipients` - List of recipient DIDs
    pub async fn encrypt(content: &[u8], recipients: &[String]) -> Result<Self, Error> {
        let mut rng = ChaCha20Rng::from_rng(OsRng).unwrap();

        let mut iv = [0u8; 24];
        rng.fill_bytes(&mut iv);

        let protected = ProtectedHeader {
            enc: "XC20P".to_string(),
        };
        let protected_b64 = URL_SAFE_NO_PAD.encode(serde_json::to_string(&protected)?.as_bytes());

        // Generate content encryption key (CEK)
        let mut cek = [0u8; 32];
        rng.fill_bytes(&mut cek);

        let mut recipient_infos = Vec::new();

        for recipient_did in recipients {
            let resolver = DID_METHODS.to_resolver();
            let (res_meta, doc, _) = resolver.resolve(recipient_did, &Default::default()).await;

            if res_meta.error.is_some() {
                continue; // Skip this recipient on resolution error
            }

            let Some(doc) = doc else {
                continue;
            };

            // Find key agreement keys
            let Some(key_agreements) = doc.key_agreement.as_ref() else {
                continue;
            };

            for key_agreement in key_agreements {
                // Try to extract X25519 public key from various verification method encodings
                let recipient_x25519_opt: Option<X25519Public> = match &key_agreement {
                    didkit::ssi::did::VerificationMethod::Map(vm) => {
                        // 1) publicKeyBase58 (X25519KeyAgreementKey2019 format)
                        if let Some(ref pk_b58) = vm.public_key_base58 {
                            // Decode base58 to get raw X25519 bytes
                            if let Ok(decoded) = bs58::decode(pk_b58).into_vec() {
                                if decoded.len() == 32 {
                                    <[u8; 32]>::try_from(&decoded[..])
                                        .ok()
                                        .map(X25519Public::from)
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        // 2) publicKeyJwk with crv X25519
                        } else if let Some(ref jwk) = vm.public_key_jwk {
                            match &jwk.params {
                                Params::OKP(okp) if okp.curve == "X25519" => {
                                    if okp.public_key.0.len() == 32 {
                                        if let Ok(bytes) = <[u8; 32]>::try_from(&okp.public_key.0[..]) {
                                            Some(X25519Public::from(bytes))
                                        } else {
                                            None
                                        }
                                    } else {
                                        None
                                    }
                                }
                                _ => None,
                            }
                        // 3) publicKeyMultibase (Multikey format)
                        } else if let Some(ref props) = vm.property_set {
                            if let Some(serde_json::Value::String(multibase_str)) = props.get("publicKeyMultibase") {
                                // Decode multibase (typically base58btc for X25519)
                                if let Ok((_, bytes)) = multibase::decode(multibase_str) {
                                    // X25519 keys in multibase format typically have a 2-byte multicodec prefix (0xec 0x01)
                                    // The actual key is 32 bytes after the prefix
                                    let key_bytes = if bytes.len() == 34 && bytes[0] == 0xec && bytes[1] == 0x01 {
                                        &bytes[2..]
                                    } else if bytes.len() == 32 {
                                        &bytes[..]
                                    } else {
                                        &[][..]
                                    };
                                    
                                    if key_bytes.len() == 32 {
                                        <[u8; 32]>::try_from(key_bytes)
                                            .ok()
                                            .map(X25519Public::from)
                                    } else {
                                        None
                                    }
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        } else {
                            None
                        }
                    }
                    _ => None,
                };

                let Some(recipient_x25519) = recipient_x25519_opt else {
                    continue;
                };

                let vm_id = key_agreement.get_id(&doc.id);

                // Generate ephemeral key pair
                let ephemeral_secret = StaticSecret::random_from_rng(&mut rng);
                let ephemeral_public = X25519Public::from(&ephemeral_secret);

                // Compute shared secret
                let shared_secret = ephemeral_secret.diffie_hellman(&recipient_x25519);

                // Derive KEK using concatKDF
                let kek = concat_kdf(shared_secret.as_bytes(), 256, "ECDH-ES+XC20PKW", None);

                // Encrypt the CEK with KEK
                let Ok(cipher) = XChaCha20Poly1305::new_from_slice(&kek) else {
                    continue;
                };

                let mut recipient_iv = [0u8; 24];
                rng.fill_bytes(&mut recipient_iv);

                let nonce = XNonce::from_slice(&recipient_iv);

                let Ok(mut encrypted_cek) = cipher.encrypt(nonce, cek.as_slice()) else {
                    continue;
                };

                // Split encrypted CEK and tag
                let recipient_tag = encrypted_cek.split_off(encrypted_cek.len() - 16);

                recipient_infos.push(RecipientInfo {
                    encrypted_key: URL_SAFE_NO_PAD.encode(encrypted_cek),
                    header: RecipientHeader {
                        alg: "ECDH-ES+XC20PKW".to_string(),
                        iv: URL_SAFE_NO_PAD.encode(recipient_iv),
                        tag: URL_SAFE_NO_PAD.encode(recipient_tag),
                        epk: EphemeralPublicKey {
                            kty: "OKP".to_string(),
                            crv: "X25519".to_string(),
                            x: URL_SAFE_NO_PAD.encode(ephemeral_public.as_bytes()),
                        },
                        kid: vm_id.clone(),
                    },
                });
            }
        }

        if recipient_infos.is_empty() {
            return Err(Error::UnableToGenerateDID);
        }

        let cipher = XChaCha20Poly1305::new_from_slice(&cek)
            .map_err(|_| Error::JWK(didkit::ssi::jwk::Error::InvalidKeyLength(cek.len())))?;

        let nonce = XNonce::from_slice(&iv);

        let payload = Payload {
            msg: content,
            aad: protected_b64.as_bytes(),
        };

        let mut encrypted = cipher
            .encrypt(nonce, payload)
            .map_err(|_| Error::UnableToGenerateDID)?;

        // Split ciphertext and tag
        let tag = encrypted.split_off(encrypted.len() - 16);

        Ok(JWE {
            protected_header: protected_b64,
            iv: URL_SAFE_NO_PAD.encode(iv),
            ciphertext: URL_SAFE_NO_PAD.encode(encrypted),
            tag: URL_SAFE_NO_PAD.encode(tag),
            recipients: recipient_infos,
        })
    }

    pub fn decrypt(&self, jwks: &[JWK]) -> Option<Vec<u8>> {
        for jwk in jwks {
            // Convert JWK to X25519
            let Some(x25519_key) = convert_ed25519_to_x25519(jwk) else {
                continue;
            };

            // Try each recipient
            for recipient in &self.recipients {
                let epk_bytes = match URL_SAFE_NO_PAD.decode(&recipient.header.epk.x) {
                    Ok(bytes) => bytes,
                    Err(_) => continue,
                };

                let ephemeral_public =
                    X25519Public::from(<[u8; 32]>::try_from(epk_bytes.as_slice()).ok()?);

                let shared_secret = x25519_key.diffie_hellman(&ephemeral_public);

                // Replace HKDF with concatKDF
                let kek = concat_kdf(
                    shared_secret.as_bytes(),
                    256,
                    "ECDH-ES+XC20PKW",
                    None, // apu
                );

                // Decrypt the content encryption key (CEK)
                let cipher = match XChaCha20Poly1305::new_from_slice(&kek) {
                    Ok(c) => c,
                    Err(_) => continue,
                };

                let recipient_iv = match URL_SAFE_NO_PAD.decode(&recipient.header.iv) {
                    Ok(iv) => iv,
                    Err(_) => continue,
                };

                let nonce = XNonce::from_slice(&recipient_iv);

                let recipient_tag = match URL_SAFE_NO_PAD.decode(&recipient.header.tag) {
                    Ok(recipient_tag) => recipient_tag,
                    Err(_) => continue,
                };

                // Combine encrypted_key and tag
                let mut encrypted_key_with_tag =
                    match URL_SAFE_NO_PAD.decode(&recipient.encrypted_key) {
                        Ok(encrypted_key) => encrypted_key,
                        Err(_) => continue,
                    };

                encrypted_key_with_tag.extend_from_slice(&recipient_tag);

                let cek = match cipher.decrypt(&nonce, encrypted_key_with_tag.as_slice()) {
                    Ok(cek) => cek,
                    Err(_) => continue,
                };

                // Now decrypt the content
                let content_cipher = match XChaCha20Poly1305::new_from_slice(&cek) {
                    Ok(c) => c,
                    Err(_) => continue,
                };

                let content_iv = match URL_SAFE_NO_PAD.decode(&self.iv) {
                    Ok(iv) => iv,
                    Err(_) => continue,
                };

                let content_nonce = XNonce::from_slice(&content_iv);

                let content_tag = match URL_SAFE_NO_PAD.decode(&self.tag) {
                    Ok(tag) => tag,
                    Err(_) => continue,
                };

                let mut ciphertext_with_tag = match URL_SAFE_NO_PAD.decode(&self.ciphertext) {
                    Ok(ct) => ct,
                    Err(_) => continue,
                };

                ciphertext_with_tag.extend_from_slice(&content_tag);

                let payload = Payload {
                    msg: ciphertext_with_tag.as_slice(),
                    aad: self.protected_header.as_bytes(),
                };

                match content_cipher.decrypt(&content_nonce, payload) {
                    Ok(content) => return Some(content),
                    Err(_) => continue,
                }
            }
        }

        None
    }
}

/// Convert Ed25519 JWK to X25519 key for key agreement
fn convert_ed25519_to_x25519(jwk: &JWK) -> Option<StaticSecret> {
    match &jwk.params {
        Params::OKP(okp) => {
            let ed25519_bytes = okp.private_key.as_ref()?;
            
            let ed25519_secret_bytes = <[u8; 32]>::try_from(ed25519_bytes.0.as_slice()).ok()?;
            
            let ed25519_secret_key = ed25519_dalek::SigningKey::from_bytes(&ed25519_secret_bytes);

            // Convert Ed25519 to X25519
            let x25519_bytes = ed25519_secret_key.to_scalar_bytes();
            
            Some(StaticSecret::from(x25519_bytes))
        }
        _ => None,
    }
}

/// Implements the concatKDF as per NIST SP 800-56A Rev. 3
fn concat_kdf(shared_secret: &[u8], key_data_len: usize, algorithm: &str, apu: Option<&[u8]>) -> Vec<u8> {
    let mut hasher = sha2::Sha256::new();
    
    // Round 1
    let mut round_bytes = Vec::new();
    round_bytes.write_u32::<BigEndian>(1).unwrap();
    round_bytes.extend_from_slice(shared_secret);
    
    // AlgorithmID
    round_bytes.write_u32::<BigEndian>(algorithm.len() as u32).unwrap();
    round_bytes.extend_from_slice(algorithm.as_bytes());
    
    // PartyUInfo (APU)
    if let Some(apu_data) = apu {
        round_bytes.write_u32::<BigEndian>(apu_data.len() as u32).unwrap();
        round_bytes.extend_from_slice(apu_data);
    } else {
        round_bytes.write_u32::<BigEndian>(0).unwrap();
    }
    
    // PartyVInfo (APV) - empty
    round_bytes.write_u32::<BigEndian>(0).unwrap();
    
    // KeyDataLen
    round_bytes.write_u32::<BigEndian>(key_data_len as u32).unwrap();
    
    hasher.update(&round_bytes);
    let hash = hasher.finalize();
    
    hash[..32].to_vec()
}
