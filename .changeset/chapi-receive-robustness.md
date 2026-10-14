---
"@learncard/types": patch
"learn-card-app": patch
"learn-card-base": patch
---

Allow optional proof creation timestamps for the standardized ECDSA, EdDSA and BBS Data Integrity cryptosuites without rewriting signed payloads.

Handle one-shot CHAPI events safely across account changes, allow cancellation during exchanges, deduplicate reopened offers by credential ID, and avoid retrying consumed acknowledgements. Keep storage diagnostics useful without logging private credential payloads or counterparty messages.
