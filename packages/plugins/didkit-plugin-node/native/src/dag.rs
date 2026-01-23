use anyhow::{anyhow, Result};
use anyhow::{anyhow, Result};
use libipld::{cbor::DagCborCodec, codec::Codec, Ipld};
use libipld::serde::{from_ipld, to_ipld};
use serde_json::Value;
use unsigned_varint::{decode as varint_decode, encode as varint_encode};

const ENC_BLOCK_SIZE: usize = 24;
const IDENTITY_CODE: u64 = 0x00;
const DAG_CBOR_CODE: u64 = 0x71;
const VERSION_1: u64 = 0x01;

#[derive(Debug)]
struct SimpleCid {
    codec: u64,
    digest: Vec<u8>,
}

impl SimpleCid {
    fn new_v1(codec: u64, digest: Vec<u8>) -> Self {
        Self { codec, digest }
    }

    fn write_bytes(&self, mut w: impl std::io::Write) -> Result<usize> {
        let mut version_buf = varint_encode::u64_buffer();
        let version = varint_encode::u64(VERSION_1, &mut version_buf);

        let mut codec_buf = varint_encode::u64_buffer();
        let codec = varint_encode::u64(self.codec, &mut codec_buf);

        let mut hash_code_buf = varint_encode::u64_buffer();
        let hash_code = varint_encode::u64(IDENTITY_CODE, &mut hash_code_buf);

        let mut size_buf = varint_encode::u64_buffer();
        let size = varint_encode::u64(self.digest.len() as u64, &mut size_buf);

        let mut written = 0;
        written += w.write(version)?;
        written += w.write(codec)?;
        written += w.write(hash_code)?;
        written += w.write(size)?;
        written += w.write(&self.digest)?;

        Ok(written)
    }

    fn to_bytes(&self) -> Result<Vec<u8>> {
        let mut bytes = Vec::new();
        self.write_bytes(&mut bytes)?;
        Ok(bytes)
    }

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let (version, rest) = varint_decode::u64(bytes)?;
        if version != VERSION_1 {
            return Err(anyhow!("Only CIDv1 is supported"));
        }

        let (codec, rest) = varint_decode::u64(rest)?;

        let (hash_code, rest) = varint_decode::u64(rest)?;
        if hash_code != IDENTITY_CODE {
            return Err(anyhow!("Only identity hash is supported"));
        }

        let (hash_len, rest) = varint_decode::u64(rest)?;
        let hash_len = hash_len as usize;

        if rest.len() < hash_len {
            return Err(anyhow!("Invalid multihash length"));
        }

        let digest = rest[..hash_len].to_vec();

        Ok(Self::new_v1(codec, digest))
    }
}

fn pad(bytes: &[u8], block_size: Option<usize>) -> Vec<u8> {
    let block_size = block_size.unwrap_or(ENC_BLOCK_SIZE);
    let pad_len = (block_size - (bytes.len() % block_size)) % block_size;
    let mut padded = Vec::with_capacity(bytes.len() + pad_len);
    padded.extend_from_slice(bytes);
    padded.extend(std::iter::repeat(0).take(pad_len));
    padded
}

/// Encodes a value using DAG-CBOR and creates a CID with identity multihash
fn encode_identity_cid(value: &Value) -> Result<SimpleCid> {
    let ipld: Ipld = to_ipld(value).map_err(|e| anyhow!("IPLD conversion failed: {e}"))?;
    let bytes = DagCborCodec.encode(&ipld)?;
    Ok(SimpleCid::new_v1(DAG_CBOR_CODE, bytes))
}

/// Decodes a CID with identity multihash back to the original value
fn decode_identity_cid(cid: &SimpleCid) -> Result<Value> {
    if cid.codec != DAG_CBOR_CODE {
        return Err(anyhow!("CID codec must be dag-cbor"));
    }

    let ipld: Ipld = DagCborCodec.decode(&cid.digest)?;
    from_ipld(ipld).map_err(|e| anyhow!("IPLD conversion failed: {e}"))
}

/// Prepare cleartext for encryption by encoding as CID and padding
pub fn prepare_cleartext(value: &Value, block_size: Option<usize>) -> Result<Vec<u8>> {
    let cid = encode_identity_cid(value)?;
    Ok(pad(&cid.to_bytes()?, block_size))
}

/// Decode a cleartext from CID bytes after decryption
pub fn decode_cleartext(bytes: &[u8]) -> Result<Value> {
    let cid = SimpleCid::from_bytes(bytes)?;
    decode_identity_cid(&cid)
}
