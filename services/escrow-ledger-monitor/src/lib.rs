//! Independent, read-only detection. No record identifiers or SDK errors enter telemetry.
use escrow_enclave::ledger::{Enrollment, Event, Ledger, LedgerRecord, MAX_CHAIN_RECORDS};
use p256::ecdsa::VerifyingKey;

pub mod aws;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum Error {
    #[error("monitor unavailable")]
    Unavailable,
    #[error("invalid monitor configuration")]
    Configuration,
    #[error("ledger integrity failure")]
    Integrity,
}
pub type Result<T> = std::result::Result<T, Error>;

/// Only fixed metric names and an operator-configured tenant leave the monitor.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Metric {
    LedgerIntegrityFailure,
    AuditMismatch,
    HoldCreated,
    Released,
    PinAttemptReserved,
    PinAttemptFailed,
    PinAttemptSucceeded,
    PinLocked,
    Cancelled,
    SweepCompleted,
}
impl Metric {
    pub fn name(self) -> &'static str {
        match self {
            Self::LedgerIntegrityFailure => "LedgerIntegrityFailure",
            Self::AuditMismatch => "AuditMismatch",
            Self::HoldCreated => "HoldCreated",
            Self::Released => "Released",
            Self::PinAttemptReserved => "PinAttemptReserved",
            Self::PinAttemptFailed => "PinAttemptFailed",
            Self::PinAttemptSucceeded => "PinAttemptSucceeded",
            Self::PinLocked => "PinLocked",
            Self::Cancelled => "Cancelled",
            Self::SweepCompleted => "SweepCompleted",
        }
    }
}
impl From<Event> for Metric {
    fn from(event: Event) -> Self {
        match event {
            Event::HoldCreated => Self::HoldCreated,
            Event::Released => Self::Released,
            Event::PinAttemptReserved { .. } => Self::PinAttemptReserved,
            Event::PinAttemptFailed => Self::PinAttemptFailed,
            Event::PinAttemptSucceeded => Self::PinAttemptSucceeded,
            Event::PinLocked => Self::PinLocked,
            Event::Cancelled => Self::Cancelled,
        }
    }
}

pub struct Head {
    pub chain: String,
    pub seq: u64,
    pub hash: [u8; 32],
}

#[async_trait::async_trait]
pub trait Backend: Send + Sync {
    async fn chain(&self, chain: &str) -> Result<Vec<Vec<u8>>>;
    async fn audit(&self, key: &str) -> Result<Option<Vec<u8>>>;
    async fn metric(&self, metric: Metric) -> Result<()>;
    async fn notify(&self, metric: Metric) -> Result<()>;
}

pub struct Monitor<B> {
    pub backend: B,
    pub tenant: String,
    pub key: VerifyingKey,
}

pub fn chain_from_pk(pk: &str) -> Result<&str> {
    let chain = pk.strip_prefix("ENROLL#").ok_or(Error::Integrity)?;
    if chain.len() != 64
        || !chain
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(Error::Integrity);
    }
    Ok(chain)
}

impl<B: Backend> Monitor<B> {
    pub async fn alarm(&self, metric: Metric) -> Result<()> {
        // Attempt both independently; an unavailable sink must cause Lambda retry.
        let (metric_result, sns_result) =
            tokio::join!(self.backend.metric(metric), self.backend.notify(metric));
        metric_result.and(sns_result)
    }

    fn verify(&self, chain: &str, bytes: &[Vec<u8>]) -> Result<Vec<LedgerRecord>> {
        if bytes.is_empty() || bytes.len() > MAX_CHAIN_RECORDS {
            return Err(Error::Integrity);
        }
        let records: Vec<_> = bytes
            .iter()
            .map(|b| LedgerRecord::decode(b))
            .collect::<std::result::Result<_, _>>()
            .map_err(|_| Error::Integrity)?;
        let first = &records[0];
        let enrollment = Enrollment {
            tenant: first.tenant.clone(),
            enrollment_id: first.enrollment_id,
            epoch: first.enrollment_epoch,
            blob_hash: first.blob_hash,
        };
        if first.tenant != self.tenant || enrollment.chain_id() != chain {
            return Err(Error::Integrity);
        }
        Ledger::verify_chain(&records, &enrollment, &self.key).map_err(|_| Error::Integrity)?;
        Ok(records)
    }

    /// MODIFY/REMOVE alarm without parsing images or making storage reads.
    pub async fn stream(&self, action: &str, pk: &str, sk: &str, image: &[u8]) -> Result<()> {
        if matches!(action, "MODIFY" | "REMOVE") {
            return self.alarm(Metric::LedgerIntegrityFailure).await;
        }
        if action != "INSERT" {
            return self.alarm(Metric::LedgerIntegrityFailure).await;
        }
        let result = self.insert(pk, sk, image).await;
        match result {
            Err(Error::Integrity) => self.alarm(Metric::LedgerIntegrityFailure).await,
            other => other,
        }
    }

    async fn insert(&self, pk: &str, sk: &str, image: &[u8]) -> Result<()> {
        let chain = chain_from_pk(pk)?;
        let bytes = self.backend.chain(chain).await?;
        let records = self.verify(chain, &bytes)?;
        let incoming = LedgerRecord::decode(image).map_err(|_| Error::Integrity)?;
        if sk != format!("SEQ#{:020}", incoming.seq)
            || bytes.get(incoming.seq as usize).map(Vec::as_slice) != Some(image)
        {
            return Err(Error::Integrity);
        }
        self.backend
            .metric(records[incoming.seq as usize].event.into())
            .await
    }

    /// Snapshot head may lag concurrent appends: it must match a verified prefix.
    pub async fn sweep_head(&self, head: &Head) -> Result<()> {
        match self.check_head(head).await {
            Err(Error::Integrity) => self.alarm(Metric::LedgerIntegrityFailure).await,
            other => other,
        }
    }

    async fn check_head(&self, head: &Head) -> Result<()> {
        let bytes = self.backend.chain(&head.chain).await?;
        let records = self.verify(&head.chain, &bytes)?;
        if records
            .get(head.seq as usize)
            .and_then(|r| r.record_hash().ok())
            != Some(head.hash)
        {
            return Err(Error::Integrity);
        }
        for (record, bytes) in records.iter().zip(bytes.iter()) {
            let hash = record.record_hash().map_err(|_| Error::Integrity)?;
            let key = format!(
                "audit/{}/{}/{}-{}.cbor",
                self.tenant,
                head.chain,
                record.seq,
                hex::encode(hash)
            );
            if self.backend.audit(&key).await?.as_ref() != Some(bytes) {
                self.alarm(Metric::AuditMismatch).await?;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests;
