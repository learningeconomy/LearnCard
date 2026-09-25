//! Fixed-schema CBOR; no generic recursive decoder or attacker-controlled allocation.
use super::*;
use crate::time::{SourceEvidence, TrustedInterval};

pub(super) fn identifier(value: &str) -> Result<(), LedgerError> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
    {
        return Err(LedgerError::Encoding);
    }
    Ok(())
}

fn validate(record: &LedgerRecord) -> Result<(), LedgerError> {
    for id in [
        &record.tenant,
        &record.hold_id,
        &record.request_id,
        &record.key_id,
    ] {
        identifier(id)?;
    }
    let time = &record.time_evidence;
    if record.version != 1
        || record.policy_version != 1
        || record.seq >= MAX_CHAIN_RECORDS as u64
        || time.interval.lo_ms > time.interval.hi_ms
        || !(2..=16).contains(&time.sources.len())
    {
        return Err(LedgerError::Encoding);
    }
    let mut previous: Option<&str> = None;
    for source in &time.sources {
        identifier(&source.server_id)?;
        if previous.is_some_and(|p| p >= source.server_id.as_str()) {
            return Err(LedgerError::Encoding);
        }
        previous = Some(&source.server_id);
    }
    if let Event::PinAttemptReserved { attempt_no } = record.event {
        if !(1..=PIN_BUDGET).contains(&attempt_no) {
            return Err(LedgerError::Encoding);
        }
    }
    Ok(())
}

fn argument(out: &mut Vec<u8>, major: u8, value: u64) {
    let prefix = major << 5;
    match value {
        0..=23 => out.push(prefix | value as u8),
        24..=255 => out.extend_from_slice(&[prefix | 24, value as u8]),
        256..=65535 => {
            out.push(prefix | 25);
            out.extend_from_slice(&(value as u16).to_be_bytes());
        }
        65536..=4294967295 => {
            out.push(prefix | 26);
            out.extend_from_slice(&(value as u32).to_be_bytes());
        }
        _ => {
            out.push(prefix | 27);
            out.extend_from_slice(&value.to_be_bytes());
        }
    }
}

fn uint(out: &mut Vec<u8>, value: u64) {
    argument(out, 0, value);
}
fn bytes(out: &mut Vec<u8>, value: &[u8]) {
    argument(out, 2, value.len() as u64);
    out.extend_from_slice(value);
}
fn text(out: &mut Vec<u8>, value: &str) {
    argument(out, 3, value.len() as u64);
    out.extend_from_slice(value.as_bytes());
}
fn array(out: &mut Vec<u8>, len: usize) {
    argument(out, 4, len as u64);
}

pub(super) fn encode(r: &LedgerRecord, signed: bool) -> Result<Vec<u8>, LedgerError> {
    validate(r)?;
    let mut out = Vec::new();
    argument(&mut out, 5, if signed { 16 } else { 15 });
    uint(&mut out, 0);
    uint(&mut out, r.version);
    uint(&mut out, 1);
    text(&mut out, &r.tenant);
    uint(&mut out, 2);
    text(&mut out, &r.hold_id);
    uint(&mut out, 3);
    uint(&mut out, r.enrollment_epoch);
    uint(&mut out, 4);
    bytes(&mut out, &r.blob_hash);
    uint(&mut out, 5);
    uint(&mut out, r.seq);
    uint(&mut out, 6);
    bytes(&mut out, &r.prev_hash);
    uint(&mut out, 7);
    let (event, attempt) = match r.event {
        Event::HoldCreated => (0, None),
        Event::PinAttemptReserved { attempt_no } => (1, Some(attempt_no)),
        Event::PinAttemptFailed => (2, None),
        Event::PinAttemptSucceeded => (3, None),
        Event::Released => (4, None),
        Event::Cancelled => (5, None),
        Event::PinLocked => (6, None),
    };
    array(&mut out, if attempt.is_some() { 2 } else { 1 });
    uint(&mut out, event);
    if let Some(attempt) = attempt {
        uint(&mut out, attempt as u64);
    }
    uint(&mut out, 8);
    text(&mut out, &r.request_id);
    uint(&mut out, 9);
    bytes(&mut out, &r.measurement);
    uint(&mut out, 10);
    text(&mut out, &r.key_id);
    uint(&mut out, 11);
    array(&mut out, 3);
    uint(&mut out, r.time_evidence.interval.lo_ms);
    uint(&mut out, r.time_evidence.interval.hi_ms);
    array(&mut out, r.time_evidence.sources.len());
    for source in &r.time_evidence.sources {
        array(&mut out, 4);
        text(&mut out, &source.server_id);
        uint(&mut out, source.midpoint_ms);
        uint(&mut out, source.radius_ms);
        bytes(&mut out, &source.response_hash);
    }
    uint(&mut out, 12);
    bytes(&mut out, &r.payload_hash);
    uint(&mut out, 13);
    uint(&mut out, r.policy_version);
    uint(&mut out, 14);
    bytes(&mut out, &r.enrollment_id);
    if signed {
        uint(&mut out, 15);
        bytes(&mut out, &r.sig);
    }
    if out.len() > MAX_RECORD_BYTES {
        return Err(LedgerError::Encoding);
    }
    Ok(out)
}

