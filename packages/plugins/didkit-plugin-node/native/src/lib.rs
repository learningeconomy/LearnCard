#![deny(clippy::all)]
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::collections::HashMap;

use didkit::{
    get_verification_method, DIDWeb, JWTOrLDPOptions, LinkedDataProofOptions, ProofFormat,
    ResolutionResult, Source, VerifiableCredential, VerifiablePresentation,
    DID_METHODS, JWK,
};
use ssi::jsonld::ContextLoader;

mod jwe;
mod dag;

use jwe::JWE;
use dag::{decode_cleartext, prepare_cleartext};

// Key generation

#[napi]
pub fn generate_ed25519_key_from_bytes(bytes: Buffer) -> Result<String> {
    let jwk = JWK::generate_ed25519_from_bytes(&bytes)
        .map_err(|e| Error::from_reason(format!("didkit: {}", e)))?;
    let jwk_json = serde_json::to_string(&jwk)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    Ok(jwk_json)
}

#[napi]
pub fn generate_secp256k1_key_from_bytes(bytes: Buffer) -> Result<String> {
    let jwk = JWK::generate_secp256k1_from_bytes(&bytes)
        .map_err(|e| Error::from_reason(format!("didkit: {}", e)))?;
    let jwk_json = serde_json::to_string(&jwk)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    Ok(jwk_json)
}

// DID operations

#[napi]
pub fn key_to_did(method_pattern: String, jwk_json: String) -> Result<String> {
    let jwk: JWK = serde_json::from_str(&jwk_json)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let did = DID_METHODS
        .generate(&Source::KeyAndPattern(&jwk, &method_pattern))
        .ok_or_else(|| Error::from_reason("Unable to generate DID".to_string()))?;
    Ok(did)
}

#[napi]
pub async fn key_to_verification_method(
    method_pattern: String,
    jwk_json: String,
) -> Result<String> {
    let jwk: JWK = serde_json::from_str(&jwk_json)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let did = DID_METHODS
        .generate(&Source::KeyAndPattern(&jwk, &method_pattern))
        .ok_or_else(|| Error::from_reason("Unable to generate DID".to_string()))?;
    let did_resolver = DID_METHODS.to_resolver();
    let vm = get_verification_method(&did, did_resolver)
        .await
        .ok_or_else(|| Error::from_reason("Unable to get verification method".to_string()))?;
    Ok(vm)
}

#[napi]
pub async fn did_to_verification_method(did: String) -> Result<String> {
    let did_resolver = DID_METHODS.to_resolver();
    let vm = get_verification_method(&did, did_resolver)
        .await
        .ok_or_else(|| Error::from_reason("Unable to get verification method".to_string()))?;
    Ok(vm)
}

#[napi]
pub async fn resolve_did(did: String, input_metadata: String) -> Result<String> {
    let input_meta: ssi::did_resolve::ResolutionInputMetadata =
        serde_json::from_str(&input_metadata)
            .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let (res_meta, doc, _) = DID_METHODS.to_resolver().resolve(&did, &input_meta).await;

    if let Some(error) = res_meta.error {
        return Err(Error::from_reason(error));
    }

    if let Some(d) = doc {
        serde_json::to_string(&d).map_err(|e| Error::from_reason(format!("serde: {}", e)))
    } else {
        Err(Error::from_reason("No document resolved".to_string()))
    }
}

