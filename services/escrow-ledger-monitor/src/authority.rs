//! Independent read-only authority audit. A proposal alone never proves commit:
//! execution receipts and current rows come from authenticated DynamoDB reads,
//! bracketed by an unchanged account row. No host API, Mongo, writer credential,
//! escrow key or enclave transition implementation is consulted.
use crate::{Backend, Error, Metric, Monitor, Result};
use base64::{Engine, engine::general_purpose::STANDARD};
use escrow_enclave::authority::{
    audit::{AuthorityEvent, ExecutionRecord},
    record::{RecordKind, SignedAuthorityRecord},
    state::{
        Binding, EnrollmentStatus, HoldStatus, ItemValue, MAX_COUNTER, MAX_EVENT_BYTES,
        MAX_ITEM_BYTES, OperationKind as Kind, OperationOutcome as Outcome, PIN_BUDGET, StoredItem,
    },
};
use p256::ecdsa::VerifyingKey;
use std::collections::{BTreeMap, BTreeSet, HashSet, VecDeque};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering::SeqCst};
use std::time::Duration;
use tokio::time::Instant;

/// Per-account bounds. Rows are append-only (no TTL, never deleted), so a single
/// account grows by ~8 rows per PIN recovery forever. Sized from measured staging
/// rows (~7.3 KB each) against the 1024 MiB Lambda: see the README capacity note
/// before changing either value. At the measured ~7.3 KB/row the row bound is
/// hit first (~114 MiB); the byte bound caps worst-case memory for larger rows.
pub const MAX_ACCOUNT_ROWS: usize = 16_384;
pub const MAX_ACCOUNT_BYTES: usize = 128 * 1024 * 1024;
/// Hard sanity bound on distinct partitions discovered by one sweep (and so on
/// the dedupe set, ~25 MiB at the bound). It is not the operative limit: the
/// invocation deadline is (README "Capacity note"). Exceeding it is coverage
/// failure, never partial success.
pub const MAX_PARTITIONS: usize = 500_000;
/// Hard sanity bound on partition Scan pages of `PAGE_ITEMS` keys (50M rows).
pub const MAX_SCAN_PAGES: usize = 500_000;
/// Items per partition Scan page and per account Query page.
pub const PAGE_ITEMS: usize = 100;
/// Reads of one account's bracketed history (1 + retries) before its fence is
/// reported unstable. A legitimate write between the two account reads changes
/// the fence; a retry normally lands after it.
pub const FENCE_ATTEMPTS: usize = 3;
const FENCE_RETRY_DELAY: Duration = Duration::from_millis(250);

/// Accounts read and verified concurrently by default. Overridable at cold
/// start with `AUTHORITY_SWEEP_CONCURRENCY` (1..=`MAX_SWEEP_CONCURRENCY`).
pub const DEFAULT_SWEEP_CONCURRENCY: usize = 16;
/// Hard maximum concurrency (memory arithmetic in the README capacity note).
pub const MAX_SWEEP_CONCURRENCY: usize = 32;
/// Row bytes an account may hold before it must take the single large-account
/// lane. Checked before each Query page, so an account outside the lane holds
/// at most this plus one page. The lane is held until that account's rows are
/// verified and dropped, so at most one large account is in flight at a time.
pub const LARGE_ACCOUNT_BYTES: usize = 1024 * 1024;
/// Largest row payload one Query page can carry: DynamoDB stops a page after
/// 1 MB of data read, plus the item that crossed it.
pub const MAX_PAGE_BYTES: usize = 1024 * 1024 + MAX_ITEM_BYTES;
/// Stop starting accounts (and Scan pages) once less than this remains before
/// the invocation deadline. In-flight accounts finish; the sweep then reports
/// coverage failure with a `DeadlineReached` line instead of timing out.
pub const DEADLINE_MARGIN: Duration = Duration::from_secs(60);
/// In-flight account reads still running this close to the deadline are
/// abandoned (dropped: they only read) so the coverage failure, the diagnostic
/// and every already-queued alarm are still delivered. Alarm deliveries are
/// never abandoned.
pub const DEADLINE_ABANDON: Duration = Duration::from_secs(20);

/// Worst-case row payload held by in-flight accounts at `concurrency`: every
/// account outside the lane at the threshold plus one page, and the single
/// lane account at the per-account byte bound.
pub const fn in_flight_bound(concurrency: usize) -> usize {
    concurrency * (LARGE_ACCOUNT_BYTES + MAX_PAGE_BYTES) + MAX_ACCOUNT_BYTES
}

/// Per-invocation sweep settings.
#[derive(Debug, Clone, Copy)]
pub struct SweepOptions {
    /// Accounts in flight at once (clamped to 1..=`MAX_SWEEP_CONCURRENCY`).
    pub concurrency: usize,
    /// Invocation deadline (Lambda context). `None`: no deadline guard.
    pub deadline: Option<Instant>,
    pub(crate) max_partitions: usize,
    pub(crate) max_scan_pages: usize,
}
impl Default for SweepOptions {
    fn default() -> Self {
        Self::new(DEFAULT_SWEEP_CONCURRENCY, None)
    }
}
impl SweepOptions {
    pub fn new(concurrency: usize, deadline: Option<Instant>) -> Self {
        Self {
            concurrency,
            deadline,
            max_partitions: MAX_PARTITIONS,
            max_scan_pages: MAX_SCAN_PAGES,
        }
    }
    /// Parse `AUTHORITY_SWEEP_CONCURRENCY`: unset or empty is the default;
    /// anything but 1..=`MAX_SWEEP_CONCURRENCY` fails cold start.
    pub fn concurrency_from_env(value: Option<&str>) -> Result<usize> {
        match value.filter(|v| !v.is_empty()) {
            None => Ok(DEFAULT_SWEEP_CONCURRENCY),
            Some(v) => v
                .parse::<usize>()
                .ok()
                .filter(|n| (1..=MAX_SWEEP_CONCURRENCY).contains(n))
                .ok_or(Error::Configuration),
        }
    }
}
/// Lambda's invocation deadline (milliseconds since the epoch, from the
/// runtime context) as a monotonic instant. A deadline already in the past is
/// reported as a deadline stop on every run: loud, never a silent timeout.
pub fn deadline_from_epoch_ms(deadline_ms: u64) -> Instant {
    Instant::now() + Duration::from_millis(deadline_ms.saturating_sub(now_ms()))
}

