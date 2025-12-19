#![deny(clippy::all)]
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::collections::HashMap;

use once_cell::sync::Lazy;
use tokio::runtime::Runtime;

// Single-threaded runtime for blocking execution - avoids all async/thread overhead
// since we run everything synchronously on the calling thread
static RUNTIME: Lazy<Runtime> = Lazy::new(|| {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .expect("Failed to create Tokio runtime")
});

// Helper to run async code synchronously
fn block_on<F: std::future::Future>(f: F) -> F::Output {
    RUNTIME.block_on(f)
}

use didkit::{
    get_verification_method, DIDWeb, JWTOrLDPOptions, LinkedDataProofOptions, ProofFormat,
    ResolutionResult, Source, VerifiableCredential, VerifiablePresentation, DID_METHODS, JWK,
};
use ssi::jsonld::ContextLoader;

mod dag;
mod jwe;

use dag::{decode_cleartext, prepare_cleartext};
use jwe::JWE;

// Key generation

#[napi]
pub fn generate_ed25519_key_from_bytes(bytes: Buffer) -> Result<String> {
    let jwk = JWK::generate_ed25519_from_bytes(&bytes)
        .map_err(|e| Error::from_reason(format!("didkit: {}", e)))?;
    let jwk_json =
        serde_json::to_string(&jwk).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    Ok(jwk_json)
}

#[napi]
pub fn generate_secp256k1_key_from_bytes(bytes: Buffer) -> Result<String> {
    let jwk = JWK::generate_secp256k1_from_bytes(&bytes)
        .map_err(|e| Error::from_reason(format!("didkit: {}", e)))?;
    let jwk_json =
        serde_json::to_string(&jwk).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    Ok(jwk_json)
}

// DID operations

#[napi]
pub fn key_to_did(method_pattern: String, jwk_json: String) -> Result<String> {
    let jwk: JWK =
        serde_json::from_str(&jwk_json).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let did = DID_METHODS
        .generate(&Source::KeyAndPattern(&jwk, &method_pattern))
        .ok_or_else(|| Error::from_reason("Unable to generate DID".to_string()))?;
    Ok(did)
}

#[napi]
pub fn key_to_verification_method(method_pattern: String, jwk_json: String) -> Result<String> {
    let jwk: JWK =
        serde_json::from_str(&jwk_json).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let did = DID_METHODS
        .generate(&Source::KeyAndPattern(&jwk, &method_pattern))
        .ok_or_else(|| Error::from_reason("Unable to generate DID".to_string()))?;
    let did_resolver = DID_METHODS.to_resolver();
    let vm = block_on(get_verification_method(&did, did_resolver))
        .ok_or_else(|| Error::from_reason("Unable to get verification method".to_string()))?;
    Ok(vm)
}

#[napi]
pub fn did_to_verification_method(did: String) -> Result<String> {
    let did_resolver = DID_METHODS.to_resolver();
    let vm = block_on(get_verification_method(&did, did_resolver))
        .ok_or_else(|| Error::from_reason("Unable to get verification method".to_string()))?;
    Ok(vm)
}

#[napi]
pub fn resolve_did(did: String, input_metadata: String) -> Result<String> {
    let input_meta: ssi::did_resolve::ResolutionInputMetadata =
        serde_json::from_str(&input_metadata)
            .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let (res_meta, doc, _) = block_on(DID_METHODS.to_resolver().resolve(&did, &input_meta));

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
pub fn did_resolver(did: String, input_metadata: String) -> Result<String> {
    let input_meta: ssi::did_resolve::ResolutionInputMetadata =
        serde_json::from_str(&input_metadata)
            .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
    let (did_resolution_metadata, did_document, did_document_metadata) =
        block_on(DID_METHODS.to_resolver().resolve(&did, &input_meta));

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
pub fn issue_credential(
    credential: String,
    proof_options: String,
    key: String,
    context_map: String,
) -> Result<String> {
    let mut credential = VerifiableCredential::from_json_unsigned(&credential)
        .map_err(|e| Error::from_reason(format!("vc: {}", e)))?;
    let jwk: JWK =
        serde_json::from_str(&key).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
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
            block_on(credential.generate_jwt(Some(&jwk), &options.ldp_options, resolver))
                .map_err(|e| Error::from_reason(format!("jwt: {}", e)))?
        }
        _ => {
            let proof = block_on(credential.generate_proof(
                &jwk,
                &options.ldp_options,
                resolver,
                &mut context_loader,
            ))
            .map_err(|e| Error::from_reason(format!("ldp: {}", e)))?;
            credential.add_proof(proof);
            serde_json::to_string(&credential)
                .map_err(|e| Error::from_reason(format!("serde: {}", e)))?
        }
    };

    Ok(vc_string)
}

