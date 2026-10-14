//! Bounded BER -> DER normalisation for KMS `CiphertextForRecipient`.
//!
//! KMS returns CMS EnvelopedData in BER: indefinite lengths throughout and,
//! in some responses, `encryptedContent` as a constructed (chunked) `[0]`
//! (see aws-nitro-enclaves-sdk-c `source/cms.c`). `der` 0.7 / `cms` 0.2 decode
//! DER only, so this rewrites the input to definite-length DER and the strict
//! structural checks in `open_ciphertext_for_recipient` still run unchanged.
//! Only low-tag-number identifiers are accepted; depth, node count and input
//! size are bounded; trailing bytes are rejected.
use super::KmsError;

const MAX_INPUT: usize = 16_384;
const MAX_DEPTH: usize = 16;
const MAX_NODES: usize = 256;

const CONSTRUCTED: u8 = 0x20;
const OCTET_STRING: u8 = 0x04;
const SEQUENCE: u8 = 0x30;
const SET: u8 = 0x31;
const CONTEXT_0_PRIMITIVE: u8 = 0x80;
const CONTEXT_0_CONSTRUCTED: u8 = 0xa0;

#[derive(Debug, PartialEq, Eq)]
pub(super) enum Node {
    Primitive(u8, Vec<u8>),
    Constructed(u8, Vec<Node>),
}

struct Parser<'a> {
    input: &'a [u8],
    pos: usize,
    nodes: usize,
}

impl Parser<'_> {
    fn byte(&mut self) -> Result<u8, KmsError> {
        let b = *self.input.get(self.pos).ok_or(KmsError::Encoding)?;
        self.pos += 1;
        Ok(b)
    }

    fn definite_length(&mut self) -> Result<Option<usize>, KmsError> {
        let first = self.byte()?;
        if first < 0x80 {
            return Ok(Some(first.into()));
        }
        if first == 0x80 {
            return Ok(None);
        }
        let count = usize::from(first & 0x7f);
        if count > 2 {
            return Err(KmsError::Encoding);
        }
        let mut len = 0usize;
        for _ in 0..count {
            len = (len << 8) | usize::from(self.byte()?);
        }
        Ok(Some(len))
    }

    fn at_end_of_contents(&self) -> bool {
        self.input.get(self.pos..self.pos + 2) == Some(&[0, 0])
    }

    fn node(&mut self, depth: usize) -> Result<Node, KmsError> {
        self.nodes += 1;
        if depth > MAX_DEPTH || self.nodes > MAX_NODES {
            return Err(KmsError::Encoding);
        }
        let tag = self.byte()?;
        if tag == 0 || tag & 0x1f == 0x1f {
            return Err(KmsError::Encoding);
        }
        let length = self.definite_length()?;
        if tag & CONSTRUCTED == 0 {
            let len = length.ok_or(KmsError::Encoding)?;
            let end = self.pos.checked_add(len).ok_or(KmsError::Encoding)?;
            let content = self.input.get(self.pos..end).ok_or(KmsError::Encoding)?;
            self.pos = end;
            return Ok(Node::Primitive(tag, content.to_vec()));
        }
        let mut children = Vec::new();
        match length {
            Some(len) => {
                let end = self.pos.checked_add(len).ok_or(KmsError::Encoding)?;
                if end > self.input.len() {
                    return Err(KmsError::Encoding);
                }
                while self.pos < end {
                    children.push(self.node(depth + 1)?);
                }
                if self.pos != end {
                    return Err(KmsError::Encoding);
                }
            }
            None => {
                while !self.at_end_of_contents() {
                    children.push(self.node(depth + 1)?);
                }
                self.pos += 2;
            }
        }
        if tag == OCTET_STRING | CONSTRUCTED {
            return concat_octet_strings(&children).map(|c| Node::Primitive(OCTET_STRING, c));
        }
        Ok(Node::Constructed(tag, children))
    }
}

fn concat_octet_strings(children: &[Node]) -> Result<Vec<u8>, KmsError> {
    let mut out = Vec::new();
    for child in children {
        match child {
            Node::Primitive(OCTET_STRING, bytes) => out.extend_from_slice(bytes),
            _ => return Err(KmsError::Encoding),
        }
    }
    Ok(out)
}

pub(super) fn parse(input: &[u8]) -> Result<Node, KmsError> {
    if input.len() > MAX_INPUT {
        return Err(KmsError::Encoding);
    }
    let mut parser = Parser {
        input,
        pos: 0,
        nodes: 0,
    };
    let root = parser.node(0)?;
    if parser.pos != input.len() {
        return Err(KmsError::Encoding);
    }
    Ok(root)
}

/// ContentInfo -> [0] -> EnvelopedData -> EncryptedContentInfo -> [0]: a
/// constructed `[0]` of OCTET STRING chunks becomes the primitive
/// `[0] IMPLICIT OCTET STRING` that `cms` models. Any other shape is left
/// alone for the strict decoder to reject.
fn flatten_encrypted_content(root: &mut Node) {
    let Node::Constructed(SEQUENCE, info) = root else {
        return;
    };
    let Some(Node::Constructed(CONTEXT_0_CONSTRUCTED, explicit)) = info.get_mut(1) else {
        return;
    };
    let Some(Node::Constructed(SEQUENCE, enveloped)) = explicit.get_mut(0) else {
        return;
    };
    let Some(set) = enveloped
        .iter()
        .position(|n| matches!(n, Node::Constructed(SET, _)))
    else {
        return;
    };
    let Some(Node::Constructed(SEQUENCE, encrypted)) = enveloped.get_mut(set + 1) else {
        return;
    };
    let Some(slot) = encrypted.get_mut(2) else {
        return;
    };
    if let Node::Constructed(CONTEXT_0_CONSTRUCTED, chunks) = slot {
        if let Ok(bytes) = concat_octet_strings(chunks) {
            *slot = Node::Primitive(CONTEXT_0_PRIMITIVE, bytes);
        }
    }
}

fn encode_length(len: usize, out: &mut Vec<u8>) {
    match len {
        0..=0x7f => out.push(len as u8),
        0x80..=0xff => out.extend_from_slice(&[0x81, len as u8]),
        _ => out.extend_from_slice(&[0x82, (len >> 8) as u8, len as u8]),
    }
}

pub(super) fn encode(node: &Node, out: &mut Vec<u8>) {
    match node {
        Node::Primitive(tag, content) => {
            out.push(*tag);
            encode_length(content.len(), out);
            out.extend_from_slice(content);
        }
        Node::Constructed(tag, children) => {
            let mut content = Vec::new();
            for child in children {
                encode(child, &mut content);
            }
            out.push(*tag);
            encode_length(content.len(), out);
            out.extend_from_slice(&content);
        }
    }
}

pub(super) fn normalize_kms_cms(input: &[u8]) -> Result<Vec<u8>, KmsError> {
    let mut root = parse(input)?;
    flatten_encrypted_content(&mut root);
    let mut out = Vec::with_capacity(input.len());
    encode(&root, &mut out);
    Ok(out)
}
