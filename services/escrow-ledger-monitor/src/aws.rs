//! SDK errors are deliberately discarded: they may include keys, bodies or identifiers.
use crate::authority::{AuthorityBackend, PAGE_ITEMS, Page, Row};
use crate::{Backend, Error, Head, Metric, Monitor, Result, chain_from_pk};
use aws_sdk_cloudwatch::types::{Dimension, MetricDatum, StandardUnit};
use aws_sdk_dynamodb::config::{
    retry::{RetryConfig, RetryPartition, TokenBucket},
    timeout::TimeoutConfig,
};
use aws_sdk_dynamodb::types::AttributeValue as A;
use escrow_enclave::authority::state::MAX_ITEM_BYTES;
use escrow_enclave::ledger::{MAX_CHAIN_RECORDS, MAX_RECORD_BYTES};
use std::collections::HashMap;
use std::time::Duration;

fn authority_pk(pk: &str) -> Result<()> {
    let value = pk.strip_prefix("ACCOUNT#").ok_or(Error::Integrity)?;
    if value.len() != 64
        || !value
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(Error::Integrity);
    }
    Ok(())
}
fn authority_row(item: &HashMap<String, A>) -> Result<Row> {
    let pk = text(item, "pk")?;
    authority_pk(pk)?;
    let sk = text(item, "sk")?;
    let payload = item
        .get("payload")
        .and_then(|v| v.as_b().ok())
        .ok_or(Error::Integrity)?
        .as_ref();
    if item.len() != 3 || sk.len() > 128 || payload.is_empty() || payload.len() > MAX_ITEM_BYTES {
        return Err(Error::Integrity);
    }
    Ok(Row {
        pk: pk.into(),
        sk: sk.into(),
        payload: payload.to_vec(),
    })
}

type Key = HashMap<String, A>;
fn next_key(key: Option<Key>) -> Option<Key> {
    key.filter(|k| !k.is_empty())
}

#[async_trait::async_trait]
impl AuthorityBackend for Aws {
    type Cursor = Key;
    async fn authority_partition_page(
        &self,
        table: &str,
        cursor: Option<Key>,
    ) -> Result<Page<String, Key>> {
        let page = self
            .db
            .scan()
            .table_name(table)
            .consistent_read(true)
            .projection_expression("pk")
            .limit(PAGE_ITEMS as i32)
            .set_exclusive_start_key(cursor)
            .send()
            .await
            .map_err(|_| Error::Unavailable)?;
        let items = page
            .items()
            .iter()
            .map(|item| {
                let pk = text(item, "pk")?;
                authority_pk(pk)?;
                Ok(pk.to_owned())
            })
            .collect::<Result<_>>()?;
        Ok(Page {
            items,
            next: next_key(page.last_evaluated_key),
        })
    }
    async fn authority_account(&self, table: &str, pk: &str) -> Result<Option<Vec<u8>>> {
        authority_pk(pk)?;
        let output = self
            .db
            .get_item()
            .table_name(table)
            .key("pk", A::S(pk.into()))
            .key("sk", A::S("ENROLLMENT".into()))
            .consistent_read(true)
            .send()
            .await
            .map_err(|_| Error::Unavailable)?;
        output
            .item
            .map(|item| {
                let row = authority_row(&item)?;
                if row.pk != pk || row.sk != "ENROLLMENT" {
                    return Err(Error::Integrity);
                }
                Ok(row.payload)
            })
            .transpose()
    }
    async fn authority_rows_page(
        &self,
        table: &str,
        pk: &str,
        cursor: Option<Key>,
    ) -> Result<Page<Row, Key>> {
        authority_pk(pk)?;
        let page = self
            .db
            .query()
            .table_name(table)
            .consistent_read(true)
            .key_condition_expression("pk = :pk")
            .expression_attribute_values(":pk", A::S(pk.into()))
            .limit(PAGE_ITEMS as i32)
            .set_exclusive_start_key(cursor)
            .send()
            .await
            .map_err(|_| Error::Unavailable)?;
        let items = page
            .items()
            .iter()
            .map(|item| {
                let row = authority_row(item)?;
                if row.pk != pk {
                    return Err(Error::Integrity);
                }
                Ok(row)
            })
            .collect::<Result<_>>()?;
        Ok(Page {
            items,
            next: next_key(page.last_evaluated_key),
        })
    }
}