#[napi]
pub fn verify_credential(
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

    let result = block_on(vc.verify(Some(options), resolver, &mut context_loader));
    serde_json::to_string(&result).map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Presentation operations

#[napi]
pub fn issue_presentation(
    presentation: String,
    proof_options: String,
    key: String,
    context_map: String,
) -> Result<String> {
    let mut presentation = VerifiablePresentation::from_json_unsigned(&presentation)
        .map_err(|e| Error::from_reason(format!("vp: {}", e)))?;
    let jwk: JWK =
        serde_json::from_str(&key).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;
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
            block_on(presentation.generate_jwt(Some(&jwk), &options.ldp_options, resolver))
                .map_err(|e| Error::from_reason(format!("jwt: {}", e)))?
        }
        _ => {
            let proof = block_on(presentation.generate_proof(
                &jwk,
                &options.ldp_options,
                resolver,
                &mut context_loader,
            ))
            .map_err(|e| Error::from_reason(format!("ldp: {}", e)))?;
            presentation.add_proof(proof);
            serde_json::to_string(&presentation)
                .map_err(|e| Error::from_reason(format!("serde: {}", e)))?
        }
    };

    Ok(vp_string)
}

#[napi]
pub fn verify_presentation(
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
        block_on(VerifiablePresentation::verify_jwt(
            &presentation,
            Some(options),
            resolver,
            &mut context_loader,
        ))
    } else {
        // Verify JSON-LD presentation
        let vp = VerifiablePresentation::from_json(&presentation)
            .map_err(|e| Error::from_reason(format!("vp: {}", e)))?;
        block_on(vp.verify(Some(options), resolver, &mut context_loader))
    };

    serde_json::to_string(&result).map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Context loading - uses SSI's embedded static contexts (no HTTP)
// Returns the context JSON string for known contexts, or an error for unknown ones.
// HTTP fetching for unknown contexts should be done by DynamicLoaderPlugin in JS if needed.

#[napi]
pub fn context_loader(url: String) -> Result<String> {
    let context = match url.as_str() {
        "https://www.w3.org/2018/credentials/v1" => ssi_contexts::CREDENTIALS_V1,
        "https://www.w3.org/ns/credentials/v2" => ssi_contexts::CREDENTIALS_V2,
        "https://www.w3.org/2018/credentials/examples/v1" => ssi_contexts::CREDENTIALS_EXAMPLES_V1,
        "https://www.w3.org/ns/credentials/examples/v2" => ssi_contexts::CREDENTIALS_EXAMPLES_V2,
        "https://www.w3.org/ns/odrl.jsonld" => ssi_contexts::ODRL,
        "https://schema.org/" => ssi_contexts::SCHEMA_ORG,
        "https://w3id.org/security/v1" => ssi_contexts::SECURITY_V1,
        "https://w3id.org/security/v2" => ssi_contexts::SECURITY_V2,
        "https://www.w3.org/ns/did/v1" | "https://w3.org/ns/did/v1" | "https://w3id.org/did/v1" => {
            ssi_contexts::DID_V1
        }
        "https://w3id.org/did-resolution/v1" => ssi_contexts::DID_RESOLUTION_V1,
        "https://w3id.org/security/suites/secp256k1recovery-2020/v2" => {
            ssi_contexts::W3ID_ESRS2020_V2
        }
        "https://w3c-ccg.github.io/lds-jws2020/contexts/lds-jws2020-v1.json" => {
            ssi_contexts::LDS_JWS2020_V1
        }
        "https://w3id.org/security/suites/jws-2020/v1" => ssi_contexts::W3ID_JWS2020_V1,
        "https://w3id.org/security/suites/ed25519-2020/v1" => ssi_contexts::W3ID_ED2020_V1,
        "https://w3id.org/security/multikey/v1" => ssi_contexts::W3ID_MULTIKEY_V1,
        "https://w3id.org/security/data-integrity/v1" => ssi_contexts::W3ID_DATA_INTEGRITY_V1,
        "https://w3id.org/security/suites/blockchain-2021/v1" => ssi_contexts::BLOCKCHAIN2021_V1,
        "https://w3id.org/citizenship/v1" => ssi_contexts::CITIZENSHIP_V1,
        "https://w3id.org/vaccination/v1" => ssi_contexts::VACCINATION_V1,
        "https://w3id.org/traceability/v1" => ssi_contexts::TRACEABILITY_V1,
        "https://w3id.org/vc-revocation-list-2020/v1" => ssi_contexts::REVOCATION_LIST_2020_V1,
        "https://w3id.org/vc/status-list/2021/v1" | "https://w3id.org/vc/status-list/v1" => {
            ssi_contexts::STATUS_LIST_2021_V1
        }
        "https://w3id.org/security/bbs/v1" => ssi_contexts::BBS_V1,
        "https://identity.foundation/presentation-exchange/submission/v1" => {
            ssi_contexts::PRESENTATION_SUBMISSION_V1
        }
        "https://w3id.org/vdl/v1" => ssi_contexts::VDL_V1,
        "https://w3id.org/wallet/v1" => ssi_contexts::WALLET_V1,
        "https://w3id.org/zcap/v1" => ssi_contexts::ZCAP_V1,
        "https://demo.didkit.dev/2022/cacao-zcap/contexts/v1.json" => ssi_contexts::CACAO_ZCAP_V1,
        "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json" => {
            ssi_contexts::JFF_VC_EDU_PLUGFEST_2022
        }
        "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld" => {
            ssi_contexts::DID_CONFIGURATION_V0_0
        }
        "https://openbadgespec.org/v2/context.json" => ssi_contexts::OBV2,
        "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
        | "https://imsglobal.github.io/openbadges-specification/context.json" => ssi_contexts::OBV3,
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json" => ssi_contexts::OBV301,
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json" => ssi_contexts::OBV302,
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json" => ssi_contexts::OBV303,
        "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json" => ssi_contexts::OBV3_EXTENSIONS,
        "https://purl.imsglobal.org/spec/clr/v2p0/context.json" => ssi_contexts::CLR_V2,
        "https://ctx.learncard.com/boosts/1.0.0.json" => ssi_contexts::LEARNCARD_BOOSTS_V1_0_0,
        "https://ctx.learncard.com/boosts/1.0.1.json" => ssi_contexts::LEARNCARD_BOOSTS_V1_0_1,
        "https://ctx.learncard.com/boosts/1.0.2.json" => ssi_contexts::LEARNCARD_BOOSTS_V1_0_2,
        "https://ctx.learncard.com/boosts/1.0.3.json" => ssi_contexts::LEARNCARD_BOOSTS_V1_0_3,
        "https://ctx.learncard.com/boostIDs/1.0.0.json" => ssi_contexts::LEARNCARD_BOOSTIDS_V1_0_0,
        "https://ctx.learncard.com/delegates/1.0.0.json" => {
            ssi_contexts::LEARNCARD_DELEGATES_V1_0_0
        }
        "https://ctx.learncard.com/qa/1.0.0.json" => ssi_contexts::LEARNCARD_QA_V1_0_0,
        "https://playground.chapi.io/examples/alumni/alumni-v1.json" => ssi_contexts::CHAPI_ALUMNI,
        "https://playground.chapi.io/examples/movieTicket/ticket-v1.json" => {
            ssi_contexts::CHAPI_MOVIE_TICKET
        }
        _ => return Err(Error::from_reason(format!("Unknown context: {}", url))),
    };

    Ok(context.to_string())
}