/// Running per-account row/byte budget, enforced by the sweep on every Query
/// page (one place for every backend) and again by `verify_account`.
#[derive(Debug, Default)]
pub struct AccountBudget {
    pub(crate) rows: usize,
    pub(crate) bytes: usize,
}
impl AccountBudget {
    /// Admit one more row of `payload_len` bytes. Exactly `MAX_ACCOUNT_ROWS`
    /// rows and `MAX_ACCOUNT_BYTES` bytes are accepted; one more is `Capacity`.
    pub fn admit(&mut self, payload_len: usize) -> Result<()> {
        let rows = self.rows + 1;
        let bytes = self.bytes.saturating_add(payload_len);
        if rows > MAX_ACCOUNT_ROWS || bytes > MAX_ACCOUNT_BYTES {
            return Err(Error::Capacity);
        }
        self.rows = rows;
        self.bytes = bytes;
        Ok(())
    }
}

/// Fixed-vocabulary diagnostic line for the Lambda log. Only these constant
/// strings and aggregate counts are ever written: never partition keys, account
/// hashes, payloads, DIDs or SDK error text. There is still no tracing subscriber.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Diagnostic {
    /// Listing partitions failed (SDK/throttle error after SDK retries, or a
    /// malformed key).
    PartitionScanFailed,
    /// Listing partitions exceeded MAX_PARTITIONS or MAX_SCAN_PAGES.
    PartitionScanOverCapacity,
    /// A strongly consistent account read failed (SDK/throttle error).
    AccountReadFailed,
    /// A read returned a malformed row; integrity alarm, account skipped.
    AccountReadMalformed,
    /// One account exceeded MAX_ACCOUNT_ROWS/MAX_ACCOUNT_BYTES; others continue.
    AccountOverCapacity,
    /// One account's fence changed on every attempt; others continue.
    FenceChangedAfterRetries,
    /// A metric, gauge or SNS publication failed.
    DeliveryFailed,
    /// Every partition was fully verified.
    Completed { partitions: usize },
    /// Every other partition was verified, but these accounts were not.
    Incomplete {
        partitions: usize,
        over_capacity: usize,
        fence_unstable: usize,
    },
    /// The invocation deadline stopped the sweep: `partitions` distinct keys
    /// were discovered and `verified` accounts were fully checked (including
    /// any that raised an integrity alarm). Coverage failure follows.
    DeadlineReached { partitions: usize, verified: usize },
}
impl std::fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match *self {
            Self::PartitionScanFailed => f.write_str("authority sweep: partition scan failed"),
            Self::PartitionScanOverCapacity => {
                f.write_str("authority sweep: partition scan over capacity")
            }
            Self::AccountReadFailed => f.write_str("authority sweep: account read failed"),
            Self::AccountReadMalformed => f.write_str("authority sweep: account read malformed"),
            Self::AccountOverCapacity => f.write_str("authority sweep: account over capacity"),
            Self::FenceChangedAfterRetries => {
                f.write_str("authority sweep: fence changed after retries")
            }
            Self::DeliveryFailed => f.write_str("authority sweep: alarm delivery failed"),
            Self::Completed { partitions } => {
                write!(f, "authority sweep: completed partitions={partitions}")
            }
            Self::Incomplete {
                partitions,
                over_capacity,
                fence_unstable,
            } => write!(
                f,
                "authority sweep: incomplete partitions={partitions} \
                 over_capacity={over_capacity} fence_unstable={fence_unstable}"
            ),
            Self::DeadlineReached {
                partitions,
                verified,
            } => write!(
                f,
                "authority sweep: deadline reached partitions={partitions} verified={verified}"
            ),
        }
    }
}

/// Outcome of reading one account's bracketed history. `Stable` carries the
/// in-flight byte accounting (and the large-account lane, if taken) until the
/// rows are verified and dropped.
enum AccountRead<'a, B: AuthorityBackend> {
    Stable {
        account: Option<Vec<u8>>,
        rows: Vec<Row>,
        held: Held<'a, B>,
    },
    OverCapacity,
    FenceUnstable,
}

/// Outcome of one account. Alarms are not delivered by the account future
/// (which may be abandoned at the deadline) but by the sweep driver.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Checked {
    /// Fully verified; `repeated` when it is a repeated-PIN-clear account.
    Verified {
        repeated: bool,
    },
    /// Malformed read, failed history check or current-row mismatch.
    Integrity,
    OverCapacity,
    FenceUnstable,
}

/// State shared by every in-flight account of one sweep.
struct Shared {
    /// Row payload bytes held by in-flight accounts.
    bytes: AtomicUsize,
    /// Accounts holding the large-account lane (0 or 1).
    large: AtomicUsize,
    /// The single large-account lane (see `LARGE_ACCOUNT_BYTES`).
    lane: tokio::sync::Semaphore,
    /// One clock reading per sweep for the repeated-PIN-clear window.
    now: u64,
}

/// One account's share of `Shared`. Released on drop, so every path (verified,
/// skipped, failed read, fence retry, or the future abandoned at the deadline)
/// returns its bytes and the lane.
struct Held<'a, B: AuthorityBackend> {
    shared: &'a Shared,
    backend: &'a B,
    bytes: usize,
    lane: Option<tokio::sync::SemaphorePermit<'a>>,
}
impl<'a, B: AuthorityBackend> Held<'a, B> {
    fn new(shared: &'a Shared, backend: &'a B) -> Self {
        Self {
            shared,
            backend,
            bytes: 0,
            lane: None,
        }
    }
    fn observe(&self) {
        self.backend.observe_in_flight(
            self.shared.bytes.load(SeqCst),
            self.shared.large.load(SeqCst),
        );
    }
    fn add(&mut self, bytes: usize) {
        self.bytes += bytes;
        self.shared.bytes.fetch_add(bytes, SeqCst);
        self.observe();
    }
    fn take_lane(&mut self, permit: tokio::sync::SemaphorePermit<'a>) {
        self.lane = Some(permit);
        self.shared.large.fetch_add(1, SeqCst);
        self.observe();
    }
    /// Return the rows of a superseded fence attempt (the lane is kept).
    fn release_rows(&mut self) {
        if self.bytes > 0 {
            self.shared.bytes.fetch_sub(self.bytes, SeqCst);
            self.bytes = 0;
            self.observe();
        }
    }
}
impl<B: AuthorityBackend> Drop for Held<'_, B> {
    fn drop(&mut self) {
        self.release_rows();
        if self.lane.take().is_some() {
            self.shared.large.fetch_sub(1, SeqCst);
            self.observe();
        }
    }
}
/// P9.1 (attack C): must match the enclave's own RELEASE_WARNING_MIN_GAP_MS
/// (policy/authority.rs) — the monitor independently re-derives this gate
/// from signed events rather than trusting the stored HoldItem's own fields.
const RELEASE_WARNING_MIN_GAP_MS: u64 = 24 * 60 * 60 * 1000;
/// Owner-signed PIN clears (configured -> not configured) per account within
/// the lookback before the sweep reports AuthorityRepeatedPinClear. One clear
/// is the expected post-recovery repair (the client may sign it automatically);
/// a second within the window is not, and may mean lca-api is inducing clears.
pub const REPEATED_PIN_CLEAR_THRESHOLD: usize = 2;
pub const REPEATED_PIN_CLEAR_WINDOW_MS: u64 = 30 * 24 * 60 * 60 * 1000;

