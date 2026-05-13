---
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
'@learncard/vc-plugin': patch
'@learncard/learn-card-plugin': patch
---

Add end-to-end W3C Bitstring Status List support for LearnCard Network credentials.

Issued VC 2.0 credentials now receive issuer-scoped Bitstring Status List entries, with support for revocation and suspension purposes, automatic list rollover, stable public status list credential URLs, and re-signed status list credentials when statuses change.

The network plugin exposes status-list allocation plus suspend and unsuspend operations, shared types and helpers are exported for status list entries and bit operations, and VC verification now relies on DIDKit's native array-form credential status support.

Prettified credential verification output now renders user-facing status messages such as `Status: Active`, `Status: Not Revoked`, `Status: Revoked`, and `Status: Suspended` instead of showing only the raw `status` check name.
