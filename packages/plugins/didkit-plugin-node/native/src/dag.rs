use anyhow::{anyhow, Result};
use serde_json::Value;

/// Encode a value as an identity CID
pub fn encode_identity_cid(value: &Value) -> Result<Vec<u8>> {
    let bytes = serde_json::to_vec(value)?;
    
    // Create identity multihash manually (code 0x00)
    // Format: [code, length, ...data]
    let mut multihash = Vec::with_capacity(2 + bytes.len());
    multihash.push(0x00); // identity code
    
    // Use unsigned varint encoding for length
    encode_varint(bytes.len(), &mut multihash);
    multihash.extend_from_slice(&bytes);
    
    // Create CID v1 with raw codec (0x55)
    let mut cid_bytes = Vec::new();
    cid_bytes.push(0x01); // CID version 1
    cid_bytes.push(0x55); // raw codec
    cid_bytes.extend_from_slice(&multihash);
    
    Ok(cid_bytes)
}

/// Decode a cleartext from CID bytes after decryption and unpadding
pub fn decode_cleartext(bytes: &[u8]) -> Result<Value> {
    let unpadded = unpad(bytes)?;
    
    // Parse CID
    if unpadded.is_empty() {
        return Err(anyhow!("Empty CID"));
    }
    
    let version = unpadded[0];
    if version != 0x01 {
        return Err(anyhow!("Only CID v1 supported"));
    }
    
    if unpadded.len() < 3 {
        return Err(anyhow!("Invalid CID"));
    }
    
    let _codec = unpadded[1]; // Should be 0x55 for raw
    
    // Parse multihash
    let hash_code = unpadded[2];
    if hash_code != 0x00 {
        return Err(anyhow!("Expected identity multihash"));
    }
    
    // Decode varint length
    let (length, offset) = decode_varint(&unpadded[3..])?;
    let data_start = 3 + offset;
    let data_end = data_start + length;
    
    if data_end > unpadded.len() {
        return Err(anyhow!("Invalid multihash length"));
    }
    
    let data = &unpadded[data_start..data_end];
    let value: Value = serde_json::from_slice(data)?;
    Ok(value)
}

/// Encode unsigned varint
fn encode_varint(mut n: usize, buf: &mut Vec<u8>) {
    while n >= 0x80 {
        buf.push((n as u8) | 0x80);
        n >>= 7;
    }
    buf.push(n as u8);
}

/// Decode unsigned varint, returns (value, bytes_read)
fn decode_varint(bytes: &[u8]) -> Result<(usize, usize)> {
    let mut result = 0usize;
    let mut shift = 0;
    
    for (i, &byte) in bytes.iter().enumerate() {
        if i > 9 {
            return Err(anyhow!("Varint too long"));
        }
        
        result |= ((byte & 0x7f) as usize) << shift;
        
        if byte & 0x80 == 0 {
            return Ok((result, i + 1));
        }
        
        shift += 7;
    }
    
    Err(anyhow!("Incomplete varint"))
}

/// Prepare cleartext for encryption by encoding as CID and padding
pub fn prepare_cleartext(value: &Value, block_size: Option<usize>) -> Result<Vec<u8>> {
    let cid_bytes = encode_identity_cid(value)?;
    Ok(pad(&cid_bytes, block_size))
}

/// Pad data to a multiple of block_size (default 4096)
fn pad(data: &[u8], block_size: Option<usize>) -> Vec<u8> {
    let block_size = block_size.unwrap_or(4096);
    let pad_len = block_size - (data.len() % block_size);
    
    let mut padded = Vec::with_capacity(data.len() + pad_len);
    padded.extend_from_slice(data);
    
    // PKCS#7 padding
    padded.resize(data.len() + pad_len, pad_len as u8);
    
    padded
}

/// Remove PKCS#7 padding
fn unpad(data: &[u8]) -> Result<&[u8]> {
    if data.is_empty() {
        return Err(anyhow!("Empty data"));
    }
    
    let pad_len = *data.last().unwrap() as usize;
    
    if pad_len == 0 || pad_len > data.len() {
        return Err(anyhow!("Invalid padding"));
    }
    
    // Verify all padding bytes are correct
    for i in (data.len() - pad_len)..data.len() {
        if data[i] != pad_len as u8 {
            return Err(anyhow!("Invalid padding"));
        }
    }
    
    Ok(&data[..data.len() - pad_len])
}
