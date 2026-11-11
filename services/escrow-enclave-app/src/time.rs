//! Nonce-bound signed time. Local timers bound resource use, NOT trusted elapsed time.
use std::{future::Future, pin::Pin, sync::Arc, time::Duration};

use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use tokio::{
    task::JoinSet,
    time::{timeout_at, Instant},
};

mod protocol;
#[cfg(any(target_os = "linux", feature = "fake-time"))]
pub mod relay;
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

    /// Three independently operated, provider-published pins; two required sources.
    /// Ten-second radius cap accommodates rough/smeared time without relaxing
    /// intersection within the authenticated quorum. The untrusted host can already
    /// suppress a source; waiting for all does not bound it. Security rests on
    /// min_sources independent signatures whose intervals mutually intersect.
    /// This does not assert service availability or production readiness.
    pub fn production(transport: Arc<dyn RoughtimeTransport>) -> Result<Self, TimeError> {
        Self::new(servers::published()?, transport, 2, 10_000)
    }
}

impl TimeSource for RoughtimeTimeSource {
    fn now(&self, floor_ms: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async move {
            let mut queries = JoinSet::new();
            // One shared deadline, not N serial timeouts. Local timers limit work
            // only; they are never evidence of trusted elapsed time.
            let deadline = Instant::now() + Duration::from_secs(2);
            for server in self.servers.clone() {
                let transport = self.transport.clone();
                let max_radius = self.max_radius_ms;
                queries.spawn(async move {
                    let mut nonce = vec![0; server.protocol.nonce_size()];
                    OsRng
                        .try_fill_bytes(&mut nonce)
                        .map_err(|_| TimeError::Unavailable)?;
                    let request = protocol::request(server.protocol, &nonce)?;
                    let response = timeout_at(deadline, transport.exchange(&server.id, request))
                        .await
                        .map_err(|_| TimeError::Unavailable)??;
                    protocol::verify(&server, &nonce, &response, max_radius)
                });
            }
            let mut verified = Vec::new();
            let mut rollback = false;
            while let Some(result) = queries.join_next().await {
                if let Ok(Ok((source, range))) = result {
                    verified.push((source, range));
                    // Every nonempty interval intersection contains a lower
                    // endpoint. Search these points, not exponential subsets.
                    for (_, candidate) in &verified {
                        let point = candidate.lo_ms.max(floor_ms.unwrap_or(0));
                        let quorum: Vec<_> = verified
                            .iter()
                            .filter(|(_, r)| r.lo_ms <= point && point <= r.hi_ms)
                            .take(self.min_sources)
                            .collect();
                        if quorum.len() == self.min_sources {
                            let interval = TrustedInterval {
                                lo_ms: quorum.iter().map(|(_, r)| r.lo_ms).max().unwrap(),
                                hi_ms: quorum.iter().map(|(_, r)| r.hi_ms).min().unwrap(),
                            };
                            check_interval(interval, floor_ms)?;
                            let mut sources: Vec<_> =
                                quorum.iter().map(|(s, _)| s.clone()).collect();
                            sources.sort_by(|a, b| a.server_id.cmp(&b.server_id));
                            queries.abort_all();
                            return Ok(TimeEvidence { interval, sources });
                        }
                        rollback |= verified
                            .iter()
                            .filter(|(_, r)| {
                                r.lo_ms <= candidate.lo_ms && candidate.lo_ms <= r.hi_ms
                            })
                            .count()
                            >= self.min_sources;
                    }
                }
            }
            if verified.len() < self.min_sources {
                return Err(TimeError::InsufficientSources);
            }
            Err(if rollback {
                TimeError::Rollback
            } else {
                TimeError::Disagreement
            })
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
mod live_tests;
#[cfg(test)]
pub(crate) mod tests;