#[napi]
pub async fn did_resolver(did: String, input_metadata: String) -> Result<String> {
    let input_meta: ssi::did_resolve::ResolutionInputMetadata =
        serde_json::from_str(&input_metadata)
            .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let (did_resolution_metadata, did_document, did_document_metadata) =
        DID_METHODS.to_resolver().resolve(&did, &input_meta).await;

    let resolution_result = ResolutionResult {
        did_document,
        did_resolution_metadata: Some(did_resolution_metadata),
        did_document_metadata,
        ..Default::default()
    };

    serde_json::to_string(&resolution_result)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Credential operations

#[napi]
pub async fn issue_credential(
    credential: String,
    proof_options: String,
    key: String,
    context_map: String,
) -> Result<String> {
    let mut credential = VerifiableCredential::from_json_unsigned(&credential)
        .map_err(|e| Error::from_reason(format!("vc: {}", e)))?;
    let jwk: JWK = serde_json::from_str(&key)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let options: JWTOrLDPOptions = serde_json::from_str(&proof_options)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let context_map: HashMap<String, String> = serde_json::from_str(&context_map)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let proof_format = options.proof_format.unwrap_or_default();
    let resolver = DID_METHODS.to_resolver();
    let mut context_loader = ContextLoader::default()
        .with_context_map_from(context_map)
        .map_err(|e| Error::from_reason(format!("context: {}", e)))?;

    let vc_string = match proof_format {
        ProofFormat::JWT => {
            credential
                .generate_jwt(Some(&jwk), &options.ldp_options, resolver)
                .await
                .map_err(|e| Error::from_reason(format!("jwt: {}", e)))?
        }
        _ => {
            let proof = credential
                .generate_proof(&jwk, &options.ldp_options, resolver, &mut context_loader)
                .await
                .map_err(|e| Error::from_reason(format!("ldp: {}", e)))?;
            credential.add_proof(proof);
            serde_json::to_string(&credential)
                .map_err(|e| Error::from_reason(format!("serde: {}", e)))?
        }
    };

    Ok(vc_string)
}

#[napi]
pub async fn verify_credential(
    credential: String,
    proof_options: String,
    context_map: String,
) -> Result<String> {
    let vc = VerifiableCredential::from_json(&credential)
        .map_err(|e| Error::from_reason(format!("vc: {}", e)))?;
    let options: LinkedDataProofOptions = serde_json::from_str(&proof_options)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let context_map: HashMap<String, String> = serde_json::from_str(&context_map)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let resolver = DID_METHODS.to_resolver();
    let mut context_loader = ContextLoader::default()
        .with_context_map_from(context_map)
        .map_err(|e| Error::from_reason(format!("context: {}", e)))?;

    let result = vc
        .verify(Some(options), resolver, &mut context_loader)
        .await;
    serde_json::to_string(&result).map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Presentation operations

#[napi]
pub async fn issue_presentation(
    presentation: String,
    proof_options: String,
    key: String,
    context_map: String,
) -> Result<String> {
    let mut presentation = VerifiablePresentation::from_json_unsigned(&presentation)
        .map_err(|e| Error::from_reason(format!("vp: {}", e)))?;
    let jwk: JWK = serde_json::from_str(&key)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let options: JWTOrLDPOptions = serde_json::from_str(&proof_options)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let context_map: HashMap<String, String> = serde_json::from_str(&context_map)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let proof_format = options.proof_format.unwrap_or_default();
    let resolver = DID_METHODS.to_resolver();
    let mut context_loader = ContextLoader::default()
        .with_context_map_from(context_map)
        .map_err(|e| Error::from_reason(format!("context: {}", e)))?;

    let vp_string = match proof_format {
        ProofFormat::JWT => {
            presentation
                .generate_jwt(Some(&jwk), &options.ldp_options, resolver)
                .await
                .map_err(|e| Error::from_reason(format!("jwt: {}", e)))?
        }
        _ => {
            let proof = presentation
                .generate_proof(&jwk, &options.ldp_options, resolver, &mut context_loader)
                .await
                .map_err(|e| Error::from_reason(format!("ldp: {}", e)))?;
            presentation.add_proof(proof);
            serde_json::to_string(&presentation)
                .map_err(|e| Error::from_reason(format!("serde: {}", e)))?
        }
    };

    Ok(vp_string)
}

#[napi]
pub async fn verify_presentation(
    presentation: String,
    proof_options: String,
    context_map: String,
) -> Result<String> {
    let options: LinkedDataProofOptions = serde_json::from_str(&proof_options)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let context_map: HashMap<String, String> = serde_json::from_str(&context_map)
        .map_err(|e| Error::from_reason(format!("context: {}", e)))?;
    let resolver = DID_METHODS.to_resolver();
    let mut context_loader = ContextLoader::default()
        .with_context_map_from(context_map)
        .map_err(|e| Error::from_reason(format!("context: {}", e)))?;

    // Check if this is a JWT (starts with "eyJ")
    let result = if presentation.starts_with("eyJ") {

        // Verify JWT presentation
        VerifiablePresentation::verify_jwt(
            &presentation,
            Some(options),
            resolver,
            &mut context_loader
        ).await
    } else {
        // Verify JSON-LD presentation
        let vp = VerifiablePresentation::from_json(&presentation)
            .map_err(|e| Error::from_reason(format!("vp: {}", e)))?;
        vp.verify(Some(options), resolver, &mut context_loader).await
    };

    serde_json::to_string(&result).map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Context loading

#[napi]
pub async fn context_loader(url: String) -> Result<String> {
    // Fetch the context document via HTTP
    let response = reqwest::get(&url).await
        .map_err(|e| Error::from_reason(format!("Failed to fetch context: {}", e)))?;
    
    let text = response.text().await
        .map_err(|e| Error::from_reason(format!("Failed to read context response: {}", e)))?;
    
    Ok(text)
}

// JWE encryption/decryption

#[napi]
pub async fn create_jwe(cleartext: String, recipients: Vec<String>) -> Result<String> {
    let jwe = JWE::encrypt(cleartext.as_bytes(), &recipients)
        .await
        .map_err(|e| Error::from_reason(format!("jwe: {}", e)))?;
    
    let jwe_json = serde_json::to_string(&jwe)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    Ok(jwe_json)
}

#[napi]
pub async fn decrypt_jwe(jwe: String, jwks_json: Vec<String>) -> Result<String> {
    let jwe: JWE = serde_json::from_str(&jwe)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    let jwks: Vec<JWK> = jwks_json
        .iter()
        .map(|s| serde_json::from_str(s))
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    let cleartext = jwe
        .decrypt(&jwks)
        .ok_or_else(|| Error::from_reason("Unable to decrypt JWE".to_string()))?;
    
    String::from_utf8(cleartext)
        .map_err(|e| Error::from_reason(format!("utf8: {}", e)))
}

#[napi]
pub async fn create_dag_jwe(cleartext: String, recipients: Vec<String>) -> Result<String> {
    // Parse the cleartext as JSON
    let value: serde_json::Value = serde_json::from_str(&cleartext)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    // Prepare cleartext (encode as CID and pad)
    let prepared = prepare_cleartext(&value, None)
        .map_err(|e| Error::from_reason(format!("dag: {}", e)))?;
    
    let jwe = JWE::encrypt(&prepared, &recipients)
        .await
        .map_err(|e| Error::from_reason(format!("jwe: {}", e)))?;
    
    let jwe_json = serde_json::to_string(&jwe)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    Ok(jwe_json)
}

#[napi]
pub async fn decrypt_dag_jwe(jwe: String, jwks_json: Vec<String>) -> Result<String> {
    let jwe: JWE = serde_json::from_str(&jwe)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    let jwks: Vec<JWK> = jwks_json
        .iter()
        .map(|s| serde_json::from_str(s))
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    
    let encrypted_data = jwe
        .decrypt(&jwks)
        .ok_or_else(|| Error::from_reason("Unable to decrypt DAG-JWE".to_string()))?;
    
    // Decode the cleartext (unpad and decode CID)
    let value = decode_cleartext(&encrypted_data)
        .map_err(|e| Error::from_reason(format!("dag: {}", e)))?;
    
    serde_json::to_string(&value)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Cache management

#[napi]
pub async fn clear_cache() -> Result<String> {
    DIDWeb::clear_cache().await;
    Ok("Cleared".to_string())
}