struct Reader<'a>(&'a [u8]);

impl<'a> Reader<'a> {
    fn take(&mut self, len: usize) -> Result<&'a [u8], LedgerError> {
        if len > self.0.len() {
            return Err(LedgerError::Encoding);
        }
        let (value, rest) = self.0.split_at(len);
        self.0 = rest;
        Ok(value)
    }

    fn argument(&mut self, major: u8) -> Result<u64, LedgerError> {
        let first = self.take(1)?[0];
        if first >> 5 != major {
            return Err(LedgerError::Encoding);
        }
        let (len, minimum) = match first & 31 {
            value @ 0..=23 => return Ok(value as u64),
            24 => (1, 24),
            25 => (2, 256),
            26 => (4, 65536),
            27 => (8, 4294967296),
            _ => return Err(LedgerError::Encoding),
        };
        let mut value = 0u64;
        for byte in self.take(len)? {
            value = (value << 8) | u64::from(*byte);
        }
        if value < minimum {
            return Err(LedgerError::Encoding);
        }
        Ok(value)
    }

    fn exact(&mut self, major: u8, expected: u64) -> Result<(), LedgerError> {
        if self.argument(major)? != expected {
            return Err(LedgerError::Encoding);
        }
        Ok(())
    }

    fn uint(&mut self) -> Result<u64, LedgerError> {
        self.argument(0)
    }
    fn key(&mut self, key: u64) -> Result<(), LedgerError> {
        self.exact(0, key)
    }
    fn array(&mut self, len: u64) -> Result<(), LedgerError> {
        self.exact(4, len)
    }

    fn bytes<const N: usize>(&mut self) -> Result<[u8; N], LedgerError> {
        self.exact(2, N as u64)?;
        self.take(N)?.try_into().map_err(|_| LedgerError::Encoding)
    }

    fn text(&mut self) -> Result<String, LedgerError> {
        let len = self.argument(3)?;
        if !(1..=128).contains(&len) {
            return Err(LedgerError::Encoding);
        }
        let value =
            std::str::from_utf8(self.take(len as usize)?).map_err(|_| LedgerError::Encoding)?;
        identifier(value)?;
        Ok(value.to_owned())
    }
}

pub(super) fn decode(bytes: &[u8]) -> Result<LedgerRecord, LedgerError> {
    if bytes.len() > MAX_RECORD_BYTES {
        return Err(LedgerError::Encoding);
    }
    let mut r = Reader(bytes);
    r.exact(5, 16)?;
    r.key(0)?;
    let version = r.uint()?;
    r.key(1)?;
    let tenant = r.text()?;
    r.key(2)?;
    let hold_id = r.text()?;
    r.key(3)?;
    let enrollment_epoch = r.uint()?;
    r.key(4)?;
    let blob_hash = r.bytes()?;
    r.key(5)?;
    let seq = r.uint()?;
    r.key(6)?;
    let prev_hash = r.bytes()?;
    r.key(7)?;
    let event_len = r.argument(4)?;
    let event = match (r.uint()?, event_len) {
        (0, 1) => Event::HoldCreated,
        (1, 2) => Event::PinAttemptReserved {
            attempt_no: r.uint()?.try_into().map_err(|_| LedgerError::Encoding)?,
        },
        (2, 1) => Event::PinAttemptFailed,
        (3, 1) => Event::PinAttemptSucceeded,
        (4, 1) => Event::Released,
        (5, 1) => Event::Cancelled,
        (6, 1) => Event::PinLocked,
        _ => return Err(LedgerError::Encoding),
    };
    r.key(8)?;
    let request_id = r.text()?;
    r.key(9)?;
    let measurement = r.bytes()?;
    r.key(10)?;
    let key_id = r.text()?;
    r.key(11)?;
    r.array(3)?;
    let interval = TrustedInterval {
        lo_ms: r.uint()?,
        hi_ms: r.uint()?,
    };
    let count = r.argument(4)?;
    if !(2..=16).contains(&count) {
        return Err(LedgerError::Encoding);
    }
    let mut sources = Vec::new();
    for _ in 0..count {
        r.array(4)?;
        sources.push(SourceEvidence {
            server_id: r.text()?,
            midpoint_ms: r.uint()?,
            radius_ms: r.uint()?,
            response_hash: r.bytes()?,
        });
    }
    r.key(12)?;
    let payload_hash = r.bytes()?;
    r.key(13)?;
    let policy_version = r.uint()?;
    r.key(14)?;
    let enrollment_id = r.bytes()?;
    r.key(15)?;
    let sig = r.bytes()?;
    if !r.0.is_empty() {
        return Err(LedgerError::Encoding);
    }
    let record = LedgerRecord {
        version,
        tenant,
        enrollment_id,
        hold_id,
        enrollment_epoch,
        blob_hash,
        seq,
        prev_hash,
        event,
        request_id,
        measurement,
        key_id,
        time_evidence: TimeEvidence { interval, sources },
        payload_hash,
        policy_version,
        sig,
    };
    validate(&record)?;
    Ok(record)
}
