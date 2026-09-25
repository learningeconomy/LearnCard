//! SDK errors are deliberately discarded: they may include keys, bodies or identifiers.
use crate::{Backend, Error, Head, Metric, Monitor, Result, chain_from_pk};
use aws_sdk_cloudwatch::types::{Dimension, MetricDatum, StandardUnit};
use aws_sdk_dynamodb::types::AttributeValue as A;
use escrow_enclave::ledger::{MAX_CHAIN_RECORDS, MAX_RECORD_BYTES};
use std::collections::HashMap;

pub const NAMESPACE: &str = "LearnCard/EscrowLedger";

pub struct Aws {
    pub db: aws_sdk_dynamodb::Client,
    pub s3: aws_sdk_s3::Client,
    pub cw: aws_sdk_cloudwatch::Client,
    pub sns: aws_sdk_sns::Client,
    pub records: String,
    pub heads: String,
    pub bucket: String,
    pub topic: String,
    pub tenant: String,
}

fn text<'a>(item: &'a HashMap<String, A>, name: &str) -> Result<&'a str> {
    item.get(name)
        .and_then(|v| v.as_s().ok())
        .map(String::as_str)
        .ok_or(Error::Integrity)
}

#[async_trait::async_trait]
impl Backend for Aws {
    async fn chain(&self, chain: &str) -> Result<Vec<Vec<u8>>> {
        let pk = format!("ENROLL#{chain}");
        chain_from_pk(&pk)?;
        let mut cursor = None;
        let mut records = Vec::new();
        for _ in 0..=MAX_CHAIN_RECORDS {
            let page = self
                .db
                .query()
                .table_name(&self.records)
                .consistent_read(true)
                .key_condition_expression("pk = :pk")
                .expression_attribute_values(":pk", A::S(pk.clone()))
                .scan_index_forward(true)
                .limit(1)
                .set_exclusive_start_key(cursor)
                .send()
                .await
                .map_err(|_| Error::Unavailable)?;
            for item in page.items() {
                let bytes = item
                    .get("record")
                    .and_then(|v| v.as_b().ok())
                    .ok_or(Error::Integrity)?
                    .as_ref();
                if records.len() == MAX_CHAIN_RECORDS
                    || bytes.len() > MAX_RECORD_BYTES
                    || text(item, "sk")? != format!("SEQ#{:020}", records.len())
                {
                    return Err(Error::Integrity);
                }
                records.push(bytes.to_vec());
            }
            cursor = page.last_evaluated_key;
            if cursor.as_ref().is_none_or(HashMap::is_empty) {
                return Ok(records);
            }
        }
        Err(Error::Integrity)
    }

    async fn audit(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let mut object = match self
            .s3
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
        {
            Ok(object) => object,
            Err(e) if e.as_service_error().is_some_and(|e| e.is_no_such_key()) => return Ok(None),
            Err(_) => return Err(Error::Unavailable),
        };
        // Oversized audit bodies are mismatches, not unbounded allocations.
        if !object
            .content_length
            .is_some_and(|n| (1..=MAX_RECORD_BYTES as i64).contains(&n))
        {
            return Ok(Some(Vec::new()));
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = object
            .body
            .try_next()
            .await
            .map_err(|_| Error::Unavailable)?
        {
            if bytes.len() + chunk.len() > MAX_RECORD_BYTES {
                return Ok(Some(Vec::new()));
            }
            bytes.extend_from_slice(&chunk);
        }
        Ok(Some(bytes))
    }

    async fn metric(&self, metric: Metric) -> Result<()> {
        self.cw
            .put_metric_data()
            .namespace(NAMESPACE)
            .metric_data(
                MetricDatum::builder()
                    .metric_name(metric.name())
                    .value(1.0)
                    .unit(StandardUnit::Count)
                    .dimensions(
                        Dimension::builder()
                            .name("Tenant")
                            .value(&self.tenant)
                            .build(),
                    )
                    .build(),
            )
            .send()
            .await
            .map_err(|_| Error::Unavailable)?;
        Ok(())
    }

    async fn notify(&self, metric: Metric) -> Result<()> {
        self.sns
            .publish()
            .topic_arn(&self.topic)
            .subject("Escrow ledger monitor alarm")
            .message(metric.name())
            .send()
            .await
            .map_err(|_| Error::Unavailable)?;
        Ok(())
    }
}

impl Monitor<Aws> {
    /// There are no timestamps on either table. Full pagination is intentional;
    /// an in-memory cursor or a timestamp filter would silently miss committed data.
    pub async fn sweep(&self) -> Result<()> {
        let mut cursor = None;
        loop {
            let page = self
                .backend
                .db
                .scan()
                .table_name(&self.backend.heads)
                .consistent_read(true)
                .limit(25)
                .set_exclusive_start_key(cursor)
                .send()
                .await
                .map_err(|_| Error::Unavailable)?;
            for item in page.items() {
                let parsed = (|| {
                    let chain = chain_from_pk(text(item, "pk")?)?.to_owned();
                    let seq = item
                        .get("head_seq")
                        .and_then(|v| v.as_n().ok())
                        .and_then(|s| s.parse::<u64>().ok())
                        .filter(|n| *n < MAX_CHAIN_RECORDS as u64)
                        .ok_or(Error::Integrity)?;
                    let hash = item
                        .get("head_hash")
                        .and_then(|v| v.as_b().ok())
                        .and_then(|b| b.as_ref().try_into().ok())
                        .ok_or(Error::Integrity)?;
                    Ok::<_, Error>(Head { chain, seq, hash })
                })();
                match parsed {
                    Ok(head) => {
                        self.sweep_head(&head).await?;
                        // Re-read after chain validation: a scan is not a snapshot.
                        // An unchanged stale head with later records is an anomaly.
                        let bytes = self.backend.chain(&head.chain).await?;
                        let current = self
                            .backend
                            .db
                            .get_item()
                            .table_name(&self.backend.heads)
                            .key("pk", A::S(format!("ENROLL#{}", head.chain)))
                            .consistent_read(true)
                            .send()
                            .await
                            .map_err(|_| Error::Unavailable)?;
                        let seq = current
                            .item
                            .as_ref()
                            .and_then(|i| i.get("head_seq"))
                            .and_then(|v| v.as_n().ok())
                            .and_then(|s| s.parse::<u64>().ok());
                        if seq.is_none_or(|seq| {
                            seq >= MAX_CHAIN_RECORDS as u64 || seq + 1 < bytes.len() as u64
                        }) {
                            self.alarm(Metric::LedgerIntegrityFailure).await?;
                        }
                    }
                    Err(_) => self.alarm(Metric::LedgerIntegrityFailure).await?,
                }
            }
            cursor = page.last_evaluated_key;
            if cursor.as_ref().is_none_or(HashMap::is_empty) {
                break;
            }
        }
        self.backend.metric(Metric::SweepCompleted).await
    }
}