/// Facts from a verified account history that feed rate-based (not integrity) alarms.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct AccountAudit {
    /// Signed trusted-time upper bound of every committed PIN clear, in order.
    pub pin_clears_hi_ms: Vec<u64>,
}

impl AccountAudit {
    /// True when enough PIN clears fall inside the lookback ending at `now_ms`.
    pub fn repeated_pin_clear(&self, now_ms: u64) -> bool {
        let since = now_ms.saturating_sub(REPEATED_PIN_CLEAR_WINDOW_MS);
        self.pin_clears_hi_ms
            .iter()
            .filter(|&&hi| hi >= since)
            .count()
            >= REPEATED_PIN_CLEAR_THRESHOLD
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| u64::try_from(d.as_millis()).unwrap_or(u64::MAX))
}

/// Tracks per-hold state derived only from signed ledger events, never from
/// the unauthenticated stored HoldItem row (cross-checked against it below).
struct HoldTrack<'a> {
    created: &'a AuthorityEvent,
    last: &'a AuthorityEvent,
    /// Set from the one ConfirmHold event whose guess matched (hold_status
    /// transitions AwaitingConfirmation -> Pending); None for every mismatch.
    confirmed_hi_ms: Option<u64>,
    /// Set from the earliest SendReleaseWarning event, if any. Using the
    /// earliest (not latest) is the conservative choice if a retried send
    /// ever produced more than one.
    warned_hi_ms: Option<u64>,
}

#[derive(Clone)]
pub struct Row {
    pub pk: String,
    pub sk: String,
    pub payload: Vec<u8>,
}
/// Cheap to clone (shared): a large account is verified on a blocking thread.
#[derive(Clone)]
pub struct AuthorityTrust(Arc<TrustAnchors>);
/// Key ID -> (ledger key, approved measurements).
type TrustAnchors = BTreeMap<String, (VerifyingKey, BTreeSet<[u8; 32]>)>;
pub struct Config {
    pub table: String,
    pub generation: String,
    pub trust: AuthorityTrust,
}

impl AuthorityTrust {
    /// Security-owned SSM String, not an attestation/key supplied by the parent.
    /// Retain historical key/measurement pairs for the lifetime of audit rows.
    pub fn parse(input: &str) -> Result<Self> {
        if input.len() > 8192 {
            return Err(Error::Configuration);
        }
        let values: BTreeMap<String, serde_json::Value> =
            serde_json::from_str(input).map_err(|_| Error::Configuration)?;
        if values.is_empty() || values.len() > 32 {
            return Err(Error::Configuration);
        }
        let mut keys = BTreeMap::new();
        for (id, value) in values {
            if id.is_empty()
                || id.len() > 128
                || !id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
            {
                return Err(Error::Configuration);
            }
            let object = value
                .as_object()
                .filter(|o| o.len() == 2)
                .ok_or(Error::Configuration)?;
            let public = object
                .get("publicKey")
                .and_then(|v| v.as_str())
                .ok_or(Error::Configuration)?;
            if !public.starts_with("04") || !lower_hex(public, 130) {
                return Err(Error::Configuration);
            }
            let key = VerifyingKey::from_sec1_bytes(
                &hex::decode(public).map_err(|_| Error::Configuration)?,
            )
            .map_err(|_| Error::Configuration)?;
            let values = object
                .get("measurements")
                .and_then(|v| v.as_array())
                .filter(|a| !a.is_empty() && a.len() <= 8)
                .ok_or(Error::Configuration)?;
            let mut measurements = BTreeSet::new();
            for value in values {
                let text = value
                    .as_str()
                    .filter(|s| lower_hex(s, 64))
                    .ok_or(Error::Configuration)?;
                let mut hash = [0; 32];
                hex::decode_to_slice(text, &mut hash).map_err(|_| Error::Configuration)?;
                if !measurements.insert(hash) {
                    return Err(Error::Configuration);
                }
            }
            keys.insert(id, (key, measurements));
        }
        Ok(Self(Arc::new(keys)))
    }

    /// Kind is a required expectation. Commit/Snapshot evidence cannot masquerade
    /// as a proposal (or authorize a state transition in this read-only process).
    pub fn verify_artifact(
        &self,
        record: &SignedAuthorityRecord,
        kind: RecordKind,
    ) -> Result<Vec<u8>> {
        let (key, measurements) = self.0.get(&record.key_id).ok_or(Error::Integrity)?;
        check(record.kind == kind && measurements.contains(&record.measurement))?;
        record.verify(key).map_err(|_| Error::Integrity)?;
        STANDARD
            .decode(&record.payload)
            .map_err(|_| Error::Integrity)
    }
}

/// One page of a paginated read. `next` is `None` only when the read is
/// complete (DynamoDB returned no LastEvaluatedKey).
pub struct Page<T, C> {
    pub items: Vec<T>,
    pub next: Option<C>,
}

#[async_trait::async_trait]
pub trait AuthorityBackend: Backend {
    /// Opaque pagination cursor (DynamoDB LastEvaluatedKey).
    type Cursor: Send + 'static;
    /// One strongly consistent Scan page projecting `pk` of every row (all row
    /// types, at most `PAGE_ITEMS`). A partition appears once per row, possibly
    /// on several pages; the sweep deduplicates. `cursor` is `None` for page one.
    /// A malformed key is `Error::Integrity`.
    async fn authority_partition_page(
        &self,
        table: &str,
        cursor: Option<Self::Cursor>,
    ) -> Result<Page<String, Self::Cursor>>;
    async fn authority_account(&self, table: &str, pk: &str) -> Result<Option<Vec<u8>>>;
    /// One strongly consistent Query page of one account's rows (at most
    /// `PAGE_ITEMS`; DynamoDB also stops a page after 1 MB). A malformed row is
    /// `Error::Integrity`. The sweep enforces `AccountBudget` across pages.
    async fn authority_rows_page(
        &self,
        table: &str,
        pk: &str,
        cursor: Option<Self::Cursor>,
    ) -> Result<Page<Row, Self::Cursor>>;
    /// One fixed-vocabulary line to the Lambda log (stderr). See `Diagnostic`.
    fn diagnose(&self, diagnostic: Diagnostic) {
        eprintln!("{diagnostic}");
    }
    /// Called whenever the in-flight row payload (bytes held by all in-flight
    /// accounts) or the number of accounts in the large-account lane changes.
    /// Nothing is logged by default; tests assert the memory bound with it.
    fn observe_in_flight(&self, _bytes: usize, _large_accounts: usize) {}
}

