//! Bounded, pure parser for Google legacy and Cloudflare draft-08 wire formats.
//! Reference: https://github.com/cloudflare/roughtime/blob/master/protocol/protocol.go
use super::{PinnedServer, Protocol, SourceEvidence, TimeError, TrustedInterval};
use ed25519_dalek::{Signature, VerifyingKey};
use sha2::{Digest, Sha256, Sha512};
use std::collections::BTreeMap;

pub(super) const DELEGATION_CONTEXT: &[u8] = b"RoughTime v1 delegation signature--\0";
pub(super) const RESPONSE_CONTEXT: &[u8] = b"RoughTime v1 response signature\0";
const MAX_MESSAGE: usize = 1024;
const MAX_TAGS: usize = 32;

impl Protocol {
    pub(super) fn nonce_size(self) -> usize {
        match self {
            Self::GoogleLegacy => 64,
            Self::IetfDraft08 => 32,
        }
    }
}

pub(super) fn u32le(bytes: &[u8]) -> Result<u32, TimeError> {
    Ok(u32::from_le_bytes(
        bytes.try_into().map_err(|_| TimeError::Encoding)?,
    ))
}
fn u64le(bytes: &[u8]) -> Result<u64, TimeError> {
    Ok(u64::from_le_bytes(
        bytes.try_into().map_err(|_| TimeError::Encoding)?,
    ))
}

pub(super) struct Message<'a>(pub(super) BTreeMap<[u8; 4], &'a [u8]>);
impl<'a> Message<'a> {
    pub(super) fn parse(bytes: &'a [u8]) -> Result<Self, TimeError> {
        if bytes.len() < 8 || bytes.len() > MAX_MESSAGE || !bytes.len().is_multiple_of(4) {
            return Err(TimeError::Encoding);
        }
        let n = u32le(&bytes[..4])? as usize;
        if n == 0 || n > MAX_TAGS || n * 8 > bytes.len() {
            return Err(TimeError::Encoding);
        }
        let values = &bytes[n * 8..];
        let mut entries = BTreeMap::new();
        let mut previous_tag = None;
        let mut start = 0;
        for i in 0..n {
            let tag_bytes = &bytes[n * 4 + i * 4..n * 4 + i * 4 + 4];
            let tag = u32le(tag_bytes)?;
            let end = if i + 1 == n {
                values.len()
            } else {
                u32le(&bytes[4 + i * 4..8 + i * 4])? as usize
            };
            if previous_tag.is_some_and(|last| tag <= last)
                || end < start
                || end > values.len()
                || !end.is_multiple_of(4)
            {
                return Err(TimeError::Encoding);
            }
            entries.insert(tag.to_le_bytes(), &values[start..end]);
            start = end;
            previous_tag = Some(tag);
        }
        Ok(Self(entries))
    }
    pub(super) fn get(&self, tag: &[u8; 4]) -> Result<&'a [u8], TimeError> {
        self.0.get(tag).copied().ok_or(TimeError::Encoding)
    }
}

pub(super) fn encode(mut entries: Vec<([u8; 4], Vec<u8>)>) -> Result<Vec<u8>, TimeError> {
    entries.sort_by_key(|(tag, _)| u32::from_le_bytes(*tag));
    let n = entries.len();
    let size = n * 8 + entries.iter().map(|(_, value)| value.len()).sum::<usize>();
    if n == 0
        || n > MAX_TAGS
        || size > MAX_MESSAGE
        || entries.iter().any(|(_, v)| !v.len().is_multiple_of(4))
        || entries.windows(2).any(|e| e[0].0 == e[1].0)
    {
        return Err(TimeError::Encoding);
    }
    let mut bytes = Vec::with_capacity(size);
    bytes.extend_from_slice(&(n as u32).to_le_bytes());
    let mut offset = 0u32;
    for (_, value) in entries.iter().take(n - 1) {
        offset += value.len() as u32;
        bytes.extend_from_slice(&offset.to_le_bytes());
    }
    for (tag, _) in &entries {
        bytes.extend_from_slice(tag);
    }
    for (_, value) in entries {
        bytes.extend(value);
    }
    Ok(bytes)
}

pub(super) fn frame(protocol: Protocol, message: Vec<u8>) -> Vec<u8> {
    if protocol == Protocol::GoogleLegacy {
        return message;
    }
    let mut bytes = b"ROUGHTIM".to_vec();
    bytes.extend_from_slice(&(message.len() as u32).to_le_bytes());
    bytes.extend(message);
    bytes
}

pub(super) fn unframe(protocol: Protocol, packet: &[u8]) -> Result<&[u8], TimeError> {
    if packet.len() > MAX_MESSAGE {
        return Err(TimeError::Encoding);
    }
    if protocol == Protocol::GoogleLegacy {
        return Ok(packet);
    }
    if packet.len() < 12
        || &packet[..8] != b"ROUGHTIM"
        || u32le(&packet[8..12])? as usize != packet.len() - 12
    {
        return Err(TimeError::Encoding);
    }
    Ok(&packet[12..])
}

