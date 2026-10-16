---
"@learncard/types": patch
"learn-card-app": patch
"learn-card-base": patch
---

Allow optional proof creation timestamps for the standardized ECDSA, EdDSA and BBS Data Integrity cryptosuites without rewriting signed payloads.

Handle one-shot CHAPI events safely across account changes, allow cancellation during exchanges, deduplicate exact reopened offers using account-scoped fingerprints of the full signed payload, and avoid retrying consumed acknowledgements or cancellations. Preserve distinct same-ID credential revisions and explain that partial saves remain after cancellation. Keep storage diagnostics useful without logging private credential payloads or counterparty messages.
