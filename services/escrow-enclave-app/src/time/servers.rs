//! Provider-published pins. Never refresh these through the untrusted parent.
use super::{PinnedServer, Protocol, TimeError};
use base64::{engine::general_purpose::STANDARD, Engine};

/// Cloudflare beta key, published at
/// https://developers.cloudflare.com/time-services/roughtime/usage/ (2026-09-25).
pub const CLOUDFLARE_PUBLIC_KEY: &str = "0GD7c3yP8xEc4Zl2zeuN2SlLvDVVocjsPSL8/Rl/7zg=";
/// Google sandbox key, published in Google's original service repository:
/// https://roughtime.googlesource.com/roughtime/+/dd529367052d2d4e723407525887310fe866ddd8/roughtime-servers.json
/// Authoritative historical pin; service availability is NOT guaranteed.
/// verify before production: current sandbox key/service status is unconfirmed.
pub const GOOGLE_PUBLIC_KEY: &str = "etPaaIxcBMY1oUeGpwvPMCJMwlRVNxv51KK/tktoJTQ=";

pub fn published() -> Result<Vec<PinnedServer>, TimeError> {
    [
        ("cloudflare", CLOUDFLARE_PUBLIC_KEY, Protocol::IetfDraft08),
        ("google", GOOGLE_PUBLIC_KEY, Protocol::GoogleLegacy),
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