/// DynamoDB attempts per request (first try + retries). Scan/Query throttles
/// are seen on every run; the SDK default (3 attempts) once let one Scan
/// throttle fail a production sweep.
pub const DYNAMODB_MAX_ATTEMPTS: u32 = 8;
pub const DYNAMODB_INITIAL_BACKOFF: Duration = Duration::from_millis(200);
pub const DYNAMODB_MAX_BACKOFF: Duration = Duration::from_secs(8);
/// One attempt; a hung connection is retried rather than waited on.
pub const DYNAMODB_ATTEMPT_TIMEOUT: Duration = Duration::from_secs(10);
/// One request including every retry and adaptive rate-limit wait. One
/// request fits inside `DEADLINE_MARGIN - DEADLINE_ABANDON`; an account makes
/// several requests in sequence, so an account still reading at the abandon
/// point is dropped there (the abandon point, not this, bounds an account).
pub const DYNAMODB_OPERATION_TIMEOUT: Duration = Duration::from_secs(35);
const CONNECT_TIMEOUT: Duration = Duration::from_millis(3100);
/// This client's own retry partition (see `dynamodb_config`).
pub const DYNAMODB_RETRY_PARTITION: &str = "escrow-ledger-monitor-dynamodb";

/// DynamoDB client configuration for both sweeps. Adaptive retry adds a
/// client-side rate limiter shared by every concurrent account read, so a
/// throttle slows the whole sweep down. Backoff (with jitter) sums to at most
/// ~21 s over 8 attempts, and the operation timeout bounds each request.
///
/// Retry quota: the SDK default is one 500-token bucket per process for the
/// `dynamodb` partition, 5 tokens per retry and permits of replaced attempts
/// never returned. With 16 accounts in flight one throttle storm (~100
/// retries) drains it, after which every throttled request fails on its first
/// attempt whatever `max_attempts` says, for the rest of the warm container.
/// This client therefore gets its own partition with an unlimited bucket:
/// attempts, backoff, the adaptive rate limiter and the operation timeout
/// already bound every request, and the sweep's deadline bounds the run.
pub fn dynamodb_config(sdk: &aws_config::SdkConfig) -> aws_sdk_dynamodb::Config {
    aws_sdk_dynamodb::config::Builder::from(sdk)
        .retry_partition(
            RetryPartition::custom(DYNAMODB_RETRY_PARTITION)
                .token_bucket(TokenBucket::unlimited())
                .build(),
        )
        .retry_config(
            RetryConfig::adaptive()
                .with_max_attempts(DYNAMODB_MAX_ATTEMPTS)
                .with_initial_backoff(DYNAMODB_INITIAL_BACKOFF)
                .with_max_backoff(DYNAMODB_MAX_BACKOFF),
        )
        .timeout_config(
            TimeoutConfig::builder()
                .connect_timeout(CONNECT_TIMEOUT)
                .operation_attempt_timeout(DYNAMODB_ATTEMPT_TIMEOUT)
                .operation_timeout(DYNAMODB_OPERATION_TIMEOUT)
                .build(),
        )
        .build()
}

/// One CloudWatch/SNS attempt, and one delivery including SDK retries.
/// Alarm deliveries are never abandoned at the deadline, so they must finish
/// well inside `DEADLINE_ABANDON`: queued per-account alarms (concurrently)
/// and then the final coverage alarm take at most twice this.
pub const SINK_ATTEMPT_TIMEOUT: Duration = Duration::from_secs(3);
pub const SINK_OPERATION_TIMEOUT: Duration = Duration::from_secs(8);