/// Exact 32-byte identity of an `ACCOUNT#<64 lowercase hex>` key, for dedupe.
fn partition_id(pk: &str) -> Result<[u8; 32]> {
    let value = pk
        .strip_prefix("ACCOUNT#")
        .filter(|v| lower_hex(v, 64))
        .ok_or(Error::Integrity)?;
    let mut id = [0; 32];
    hex::decode_to_slice(value, &mut id).map_err(|_| Error::Integrity)?;
    Ok(id)
}

/// Keep the most serious stop reason: a malformed key (`Integrity`) must raise
/// `AuthorityIntegrityFailure` and is never downgraded; a transient read
/// failure (`Unavailable`, retried) outranks a bound (`Capacity`, not retried).
fn record_failure(failure: &mut Option<Error>, error: Error) {
    let rank = |e: Error| match e {
        Error::Integrity => 3,
        Error::Unavailable | Error::Configuration => 2,
        Error::Capacity => 1,
    };
    if failure.is_none_or(|f| rank(error) > rank(f)) {
        *failure = Some(error);
    }
}

async fn optional<F: std::future::Future + Unpin>(future: Option<&mut F>) -> F::Output {
    match future {
        Some(future) => future.await,
        None => std::future::pending().await,
    }
}

async fn sleep_until(at: Option<Instant>) {
    match at {
        Some(at) => tokio::time::sleep_until(at).await,
        None => std::future::pending().await,
    }
}

type Pending<'a, T> = std::pin::Pin<Box<dyn std::future::Future<Output = T> + Send + 'a>>;
type ScanPage<'a, C> = Pending<'a, Result<Page<String, C>>>;

/// What a per-account delivery failure does to the sweep.
#[derive(Clone, Copy)]
enum OnFailure {
    /// An alarm: the sweep finishes every account, then fails (#2042).
    Finish,
    /// The deprecated per-account datum: stop starting accounts, then fail
    /// (unchanged from the serial sweep, which returned immediately).
    Stop,
}

impl<B: AuthorityBackend> Monitor<B> {
    /// Full sweep with the default options (default concurrency, no deadline).
    pub async fn sweep_authority(&self, config: &Config) -> Result<()> {
        self.sweep_authority_with(config, &SweepOptions::default())
            .await
    }

    pub async fn sweep_authority_with(
        &self,
        config: &Config,
        options: &SweepOptions,
    ) -> Result<()> {
        let result = self.sweep_authority_inner(config, options).await;
        match result {
            Err(Error::Integrity) => {
                self.deliver(self.alarm(Metric::AuthorityIntegrityFailure))
                    .await?;
                Err(Error::Unavailable)
            }
            // Over capacity is permanent and already alarmed per account, and a
            // deadline stop would only recur (and overlap the next scheduled
            // run) on retry: report coverage failure and withhold the heartbeat,
            // but do not fail the invocation, so Lambda does not retry it.
            Err(Error::Capacity) => {
                self.deliver(self.alarm(Metric::AuthorityCoverageFailure))
                    .await
            }
            Err(error) => {
                self.deliver(self.alarm(Metric::AuthorityCoverageFailure))
                    .await?;
                Err(error)
            }
            Ok(()) => Ok(()),
        }
    }

    /// Sink failures (CloudWatch/SNS) still fail the invocation, but are logged
    /// with a fixed reason so they are distinguishable from read failures.
    async fn deliver(&self, sink: impl std::future::Future<Output = Result<()>>) -> Result<()> {
        sink.await
            .inspect_err(|_| self.backend.diagnose(Diagnostic::DeliveryFailed))
    }

    fn read_failed(&self, error: Error) -> Error {
        self.backend.diagnose(if error == Error::Integrity {
            Diagnostic::AccountReadMalformed
        } else {
            Diagnostic::AccountReadFailed
        });
        error
    }

