//! Nonce-bound signed time. Local timers bound resource use, NOT trusted elapsed time.
use std::{future::Future, pin::Pin, sync::Arc, time::Duration};

use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use tokio::{task::JoinSet, time::timeout};

mod protocol;
#[cfg(target_os = "linux")]
mod relay;
pub mod servers;
#[cfg(target_os = "linux")]
pub use relay::VsockRoughtimeTransport;
#[cfg(any(test, feature = "fake-time"))]
mod fake;
#[cfg(any(test, feature = "fake-time"))]
pub use fake::{FakeRoughtimeTransport, FakeTimeSource};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TrustedInterval {
    pub lo_ms: u64,
    pub hi_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SourceEvidence {
    pub server_id: String,
    pub midpoint_ms: u64,
    pub radius_ms: u64,
    /// SHA-256 of the complete received datagram; not a standalone signature proof.
    pub response_hash: [u8; 32],
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TimeEvidence {
    pub interval: TrustedInterval,
    pub sources: Vec<SourceEvidence>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum TimeError {
    #[error("Invalid time configuration")]
    Configuration,
    #[error("Invalid Roughtime encoding")]
    Encoding,
    #[error("Invalid delegation signature")]
    DelegationSignature,
    #[error("Invalid response signature")]
    ResponseSignature,
    #[error("Invalid nonce inclusion proof")]
    Nonce,
    #[error("Time outside delegation validity")]
    DelegationRange,
    #[error("Time radius exceeds policy")]
    Radius,
    #[error("Time relay unavailable")]
    Unavailable,
    #[error("Not enough verified time sources")]
    InsufficientSources,
    #[error("Time sources disagree")]
    Disagreement,
    #[error("Time precedes ledger head")]
    Rollback,
}

/// Boxed Send futures follow KmsClient and permit dyn drivers without async-trait.
pub type TimeFuture<'a, T> = Pin<Box<dyn Future<Output = Result<T, TimeError>> + Send + 'a>>;

pub trait RoughtimeTransport: Send + Sync {
    fn exchange<'a>(&'a self, server_id: &'a str, request: Vec<u8>) -> TimeFuture<'a, Vec<u8>>;
}

pub trait TimeSource: Send + Sync {
    fn now(&self, floor_ms: Option<u64>) -> TimeFuture<'_, TimeEvidence>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Protocol {
    GoogleLegacy,
    /// Cloudflare's published deployment: 0x80000008, NOT latest draft semantics.
    IetfDraft08,
}

#[derive(Debug, Clone)]
pub struct PinnedServer {
    pub id: String,
    pub public_key: [u8; 32],
    pub protocol: Protocol,
}

pub struct RoughtimeTimeSource {
    servers: Vec<PinnedServer>,
    transport: Arc<dyn RoughtimeTransport>,
    min_sources: usize,
    max_radius_ms: u64,
}

impl RoughtimeTimeSource {
    /// Pins must represent independently operated authorities. Duplicate IDs/keys
    /// are rejected, but organizational independence requires configuration review.
    pub fn new(
        servers: Vec<PinnedServer>,
        transport: Arc<dyn RoughtimeTransport>,
        min_sources: usize,
        max_radius_ms: u64,
    ) -> Result<Self, TimeError> {
        if min_sources < 2
            || servers.len() < min_sources
            || servers.len() > 16
            || max_radius_ms == 0
        {
            return Err(TimeError::Configuration);
        }
        for (i, server) in servers.iter().enumerate() {
            if server.id.is_empty()
                || server.id.len() > 128
                || !server
                    .id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
                || servers[..i]
                    .iter()
                    .any(|s| s.id == server.id || s.public_key == server.public_key)
                || ed25519_dalek::VerifyingKey::from_bytes(&server.public_key)
                    .map_or(true, |key| key.is_weak())
            {
                return Err(TimeError::Configuration);
            }
        }
        Ok(Self {
            servers,
            transport,
            min_sources,
            max_radius_ms,
        })
    }

    /// Provider-published pins, two required sources, ten-second radius cap.
    /// This does not assert service availability or production readiness.
    pub fn production(transport: Arc<dyn RoughtimeTransport>) -> Result<Self, TimeError> {
        if !cfg!(feature = "verified-roughtime-keys") {
            return Err(TimeError::Configuration);
        }
        Self::new(servers::published()?, transport, 2, 10_000)
    }
}

impl TimeSource for RoughtimeTimeSource {
    fn now(&self, floor_ms: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async move {
            let mut queries = JoinSet::new();
            for server in self.servers.clone() {
                let transport = self.transport.clone();
                let max_radius = self.max_radius_ms;
                queries.spawn(async move {
                    let mut nonce = vec![0; server.protocol.nonce_size()];
                    OsRng
                        .try_fill_bytes(&mut nonce)
                        .map_err(|_| TimeError::Unavailable)?;
                    let request = protocol::request(server.protocol, &nonce)?;
                    let response = timeout(
                        Duration::from_secs(2),
                        transport.exchange(&server.id, request),
                    )
                    .await
                    .map_err(|_| TimeError::Unavailable)??;
                    protocol::verify(&server, &nonce, &response, max_radius)
                });
            }
            let mut sources = Vec::new();
            let mut interval = TrustedInterval {
                lo_ms: 0,
                hi_ms: u64::MAX,
            };
            while let Some(result) = queries.join_next().await {
                if let Ok(Ok((source, range))) = result {
                    interval.lo_ms = interval.lo_ms.max(range.lo_ms);
                    interval.hi_ms = interval.hi_ms.min(range.hi_ms);
                    sources.push(source);
                }
            }
            if sources.len() < self.min_sources {
                return Err(TimeError::InsufficientSources);
            }
            check_interval(interval, floor_ms)?;
            sources.sort_by(|a, b| a.server_id.cmp(&b.server_id));
            Ok(TimeEvidence { interval, sources })
        })
    }
}

fn check_interval(interval: TrustedInterval, floor: Option<u64>) -> Result<(), TimeError> {
    if interval.lo_ms > interval.hi_ms {
        return Err(TimeError::Disagreement);
    }
    if floor.is_some_and(|floor| interval.hi_ms < floor) {
        return Err(TimeError::Rollback);
    }
    Ok(())
}

#[cfg(test)]
mod tests;