/// SDK configuration for the CloudWatch and SNS clients (alarm sinks). A hung
/// sink call fails (Err, so Lambda retries) instead of running past the
/// invocation deadline into a silent timeout.
pub fn sink_config(sdk: &aws_config::SdkConfig) -> aws_config::SdkConfig {
    sdk.to_builder()
        .timeout_config(
            TimeoutConfig::builder()
                .connect_timeout(CONNECT_TIMEOUT)
                .operation_attempt_timeout(SINK_ATTEMPT_TIMEOUT)
                .operation_timeout(SINK_OPERATION_TIMEOUT)
                .build(),
        )
        .build()
}

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
    async fn head(&self, chain: &str) -> Result<Option<Head>> {
        let pk = format!("ENROLL#{chain}");
        chain_from_pk(&pk)?;
        let output = self
            .db
            .get_item()
            .table_name(&self.heads)
            .key("pk", A::S(pk))
            .consistent_read(true)
            .send()
            .await
            .map_err(|_| Error::Unavailable)?;
        output
            .item
            .map(|item| {
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
                Ok(Head {
                    chain: chain.to_owned(),
                    seq,
                    hash,
                })
            })
            .transpose()
    }
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
        self.gauge(metric, 1).await
    }

    async fn gauge(&self, metric: Metric, value: u64) -> Result<()> {
        self.cw
            .put_metric_data()
            .namespace(NAMESPACE)
            .metric_data(
                MetricDatum::builder()
                    .metric_name(metric.name())
                    // Counts are bounded by MAX_PARTITIONS, exact in f64.
                    .value(value as f64)
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
        let mut completed = false;
        for _ in 0..10_000 {
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
                completed = true;
                break;
            }
        }
        if !completed {
            return Err(Error::Unavailable);
        }
        // Heads alone cannot reveal deleted/missing heads. Enumerate records too,
        // projecting only partition keys to keep each page and memory bounded.
        let mut cursor = None;
        for _ in 0..10_000 {
            let page = self
                .backend
                .db
                .scan()
                .table_name(&self.backend.records)
                .consistent_read(true)
                .projection_expression("pk")
                .limit(25)
                .set_exclusive_start_key(cursor)
                .send()
                .await
                .map_err(|_| Error::Unavailable)?;
            let mut chains = std::collections::BTreeSet::new();
            for item in page.items() {
                match text(item, "pk").and_then(chain_from_pk) {
                    Ok(chain) => {
                        chains.insert(chain);
                    }
                    Err(_) => self.alarm(Metric::LedgerIntegrityFailure).await?,
                }
            }
            for chain in chains {
                match self.sweep_record_chain(chain).await {
                    Err(Error::Integrity) => self.alarm(Metric::LedgerIntegrityFailure).await?,
                    result => result?,
                }
            }
            cursor = page.last_evaluated_key;
            if cursor.as_ref().is_none_or(HashMap::is_empty) {
                return self.backend.metric(Metric::SweepCompleted).await;
            }
        }
        Err(Error::Unavailable)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aws_sdk_dynamodb::config::retry::RetryMode;

    #[test]
    fn dynamodb_client_retries_throttles_adaptively_within_the_deadline_margin() {
        let sdk = aws_config::SdkConfig::builder()
            .behavior_version(aws_config::BehaviorVersion::latest())
            .region(aws_config::Region::new("us-east-1"))
            .build();
        let config = dynamodb_config(&sdk);
        let retry = config.retry_config().unwrap();
        assert_eq!(retry.mode(), RetryMode::Adaptive);
        assert_eq!(retry.max_attempts(), DYNAMODB_MAX_ATTEMPTS);
        assert!(retry.max_attempts() > 3, "more than the SDK default");
        assert_eq!(retry.initial_backoff(), DYNAMODB_INITIAL_BACKOFF);
        assert_eq!(retry.max_backoff(), DYNAMODB_MAX_BACKOFF);
        let timeout = config.timeout_config().unwrap();
        assert_eq!(
            timeout.operation_timeout(),
            Some(DYNAMODB_OPERATION_TIMEOUT)
        );
        assert_eq!(
            timeout.operation_attempt_timeout(),
            Some(DYNAMODB_ATTEMPT_TIMEOUT)
        );
        assert_eq!(timeout.connect_timeout(), Some(CONNECT_TIMEOUT));
        // Its own partition (unlimited bucket), not the process-wide default
        // `dynamodb` quota that concurrent throttled retries would drain.
        let partition = config.retry_partition().unwrap();
        assert_eq!(
            partition,
            &RetryPartition::custom(DYNAMODB_RETRY_PARTITION).build()
        );
        assert_ne!(partition, &RetryPartition::new("dynamodb"));
        // Worst-case backoff over every retry fits inside one operation, and one
        // operation fits between the deadline stop and the abandon point.
        let backoff: Duration = (0..DYNAMODB_MAX_ATTEMPTS - 1)
            .map(|n| (DYNAMODB_INITIAL_BACKOFF * 2u32.pow(n)).min(DYNAMODB_MAX_BACKOFF))
            .sum();
        assert!(backoff < DYNAMODB_OPERATION_TIMEOUT, "{backoff:?}");
        assert!(
            DYNAMODB_OPERATION_TIMEOUT
                < crate::authority::DEADLINE_MARGIN - crate::authority::DEADLINE_ABANDON
        );
    }

    #[test]
    fn alarm_sinks_time_out_well_inside_the_deadline_abandon_window() {
        let sdk = aws_config::SdkConfig::builder()
            .behavior_version(aws_config::BehaviorVersion::latest())
            .region(aws_config::Region::new("us-east-1"))
            .build();
        let sink = sink_config(&sdk);
        let timeout = sink.timeout_config().unwrap();
        assert_eq!(timeout.operation_timeout(), Some(SINK_OPERATION_TIMEOUT));
        assert_eq!(
            timeout.operation_attempt_timeout(),
            Some(SINK_ATTEMPT_TIMEOUT)
        );
        assert_eq!(timeout.connect_timeout(), Some(CONNECT_TIMEOUT));
        assert_eq!(sink.region(), sdk.region());
        // Queued alarms, then the final coverage alarm, after the abandon point.
        assert!(2 * SINK_OPERATION_TIMEOUT < crate::authority::DEADLINE_ABANDON);
        // The clients built in main.rs carry it.
        let cw = aws_sdk_cloudwatch::Config::from(&sink);
        assert_eq!(
            cw.timeout_config().unwrap().operation_timeout(),
            Some(SINK_OPERATION_TIMEOUT)
        );
        let sns = aws_sdk_sns::Config::from(&sink);
        assert_eq!(
            sns.timeout_config().unwrap().operation_timeout(),
            Some(SINK_OPERATION_TIMEOUT)
        );
    }
}