    /// All of one account's rows, page by page, under the per-account budget.
    /// An account past `LARGE_ACCOUNT_BYTES` takes the single large-account
    /// lane before its next page and keeps it until its rows are dropped. The
    /// lane is the only thing an account waits for while holding rows, and the
    /// lane holder waits for nothing but its own reads, so this cannot deadlock.
    async fn read_rows<'a>(
        &'a self,
        config: &Config,
        pk: &str,
        shared: &'a Shared,
        held: &mut Held<'a, B>,
    ) -> Result<Vec<Row>> {
        let mut budget = AccountBudget::default();
        let mut rows = Vec::new();
        let mut cursor = None;
        for _ in 0..=MAX_ACCOUNT_ROWS {
            if held.lane.is_none() && held.bytes >= LARGE_ACCOUNT_BYTES {
                let permit = shared
                    .lane
                    .acquire()
                    .await
                    .map_err(|_| Error::Unavailable)?;
                held.take_lane(permit);
            }
            let page = self
                .backend
                .authority_rows_page(&config.table, pk, cursor)
                .await?;
            let mut bytes = 0;
            for row in &page.items {
                if row.pk != pk {
                    return Err(Error::Integrity);
                }
                // Exceeding the bound isolates this account (Capacity), it is
                // not a read failure of the whole sweep.
                budget.admit(row.payload.len())?;
                bytes += row.payload.len();
            }
            held.add(bytes);
            rows.extend(page.items);
            match page.next {
                None => return Ok(rows),
                next => cursor = next,
            }
        }
        Err(Error::Unavailable)
    }

    /// Strongly consistent history bracketed by identical account-row reads.
    /// A Query is NOT a snapshot; every legitimate write changes the account row,
    /// so a changed fence is retried (bounded), never treated as tampering.
    async fn read_account<'a>(
        &'a self,
        config: &Config,
        pk: &str,
        shared: &'a Shared,
    ) -> Result<AccountRead<'a, B>> {
        let mut held = Held::new(shared, &self.backend);
        for attempt in 0..FENCE_ATTEMPTS {
            if attempt > 0 {
                held.release_rows();
                tokio::time::sleep(FENCE_RETRY_DELAY).await;
            }
            let before = self
                .backend
                .authority_account(&config.table, pk)
                .await
                .map_err(|e| self.read_failed(e))?;
            let rows = match self.read_rows(config, pk, shared, &mut held).await {
                Err(Error::Capacity) => return Ok(AccountRead::OverCapacity),
                rows => rows.map_err(|e| self.read_failed(e))?,
            };
            let after = self
                .backend
                .authority_account(&config.table, pk)
                .await
                .map_err(|e| self.read_failed(e))?;
            if before == after {
                return Ok(AccountRead::Stable {
                    account: after,
                    rows,
                    held,
                });
            }
        }
        Ok(AccountRead::FenceUnstable)
    }

    /// Read and verify one account. Only reads happen here (the future may be
    /// dropped at the deadline); the driver delivers the resulting alarm.
    async fn check_account(&self, config: &Config, pk: String, shared: &Shared) -> Result<Checked> {
        let (after, rows, held) = match self.read_account(config, &pk, shared).await {
            Ok(AccountRead::Stable {
                account,
                rows,
                held,
            }) => (account, rows, held),
            Ok(AccountRead::OverCapacity) => return Ok(Checked::OverCapacity),
            Ok(AccountRead::FenceUnstable) => return Ok(Checked::FenceUnstable),
            // A malformed or foreign row is an integrity finding for this
            // account, not a reason to stop auditing every later account.
            Err(Error::Integrity) => return Ok(Checked::Integrity),
            Err(error) => return Err(error),
        };
        let verify = {
            let (tenant, generation, trust) = (
                self.tenant.clone(),
                config.generation.clone(),
                config.trust.clone(),
            );
            move || {
                let verdict = verify_account(&tenant, &generation, &pk, &rows, &trust);
                let current = rows
                    .iter()
                    .find(|r| r.sk == "ENROLLMENT")
                    .map(|r| &r.payload)
                    == after.as_ref();
                (verdict, current)
            }
        };
        // Small accounts verify inline (milliseconds). A lane account can take
        // seconds of CPU, so it runs off the async workers and the other
        // accounts' reads keep moving. Its rows are dropped on that thread
        // before `held` returns their bytes and the lane.
        let (verdict, current) = if held.lane.is_some() {
            tokio::task::spawn_blocking(verify)
                .await
                // Only a panic gets here (impossible with panic=abort in release).
                .map_err(|_| Error::Unavailable)?
        } else {
            verify()
        };
        drop(held);
        match verdict {
            Err(Error::Integrity) => Ok(Checked::Integrity),
            // Defence in depth: rows the per-page budget should have refused.
            Err(Error::Capacity) => Ok(Checked::OverCapacity),
            Err(error) => Err(error),
            Ok(_) if !current => Ok(Checked::Integrity),
            Ok(audit) => Ok(Checked::Verified {
                repeated: audit.repeated_pin_clear(shared.now),
            }),
        }
    }

    /// Streams partition keys from the Scan into at most `concurrency` account
    /// checks; the next Scan page is fetched while accounts are checked and at
    /// most `concurrency` + one page of keys is buffered. Account order is not
    /// semantic: accounts are independent and only aggregate counts are kept.
    /// Every alarm is delivered (never abandoned) before the final result.
    async fn sweep_authority_inner(&self, config: &Config, options: &SweepOptions) -> Result<()> {
        use futures_util::stream::{FuturesUnordered, StreamExt};
        let concurrency = options.concurrency.clamp(1, MAX_SWEEP_CONCURRENCY);
        let shared = Shared {
            bytes: AtomicUsize::new(0),
            large: AtomicUsize::new(0),
            lane: tokio::sync::Semaphore::new(1),
            now: now_ms(),
        };
        let stop_at = options
            .deadline
            .map(|d| d.checked_sub(DEADLINE_MARGIN).unwrap_or(d));
        let abandon_at = options
            .deadline
            .map(|d| d.checked_sub(DEADLINE_ABANDON).unwrap_or(d));
        let mut accounts = FuturesUnordered::new();
        let mut deliveries: FuturesUnordered<Pending<'_, (OnFailure, Result<()>)>> =
            FuturesUnordered::new();
        let mut scan: Option<ScanPage<'_, B::Cursor>> = None;
        let mut cursor = None;
        let mut scan_done = false;
        let mut pages = 0;
        let mut queued = VecDeque::new();
        // Exact keys, not hashes: Scan returns one key per row, and a
        // partition's rows may span pages.
        let mut seen = HashSet::<[u8; 32]>::new();
        // Accounts fully checked (verified, or an integrity finding raised).
        let mut verified = 0;
        let mut repeated_pin_clear_accounts: u64 = 0;
        // Accounts that could not be fully verified this sweep. Each is isolated:
        // every other partition is still verified, then the sweep reports
        // coverage failure instead of completion.
        let mut over_capacity = 0;
        let mut fence_unstable = 0;
        // A failed per-account alarm must not stop the remaining accounts from
        // being verified; the sweep still fails (no heartbeat) once it finishes.
        let mut delivery_failed = false;
        // Stop starting accounts; in-flight ones finish and alarms are delivered.
        let mut failure = None;
        let mut deadline_reached = false;
        loop {
            let now = Instant::now();
            if !deadline_reached && stop_at.is_some_and(|t| now >= t) {
                deadline_reached = true;
            }
            if abandon_at.is_some_and(|t| now >= t) {
                // Reads only: dropping them releases their bytes and the lane.
                accounts.clear();
            }
            if failure.is_some() || deadline_reached {
                // Dropping an in-flight Scan request is only a read.
                scan = None;
                queued.clear();
            } else {
                // Alarm deliveries in flight also hold back new accounts, so a
                // run with many findings paces CloudWatch/SNS like the serial
                // sweep did (at most ~2 x `concurrency` deliveries at once).
                while accounts.len() < concurrency
                    && deliveries.len() < concurrency
                    && let Some(pk) = queued.pop_front()
                {
                    accounts.push(self.check_account(config, pk, &shared));
                }
                if scan.is_none() && !scan_done && queued.len() < concurrency {
                    scan = Some(
                        self.backend
                            .authority_partition_page(&config.table, cursor.take()),
                    );
                }
            }
            if scan.is_none() && accounts.is_empty() && deliveries.is_empty() {
                break;
            }
            let wake = if deadline_reached {
                abandon_at.filter(|_| !accounts.is_empty())
            } else {
                stop_at
            };
            tokio::select! {
                biased;
                Some((on_failure, result)) = deliveries.next(), if !deliveries.is_empty() => {
                    if result.is_err() {
                        match on_failure {
                            OnFailure::Finish => delivery_failed = true,
                            OnFailure::Stop => record_failure(&mut failure, Error::Unavailable),
                        }
                    }
                }
                Some(outcome) = accounts.next(), if !accounts.is_empty() => {
                    let alarm = match outcome {
                        Ok(Checked::Verified { repeated }) => {
                            verified += 1;
                            if repeated {
                                repeated_pin_clear_accounts += 1;
                                // Deprecated per-account datum (no longer alarmed
                                // on), kept for one release so dashboards keep
                                // working during the switch to
                                // AuthorityRepeatedPinClearAccounts. Remove next release.
                                Some((
                                    OnFailure::Stop,
                                    Box::pin(self.deliver(
                                        self.backend.metric(Metric::AuthorityRepeatedPinClear),
                                    )) as Pending<'_, Result<()>>,
                                ))
                            } else {
                                None
                            }
                        }
                        Ok(Checked::Integrity) => {
                            verified += 1;
                            Some((
                                OnFailure::Finish,
                                Box::pin(self.deliver(self.alarm(Metric::AuthorityIntegrityFailure)))
                                    as Pending<'_, Result<()>>,
                            ))
                        }
                        Ok(Checked::OverCapacity) => {
                            over_capacity += 1;
                            self.backend.diagnose(Diagnostic::AccountOverCapacity);
                            Some((
                                OnFailure::Finish,
                                Box::pin(
                                    self.deliver(self.alarm(Metric::AuthorityAccountOverCapacity)),
                                ) as Pending<'_, Result<()>>,
                            ))
                        }
                        Ok(Checked::FenceUnstable) => {
                            fence_unstable += 1;
                            self.backend.diagnose(Diagnostic::FenceChangedAfterRetries);
                            None
                        }
                        Err(error) => {
                            record_failure(&mut failure, error);
                            None
                        }
                    };
                    if let Some((on_failure, delivery)) = alarm {
                        deliveries.push(Box::pin(async move { (on_failure, delivery.await) }));
                    }
                }
                page = optional(scan.as_mut()), if scan.is_some() => {
                    scan = None;
                    pages += 1;
                    match page {
                        Err(error) => {
                            self.backend.diagnose(match error {
                                Error::Capacity => Diagnostic::PartitionScanOverCapacity,
                                _ => Diagnostic::PartitionScanFailed,
                            });
                            record_failure(&mut failure, error);
                        }
                        Ok(page) => {
                            for pk in page.items {
                                let Ok(id) = partition_id(&pk) else {
                                    self.backend.diagnose(Diagnostic::PartitionScanFailed);
                                    record_failure(&mut failure, Error::Integrity);
                                    break;
                                };
                                if seen.insert(id) {
                                    if seen.len() > options.max_partitions {
                                        self.backend.diagnose(Diagnostic::PartitionScanOverCapacity);
                                        record_failure(&mut failure, Error::Capacity);
                                        break;
                                    }
                                    queued.push_back(pk);
                                }
                            }
                            match page.next {
                                None => scan_done = true,
                                Some(_) if pages >= options.max_scan_pages => {
                                    self.backend.diagnose(Diagnostic::PartitionScanOverCapacity);
                                    record_failure(&mut failure, Error::Capacity);
                                }
                                next => cursor = next,
                            }
                        }
                    }
                }
                () = sleep_until(wake), if wake.is_some() => {}
            }
        }
        let partitions = seen.len();
        if deadline_reached {
            self.backend.diagnose(Diagnostic::DeadlineReached {
                partitions,
                verified,
            });
        }
        if over_capacity > 0 || fence_unstable > 0 {
            // Logged whatever ends the sweep, so the skipped-account counts are
            // also visible on deadline and read-failure runs.
            self.backend.diagnose(Diagnostic::Incomplete {
                partitions,
                over_capacity,
                fence_unstable,
            });
        }
        if delivery_failed && failure.is_none_or(|f| f == Error::Capacity) {
            // Already logged as DeliveryFailed; no heartbeat, and retry the run.
            // A Scan sanity bound (`Capacity`, not retried) can now be hit after
            // accounts were already checked while the Scan streamed: it must not
            // turn a lost per-account alarm into a run Lambda never retries.
            return Err(Error::Unavailable);
        }
        if let Some(error) = failure {
            // Already logged with its fixed reason. Integrity and read failures
            // are retried (or alarmed) regardless of `delivery_failed`.
            return Err(error);
        }
        if deadline_reached {
            // Coverage is incomplete for a bound reason; see `sweep_authority_with`.
            return Err(Error::Capacity);
        }
        if over_capacity > 0 || fence_unstable > 0 {
            // Coverage is incomplete: no completion heartbeat and no gauge (a
            // partial count, or a misleading 0, is never reported).
            return Err(if fence_unstable > 0 {
                Error::Unavailable
            } else {
                Error::Capacity
            });
        }
        // Metric only (no SNS): the CloudWatch alarm compares this account count
        // with an operator threshold, so a new account is visible while a known
        // one is still inside its window. Emitted (including 0) only after every
        // partition was fully verified, immediately before the completion heartbeat.
        self.deliver(self.backend.gauge(
            Metric::AuthorityRepeatedPinClearAccounts,
            repeated_pin_clear_accounts,
        ))
        .await?;
        self.deliver(self.backend.metric(Metric::AuthoritySweepCompleted))
            .await?;
        self.backend.diagnose(Diagnostic::Completed { partitions });
        Ok(())
    }
}

