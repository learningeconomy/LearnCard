//! JSON wire DTOs, not security validation. Binary envelope fields use standard base64.
//! Never log whole requests: release requests contain a sensitive PIN proof.

use serde::{Deserialize, Serialize};

/// Policy-complete transport. Original scaffold DTOs below remain for source
/// compatibility; the server accepts exclusively this v1 protocol.
pub mod v1 {
    use super::*;
    use crate::policy::SignedHoldRecord;

    #[derive(Clone, Serialize, Deserialize)]
    #[serde(
        tag = "method",
        rename_all = "camelCase",
        rename_all_fields = "camelCase",
        deny_unknown_fields
    )]
    pub enum Request {
        Attest {
            #[serde(with = "serde_bytes")]
            nonce: Vec<u8>,
        },
        VerifyBlob {
            envelope: EscrowEnvelope,
            expected_did: String,
            expected_share_version: u32,
        },
        CreateHold {
            envelope: EscrowEnvelope,
            hold_id: String,
            request_id: String,
            expected_did: String,
            expected_share_version: u32,
            enrollment_epoch: u64,
            release_policy: ReleasePolicy,
            client_ephemeral_public_key: String,
        },
        Release {
            envelope: EscrowEnvelope,
            hold: SignedHoldRecord,
            request_id: String,
            client_ephemeral_public_key: String,
            expected_did: String,
            #[serde(default, skip_serializing_if = "Option::is_none")]
            pin_proof: Option<String>,
        },
        Cancel {
            envelope: EscrowEnvelope,
            hold: SignedHoldRecord,
            request_id: String,
            client_ephemeral_public_key: String,
            expected_did: String,
        },
        Health,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(
        tag = "method",
        rename_all = "camelCase",
        rename_all_fields = "camelCase",
        deny_unknown_fields
    )]
    pub enum Response {
        Attest {
            mode: AttestationMode,
            key_id: String,
            public_key: String,
            measurements: Measurements,
            document: String,
            issued_at: String,
        },
        VerifyBlob {
            ok: bool,
            has_pin: bool,
            #[serde(default, skip_serializing_if = "Option::is_none")]
            reason: Option<String>,
        },
        CreateHold {
            hold: SignedHoldRecord,
        },
        Release {
            sealed: EscrowEnvelope,
        },
        Cancel {
            cancelled: bool,
        },
        Health {
            ok: bool,
        },
        Error {
            code: ErrorCode,
            message: String,
        },
    }
}

/// Client-compatible encrypted envelope; algorithm/version checks belong to crypto.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EscrowEnvelope {
    pub version: u32,
    pub algorithm: String,
    pub key_id: String,
    pub ephemeral_public_key: String,
    pub salt: String,
    pub iv: String,
    pub ciphertext: String,
}

/// Release policy authenticated by the signed hold.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReleasePolicy {
    Hold,
    Pin,
}

/// Enclave-signed hold, replacing the legacy host-owned EscrowHoldForEnclave.
/// Times are Unix milliseconds; blobHash is SHA-256 hex and signature is base64.
/// Signature encoding/canonical signed bytes will be defined by policy, not JSON order.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HoldRecord {
    pub hold_id: String,
    pub did: String,
    pub share_version: u32,
    pub blob_hash: String,
    pub enrollment_epoch: u64,
    pub release_policy: ReleasePolicy,
    pub client_ephemeral_public_key: String,
    pub created_lo: u64,
    pub created_hi: u64,
    pub policy_version: u32,
    pub signature: String,
}

/// Attested measurements, matching lca-api EnclaveAttestation.measurements.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Measurements {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub image_sha384: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pcr0: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pcr1: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pcr2: Option<String>,
}

/// Client-facing mode; emulation must never be accepted as Nitro attestation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AttestationMode {
    Software,
    Nitro,
}

/// Requests use a `method` discriminator and camelCase fields/operation names.
/// Host-supplied `now` is deliberately unsupported: time is enclave-verified.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Request {
    Attest {
        #[serde(with = "serde_bytes")]
        nonce: Vec<u8>,
    },
    CreateHold {
        envelope: EscrowEnvelope,
        hold_id: String,
        expected_did: String,
        expected_share_version: u32,
        enrollment_epoch: u64,
        release_policy: ReleasePolicy,
        client_ephemeral_public_key: String,
    },
    VerifyBlob {
        envelope: EscrowEnvelope,
        expected_did: String,
        expected_share_version: u32,
    },
    Release {
        envelope: EscrowEnvelope,
        hold: HoldRecord,
        client_ephemeral_public_key: String,
        expected_did: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        pin_proof: Option<String>,
    },
    Health,
}

/// Wire failures; message text must not contain plaintext, proofs, or internal errors.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorCode {
    Policy,
    PinMismatch,
    Blob,
    Unavailable,
    Ledger,
    Time,
}

