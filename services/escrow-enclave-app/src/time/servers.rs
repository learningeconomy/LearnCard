//! Provider-published pins. Never refresh these through the untrusted parent.
use super::{PinnedServer, Protocol, TimeError};
use base64::{engine::general_purpose::STANDARD, Engine};

/// Cloudflare beta key, published at
/// https://developers.cloudflare.com/time-services/roughtime/usage/ (fetched 2026-09-30).
pub const CLOUDFLARE_PUBLIC_KEY: &str = "0GD7c3yP8xEc4Zl2zeuN2SlLvDVVocjsPSL8/Rl/7zg=";
/// int08h's long-term key, https://int08h.com/post/public-roughtime-server/
/// (fetched 2026-09-30). Select its Google legacy endpoint explicitly.
pub const INT08H_PUBLIC_KEY: &str = "AW5uAoTSTDfG5NfY1bTh08GUnOqlRb+HVhbJ3ODJvsE=";
/// Tanner Ryan's long-term key, https://time.txryan.com/ (fetched 2026-09-30).
/// Operator implementation: https://github.com/tannerryan/roughtime supports legacy.
pub const TXRYAN_PUBLIC_KEY: &str = "iBVjxg/1j7y1+kQUTBYdTabxCppesU/07D4PMDJk2WA=";

pub fn published() -> Result<Vec<PinnedServer>, TimeError> {
    [
        ("cloudflare", CLOUDFLARE_PUBLIC_KEY, Protocol::IetfDraft08),
        ("int08h", INT08H_PUBLIC_KEY, Protocol::GoogleLegacy),
        ("txryan", TXRYAN_PUBLIC_KEY, Protocol::GoogleLegacy),
    ]
    .into_iter()
    .map(|(id, key, protocol)| {
        Ok(PinnedServer {
            id: id.into(),
            public_key: STANDARD
                .decode(key)
                .map_err(|_| TimeError::Configuration)?
                .try_into()
                .map_err(|_| TimeError::Configuration)?,
            protocol,
        })
    })
    .collect()
}