/// Reconstruct visible history independently, then correlate all committed rows.
/// Snapshot RPCs are not persisted in this table and are never commit evidence.
pub fn verify_account(
    tenant: &str,
    generation: &str,
    pk: &str,
    rows: &[Row],
    trust: &AuthorityTrust,
) -> Result<AccountAudit> {
    let mut budget = AccountBudget::default();
    for row in rows {
        budget.admit(row.payload.len())?;
    }
    check(
        !rows.is_empty()
            && rows
                .iter()
                .all(|r| r.pk == pk && !r.payload.is_empty() && r.payload.len() <= MAX_ITEM_BYTES),
    )?;
    check(rows.iter().map(|r| &r.sk).collect::<BTreeSet<_>>().len() == rows.len())?;
    let account = rows
        .iter()
        .find(|r| r.sk == "ENROLLMENT")
        .ok_or(Error::Integrity)?;
    let parsed: StoredItem =
        serde_json::from_slice(&account.payload).map_err(|_| Error::Integrity)?;
    let binding = Binding {
        tenant: tenant.into(),
        generation: generation.into(),
        did_hash: parsed.binding.did_hash,
    };
    check(binding.partition_key().map_err(|_| Error::Integrity)? == pk)?;
    let ItemValue::Enrollment(current) =
        StoredItem::decode(&account.payload, &binding, "ENROLLMENT")
            .map_err(|_| Error::Integrity)?
            .value
    else {
        return Err(Error::Integrity);
    };
    let mut executions = BTreeMap::new();
    let mut items = Vec::new();
    for row in rows {
        if row.sk == "ENROLLMENT" {
            continue;
        }
        if row.sk.starts_with("EXECUTION#") {
            let execution: ExecutionRecord =
                serde_json::from_slice(&row.payload).map_err(|_| Error::Integrity)?;
            check(
                row.sk == format!("EXECUTION#{}", hex::encode(execution.receipt.execution_id))
                    && execution.receipt.schema_version == 1
                    && execution.receipt.binding == binding
                    && !execution.proposed_event.is_empty()
                    && execution.proposed_event.len() <= MAX_EVENT_BYTES,
            )?;
            let record: SignedAuthorityRecord =
                serde_json::from_slice(&execution.proposed_event).map_err(|_| Error::Integrity)?;
            let event: AuthorityEvent =
                serde_json::from_slice(&trust.verify_artifact(&record, RecordKind::Proposal)?)
                    .map_err(|_| Error::Integrity)?;
            check(
                event.binding == binding
                    && event.revisions == execution.receipt.revisions
                    && event.revisions.operation.get() > 0
                    && event.revisions.operation.get() <= current.revisions.operation.get(),
            )?;
            let revision = event.revisions.operation.get();
            check(executions.insert(revision, (execution, event)).is_none())?;
        } else {
            items.push(
                StoredItem::decode(&row.payload, &binding, &row.sk)
                    .map_err(|_| Error::Integrity)?
                    .value,
            );
        }
    }
    check(executions.len() as u64 == current.revisions.operation.get())?;
    let mut previous: Option<&AuthorityEvent> = None;
    let mut latest_requests = BTreeMap::new();
    let mut holds: BTreeMap<&str, HoldTrack> = BTreeMap::new();
    let mut intent_digest = None;
    let mut audit = AccountAudit::default();
    for (offset, (execution, event)) in executions.values().enumerate() {
        check(event.revisions.operation.get() == offset as u64 + 1)?;
        transition(previous, event)?;
        // transition() only lets an owner Enroll/Replace change the PIN generation.
        if event.previous_pin.is_some_and(|pin| pin.configured) && !event.pin.configured {
            audit.pin_clears_hi_ms.push(event.time.interval.hi_ms);
        }
        if matches!(
            event.kind,
            Kind::Enroll | Kind::Replace | Kind::Carry | Kind::Disable
        ) {
            intent_digest = Some(event.request_digest);
        }
        if let Some((_, prior)) =
            latest_requests.insert(event.request_id.as_str(), (execution, event))
        {
            check(
                prior.kind == Kind::PinAttempt
                    && prior.outcome == Outcome::Reserved
                    && event.kind == Kind::PinAttempt
                    && matches!(event.outcome, Outcome::Compared { .. })
                    && prior.request_digest == event.request_digest
                    && prior.revisions.enrollment == event.revisions.enrollment
                    && prior.hold_id == event.hold_id,
            )?;
        } else {
            check(!matches!(event.outcome, Outcome::Compared { .. }))?;
        }
        if let Some(id) = event.hold_id.as_deref() {
            if event.kind == Kind::CreateHold {
                check(
                    holds
                        .insert(
                            id,
                            HoldTrack {
                                created: event,
                                last: event,
                                confirmed_hi_ms: None,
                                warned_hi_ms: None,
                            },
                        )
                        .is_none(),
                )?;
            } else {
                let track = holds.get_mut(id).ok_or(Error::Integrity)?;
                // P9.1 (attack C): ConfirmHold/ResendCode require the hold to
                // still be awaiting confirmation; Cancel accepts either
                // non-terminal status (matching authority_cancel); every
                // other kind (SendReleaseWarning, Release, PinAttempt)
                // requires the hold to already be confirmed (Pending).
                let allowed_prior: &[HoldStatus] = match event.kind {
                    Kind::ConfirmHold | Kind::ResendCode => &[HoldStatus::AwaitingConfirmation],
                    Kind::Cancel => &[HoldStatus::AwaitingConfirmation, HoldStatus::Pending],
                    _ => &[HoldStatus::Pending],
                };
                check(
                    track
                        .last
                        .hold_status
                        .is_some_and(|status| allowed_prior.contains(&status)),
                )?;
                if event.kind != Kind::Cancel {
                    check(track.created.revisions.enrollment == event.revisions.enrollment)?;
                }
                if event.kind == Kind::ConfirmHold && event.hold_status == Some(HoldStatus::Pending)
                {
                    check(track.confirmed_hi_ms.is_none())?;
                    track.confirmed_hi_ms = Some(event.time.interval.hi_ms);
                }
                if event.kind == Kind::SendReleaseWarning {
                    track.warned_hi_ms.get_or_insert(event.time.interval.hi_ms);
                }
                // P9.1 (attack C): the independent release gate. A hold that
                // started AwaitingConfirmation must show a matched ConfirmHold
                // and a SendReleaseWarning at least 24h before this release's
                // own trusted-time lower bound, mirroring (and independently
                // re-checking, not trusting) the enclave's own release policy.
                if track.created.hold_status == Some(HoldStatus::AwaitingConfirmation)
                    && (event.kind == Kind::Release
                        || (event.kind == Kind::PinAttempt
                            && event.hold_status == Some(HoldStatus::Released)))
                {
                    check(
                        track.confirmed_hi_ms.is_some()
                            && track.warned_hi_ms.is_some_and(|warned| {
                                event.time.interval.lo_ms
                                    >= warned.saturating_add(RELEASE_WARNING_MIN_GAP_MS)
                            }),
                    )?;
                }
                track.last = event;
            }
        }
        previous = Some(event);
    }
    let last = previous.ok_or(Error::Integrity)?;
    check(
        last.revisions == current.revisions
            && last.epoch == current.epoch
            && last.pin == current.pin
            && intent_digest == Some(current.intent_digest),
    )?;
    match &current.enrollment {
        EnrollmentStatus::Disabled => check(
            last.target_identity.is_none()
                && last.share_version.is_none()
                && !last.rewrap_delegated,
        )?,
        EnrollmentStatus::Active { blob } => check(
            last.target_identity == Some(blob.identity)
                && last.share_version == Some(blob.share_version)
                && last.rewrap_delegated == blob.rewrap_delegated,
        )?,
    }
    for item in items {
        match item {
            ItemValue::Operation(op) => {
                let (execution, event) = latest_requests
                    .remove(op.request_id.as_str())
                    .ok_or(Error::Integrity)?;
                check(
                    op.execution_id == execution.receipt.execution_id
                        && op.revisions == event.revisions
                        && op.kind == event.kind
                        && op.outcome == event.outcome
                        && op.request_digest == event.request_digest
                        && op.proposed_event == execution.proposed_event,
                )?;
            }
            ItemValue::Hold(hold) => {
                let track = holds
                    .remove(hold.hold_id.as_str())
                    .ok_or(Error::Integrity)?;
                check(
                    hold.created_revision == track.created.revisions.operation
                        && hold.updated_revision == track.last.revisions.operation
                        && Some(hold.status) == track.last.hold_status
                        && hold.enrollment_version == track.created.revisions.enrollment
                        && hold.epoch == track.created.epoch
                        && Some(hold.blob_identity) == track.created.target_identity
                        && hold.signed_hold_digest == track.created.request_digest,
                )?;
            }
            ItemValue::Enrollment(_) => return Err(Error::Integrity),
        }
    }
    check(latest_requests.is_empty() && holds.is_empty())?;
    Ok(audit)
}

