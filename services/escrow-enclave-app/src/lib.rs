//! Escrow enclave primitives and decision core. Production driver/transport integration is pending.

/// P-256 ECDH, HKDF-SHA256, and AES-GCM envelope compatibility (P1.2).
pub mod crypto;
/// Attested KMS unseal and the future KmsClient abstraction (P1.4).
pub mod kms;
/// Signed, hash-chained state transitions and the future HeadStore abstraction (P1.6).
pub mod ledger;
/// Nitro attestation drivers and explicitly unverified document parsing (P1.3).
pub mod nsm;
/// Signed hold creation, blob validation, and hold/PIN release decisions (P1.7).
pub mod policy;
/// Identical JSON transport over Linux vsock or local emulation TCP (P1.8).
pub mod server;
/// Signed Roughtime intervals and the future TimeSource abstraction (P1.5).
pub mod time;
pub mod wire;

/// Requested transport; the scaffold does not bind either endpoint.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Transport {
    Vsock {
        port: u32,
    },
    Emulate {
        address: std::net::SocketAddr,
        http_address: Option<std::net::SocketAddr>,
    },
}

/// Log the requested transport and exit successfully without starting a server.
pub async fn run(transport: Transport) -> std::io::Result<()> {
    server::run(transport).await
}