pub(super) fn request(protocol: Protocol, nonce: &[u8]) -> Result<Vec<u8>, TimeError> {
    if nonce.len() != protocol.nonce_size() {
        return Err(TimeError::Nonce);
    }
    let mut tags = vec![(*b"NONC", nonce.to_vec())];
    let (padding_tag, framing) = match protocol {
        Protocol::GoogleLegacy => (*b"PAD\xff", 0),
        Protocol::IetfDraft08 => {
            tags.push((*b"VER\0", 0x8000_0008u32.to_le_bytes().to_vec()));
            (*b"ZZZZ", 12)
        }
    };
    let padding = MAX_MESSAGE
        - framing
        - (tags.len() + 1) * 8
        - tags.iter().map(|(_, v)| v.len()).sum::<usize>();
    tags.push((padding_tag, vec![0; padding]));
    Ok(frame(protocol, encode(tags)?))
}

fn signature(key: &[u8], context: &[u8], body: &[u8], signature: &[u8]) -> Result<(), ()> {
    let key = VerifyingKey::from_bytes(&key.try_into().map_err(|_| ())?).map_err(|_| ())?;
    let signature = Signature::from_slice(signature).map_err(|_| ())?;
    let mut signed = context.to_vec();
    signed.extend_from_slice(body);
    key.verify_strict(&signed, &signature).map_err(|_| ())
}

pub(super) fn hash(prefix: u8, parts: &[&[u8]], size: usize) -> Vec<u8> {
    let mut hash = Sha512::new();
    hash.update([prefix]);
    for part in parts {
        hash.update(part);
    }
    hash.finalize()[..size].to_vec()
}

pub(super) fn verify(
    server: &PinnedServer,
    nonce: &[u8],
    response: &[u8],
    max_radius_ms: u64,
) -> Result<(SourceEvidence, TrustedInterval), TimeError> {
    let protocol = server.protocol;
    let size = protocol.nonce_size();
    if nonce.len() != size {
        return Err(TimeError::Nonce);
    }
    let reply = Message::parse(unframe(protocol, response)?)?;
    if protocol == Protocol::IetfDraft08 {
        if u32le(reply.get(b"VER\0")?)? != 0x8000_0008 {
            return Err(TimeError::Encoding);
        }
        if reply.get(b"NONC")? != nonce {
            return Err(TimeError::Nonce);
        }
    }
    let cert = Message::parse(reply.get(b"CERT")?)?;
    let delegation = cert.get(b"DELE")?;
    signature(
        &server.public_key,
        DELEGATION_CONTEXT,
        delegation,
        cert.get(b"SIG\0")?,
    )
    .map_err(|_| TimeError::DelegationSignature)?;
    let delegation = Message::parse(delegation)?;
    let signed = reply.get(b"SREP")?;
    signature(
        delegation.get(b"PUBK")?,
        RESPONSE_CONTEXT,
        signed,
        reply.get(b"SIG\0")?,
    )
    .map_err(|_| TimeError::ResponseSignature)?;
    let signed = Message::parse(signed)?;
    let mid = u64le(signed.get(b"MIDP")?)?;
    let radius = u64::from(u32le(signed.get(b"RADI")?)?);
    let min = u64le(delegation.get(b"MINT")?)?;
    let max = u64le(delegation.get(b"MAXT")?)?;
    if min > max || mid < min || mid > max {
        return Err(TimeError::DelegationRange);
    }
    let path = reply.get(b"PATH")?;
    if !path.len().is_multiple_of(size) || path.len() / size > 32 {
        return Err(TimeError::Encoding);
    }
    let mut index = u32le(reply.get(b"INDX")?)?;
    let mut root = hash(0, &[nonce], size);
    for node in path.chunks_exact(size) {
        root = if index & 1 == 0 {
            hash(1, &[&root, node], size)
        } else {
            hash(1, &[node, &root], size)
        };
        index >>= 1;
    }
    if index != 0 || root != signed.get(b"ROOT")? {
        return Err(TimeError::Nonce);
    }
    // Work in wire units until the final outward rounding. Never narrow a signed interval.
    let lo = mid.checked_sub(radius).ok_or(TimeError::Encoding)?;
    let hi = mid.checked_add(radius).ok_or(TimeError::Encoding)?;
    let (midpoint_ms, radius_ms, lo_ms, hi_ms) = match protocol {
        Protocol::GoogleLegacy => (
            mid / 1000,
            radius.div_ceil(1000),
            lo / 1000,
            hi.div_ceil(1000),
        ),
        Protocol::IetfDraft08 => {
            let ms = |n: u64| n.checked_mul(1000).ok_or(TimeError::Encoding);
            (ms(mid)?, ms(radius)?, ms(lo)?, ms(hi)?)
        }
    };
    if radius_ms > max_radius_ms || radius == 0 {
        return Err(TimeError::Radius);
    }
    Ok((
        SourceEvidence {
            server_id: server.id.clone(),
            midpoint_ms,
            radius_ms,
            response_hash: Sha256::digest(response).into(),
        },
        TrustedInterval { lo_ms, hi_ms },
    ))
}