fn transition(old: Option<&AuthorityEvent>, new: &AuthorityEvent) -> Result<()> {
    check(
        new.revisions.enrollment.get() > 0
            && new.revisions.enrollment.get() <= new.revisions.operation.get()
            && new.epoch.get() > 0
            && new.epoch.get() <= new.revisions.enrollment.get()
            && new.pin.generation.get() <= new.revisions.enrollment.get()
            && new.pin.attempts_used <= PIN_BUDGET
            && (new.pin.configured || new.pin.attempts_used == 0)
            && (!new.pin.configured || new.pin.generation.get() > 0)
            && new.time.interval.lo_ms <= new.time.interval.hi_ms
            && new.time.interval.hi_ms <= MAX_COUNTER
            && new.target_identity.is_some() == new.share_version.is_some()
            && new.share_version != Some(0),
    )?;
    let owner_change = matches!(
        new.kind,
        Kind::Enroll | Kind::Replace | Kind::Carry | Kind::Disable
    );
    let enrollment_change = owner_change || new.kind == Kind::Rewrap;
    if let Some(old) = old {
        check(
            new.previous_revisions == Some(old.revisions)
                && new.previous_pin == Some(old.pin)
                && new.source_identity == old.target_identity
                && new.revisions.enrollment.get()
                    == old.revisions.enrollment.get() + u64::from(enrollment_change)
                && new.epoch.get()
                    == old.epoch.get()
                        + u64::from(matches!(
                            new.kind,
                            Kind::Enroll | Kind::Replace | Kind::Carry
                        )),
        )?;
        if new.pin.generation == old.pin.generation {
            check(new.pin.configured == old.pin.configured)?;
            let increment =
                u8::from(new.kind == Kind::PinAttempt && new.outcome == Outcome::Reserved);
            check(
                new.pin.attempts_used
                    == old
                        .pin
                        .attempts_used
                        .checked_add(increment)
                        .ok_or(Error::Integrity)?,
            )?;
        } else {
            check(
                owner_change
                    && new.kind != Kind::Disable
                    && new.pin.generation.get() == old.pin.generation.get() + 1
                    && new.pin.attempts_used == 0,
            )?;
        }
        if matches!(new.kind, Kind::Carry | Kind::Rewrap | Kind::Disable) {
            check(new.pin == old.pin)?;
        }
        if !enrollment_change {
            check(
                new.target_identity == old.target_identity
                    && new.share_version == old.share_version
                    && new.rewrap_delegated == old.rewrap_delegated,
            )?;
        }
        match new.kind {
            Kind::Enroll => check(old.target_identity.is_none() && new.target_identity.is_some())?,
            Kind::Replace => check(
                old.target_identity.is_some()
                    && new.target_identity.is_some()
                    && new.target_identity != old.target_identity
                    && new.share_version >= old.share_version,
            )?,
            Kind::Carry => check(
                old.pin.configured
                    && old.target_identity.is_some()
                    && new.target_identity.is_some()
                    && new.target_identity != old.target_identity
                    && new.share_version > old.share_version,
            )?,
            Kind::Rewrap => check(
                old.rewrap_delegated
                    && new.rewrap_delegated
                    && old.target_identity.is_some()
                    && new.target_identity.is_some()
                    && new.target_identity != old.target_identity
                    && new.share_version == old.share_version,
            )?,
            Kind::Disable => check(
                old.target_identity.is_some()
                    && new.target_identity.is_none()
                    && !new.rewrap_delegated,
            )?,
            Kind::Cancel => {} // Obsolete holds can be cancelled after rotation/disable.
            _ => check(new.target_identity.is_some())?,
        }
    } else {
        check(
            new.kind == Kind::Enroll
                && new.previous_revisions.is_none()
                && new.previous_pin.is_none()
                && new.source_identity.is_none()
                && new.revisions.enrollment.get() == 1
                && new.epoch.get() == 1
                && new.target_identity.is_some()
                && new.pin.attempts_used == 0
                && new.pin.generation.get() == u64::from(new.pin.configured),
        )?;
    }
    match (new.kind, new.outcome) {
        (Kind::PinAttempt, Outcome::Reserved | Outcome::Compared { .. }) => {
            check(new.pin.configured)?
        }
        (Kind::PinAttempt, _) => return Err(Error::Integrity),
        (_, Outcome::Committed) => {}
        _ => return Err(Error::Integrity),
    }
    match new.kind {
        // P9.1 (attack C): a Hold-policy create always starts AwaitingConfirmation
        // (the enclave fails the whole request closed rather than falling back to
        // Pending when a blob/sender is missing); Pin-policy starts Pending.
        Kind::CreateHold => check(
            new.hold_id.is_some()
                && matches!(
                    new.hold_status,
                    Some(HoldStatus::Pending) | Some(HoldStatus::AwaitingConfirmation)
                ),
        )?,
        Kind::Release => {
            check(new.hold_id.is_some() && new.hold_status == Some(HoldStatus::Released))?
        }
        Kind::Cancel => {
            check(new.hold_id.is_some() && new.hold_status == Some(HoldStatus::Cancelled))?
        }
        Kind::PinAttempt => check(
            new.hold_id.is_some()
                && new.hold_status
                    == Some(if new.outcome == (Outcome::Compared { matched: true }) {
                        HoldStatus::Released
                    } else {
                        HoldStatus::Pending
                    }),
        )?,
        // P9.1 (attack C): committed regardless of guess match (a mismatch never
        // transitions status); the matching guess moves AwaitingConfirmation ->
        // Pending, so both resulting statuses are valid for this kind alone.
        Kind::ConfirmHold => check(
            new.hold_id.is_some()
                && matches!(
                    new.hold_status,
                    Some(HoldStatus::AwaitingConfirmation) | Some(HoldStatus::Pending)
                ),
        )?,
        // P9.1 (attack C): system-initiated, never transitions status (requires
        // Pending on entry and leaves it Pending — see authority_send_release_warning).
        Kind::SendReleaseWarning => {
            check(new.hold_id.is_some() && new.hold_status == Some(HoldStatus::Pending))?
        }
        // P9.1 (attack C): only valid pre-confirmation; never transitions status.
        Kind::ResendCode => check(
            new.hold_id.is_some() && new.hold_status == Some(HoldStatus::AwaitingConfirmation),
        )?,
        _ => check(new.hold_id.is_none() && new.hold_status.is_none())?,
    }
    Ok(())
}
fn check(ok: bool) -> Result<()> {
    if ok { Ok(()) } else { Err(Error::Integrity) }
}
fn lower_hex(value: &str, length: usize) -> bool {
    value.len() == length
        && value
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

#[cfg(test)]
mod tests;