// JWE encryption/decryption

#[napi]
pub fn create_jwe(cleartext: String, recipients: Vec<String>) -> Result<String> {
    let jwe = block_on(JWE::encrypt(cleartext.as_bytes(), &recipients))
        .map_err(|e| Error::from_reason(format!("jwe: {}", e)))?;

    let jwe_json =
        serde_json::to_string(&jwe).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    Ok(jwe_json)
}

#[napi]
pub fn decrypt_jwe(jwe: String, jwks_json: Vec<String>) -> Result<String> {
    let jwe: JWE =
        serde_json::from_str(&jwe).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    let jwks: Vec<JWK> = jwks_json
        .iter()
        .map(|s| serde_json::from_str(s))
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    let cleartext = jwe
        .decrypt(&jwks)
        .ok_or_else(|| Error::from_reason("Unable to decrypt JWE".to_string()))?;

    String::from_utf8(cleartext).map_err(|e| Error::from_reason(format!("utf8: {}", e)))
}

#[napi]
pub fn create_dag_jwe(cleartext: String, recipients: Vec<String>) -> Result<String> {
    // Parse the cleartext as JSON
    let value: serde_json::Value = serde_json::from_str(&cleartext)
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    // Prepare cleartext (encode as CID and pad)
    let prepared =
        prepare_cleartext(&value, None).map_err(|e| Error::from_reason(format!("dag: {}", e)))?;

    let jwe = block_on(JWE::encrypt(&prepared, &recipients))
        .map_err(|e| Error::from_reason(format!("jwe: {}", e)))?;

    let jwe_json =
        serde_json::to_string(&jwe).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    Ok(jwe_json)
}

#[napi]
pub fn decrypt_dag_jwe(jwe: String, jwks_json: Vec<String>) -> Result<String> {
    let jwe: JWE =
        serde_json::from_str(&jwe).map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    let jwks: Vec<JWK> = jwks_json
        .iter()
        .map(|s| serde_json::from_str(s))
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| Error::from_reason(format!("serde: {}", e)))?;

    let encrypted_data = jwe
        .decrypt(&jwks)
        .ok_or_else(|| Error::from_reason("Unable to decrypt DAG-JWE".to_string()))?;

    // Decode the cleartext (unpad and decode CID)
    let value =
        decode_cleartext(&encrypted_data).map_err(|e| Error::from_reason(format!("dag: {}", e)))?;

    serde_json::to_string(&value).map_err(|e| Error::from_reason(format!("serde: {}", e)))
}

// Cache management

#[napi]
pub fn clear_cache() -> Result<String> {
    block_on(DIDWeb::clear_cache());
    Ok("Cleared".to_string())
}