/// Responses use a `method` discriminator, matching their request (or `error`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Response {
    Attest {
        mode: AttestationMode,
        key_id: String,
        public_key: String,
        measurements: Measurements,
        document: String,
        issued_at: String,
    },
    CreateHold {
        hold: HoldRecord,
    },
    VerifyBlob {
        ok: bool,
        has_pin: bool,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        reason: Option<String>,
    },
    Release {
        sealed: EscrowEnvelope,
    },
    Health {
        ok: bool,
    },
    Error {
        code: ErrorCode,
        message: String,
    },
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::de::DeserializeOwned;
    use serde_json::{json, Value};
    use std::fmt::Debug;

    fn envelope() -> Value {
        json!({
            "version": 1, "algorithm": "P-256-HKDF-SHA256-AES-256-GCM", "keyId": "key-1",
            "ephemeralPublicKey": "BA==", "salt": "AA==", "iv": "AA==", "ciphertext": "AA=="
        })
    }

    fn hold() -> Value {
        json!({
            "holdId": "hold-1", "did": "did:example:alice", "shareVersion": 1,
            "blobHash": "00", "enrollmentEpoch": 1, "releasePolicy": "hold",
            "clientEphemeralPublicKey": "AA==", "createdLo": 1700000000000_u64,
            "createdHi": 1700000000100_u64, "policyVersion": 1, "signature": "AA=="
        })
    }

    // Assert exact JSON names/shapes as well as Rust -> JSON -> Rust equality.
    fn round_trip<T: Serialize + DeserializeOwned + PartialEq + Debug>(fixture: Value) {
        let value: T = serde_json::from_value(fixture.clone()).unwrap();
        let encoded = serde_json::to_string(&value).unwrap();
        assert_eq!(serde_json::from_str::<Value>(&encoded).unwrap(), fixture);
        assert_eq!(serde_json::from_str::<T>(&encoded).unwrap(), value);
    }

    #[test]
    fn round_trip_each_request_variant() {
        for fixture in [
            json!({"method": "attest", "nonce": [0, 1, 255]}),
            json!({"method": "createHold", "envelope": envelope(), "holdId": "hold-1",
                "expectedDid": "did:example:alice", "expectedShareVersion": 1,
                "enrollmentEpoch": 1, "releasePolicy": "pin", "clientEphemeralPublicKey": "AA=="}),
            json!({"method": "verifyBlob", "envelope": envelope(),
                "expectedDid": "did:example:alice", "expectedShareVersion": 1}),
            json!({"method": "release", "envelope": envelope(), "hold": hold(),
                "clientEphemeralPublicKey": "AA==", "expectedDid": "did:example:alice"}),
            json!({"method": "release", "envelope": envelope(), "hold": hold(),
                "clientEphemeralPublicKey": "AA==", "expectedDid": "did:example:alice", "pinProof": "00"}),
            json!({"method": "health"}),
        ] {
            round_trip::<Request>(fixture);
        }
    }

    #[test]
    fn round_trip_each_response_variant() {
        for fixture in [
            json!({"method": "attest", "mode": "nitro", "keyId": "key-1", "publicKey": "AA==",
                "measurements": {"imageSha384": "00", "pcr0": "00", "pcr1": "00", "pcr2": "00"},
                "document": "AA==", "issuedAt": "2026-09-25T00:00:00Z"}),
            json!({"method": "attest", "mode": "software", "keyId": "test", "publicKey": "AA==",
                "measurements": {}, "document": "AA==", "issuedAt": "2026-09-25T00:00:00Z"}),
            json!({"method": "createHold", "hold": hold()}),
            json!({"method": "verifyBlob", "ok": true, "hasPin": false}),
            json!({"method": "verifyBlob", "ok": false, "hasPin": false, "reason": "Invalid escrow payload."}),
            json!({"method": "release", "sealed": envelope()}),
            json!({"method": "health", "ok": true}),
        ] {
            round_trip::<Response>(fixture);
        }
        for code in [
            "policy",
            "pinMismatch",
            "blob",
            "unavailable",
            "ledger",
            "time",
        ] {
            round_trip::<Response>(json!({"method": "error", "code": code, "message": "Refused."}));
        }
    }

    #[test]
    fn rejects_host_time_and_unsigned_legacy_holds() {
        let release = json!({"method": "release", "envelope": envelope(), "hold": hold(),
            "clientEphemeralPublicKey": "AA==", "expectedDid": "did:example:alice"});
        let mut with_time = release.clone();
        with_time["now"] = json!("2099-01-01T00:00:00Z");
        assert!(serde_json::from_value::<Request>(with_time).is_err());
        let mut unsigned = release;
        unsigned["hold"]
            .as_object_mut()
            .unwrap()
            .remove("signature");
        assert!(serde_json::from_value::<Request>(unsigned).is_err());
    }
}
