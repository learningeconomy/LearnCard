---
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
'@learncard/vc-plugin': minor
'@learncard/encryption-plugin': minor
---

Add holder-authorized pre-accept managed delivery receipts and shared binding validation.
Allow refresh callers to pin the original public status and refresh service, and reject
changed managed versions without a strictly newer signed validFrom. Verify managed
deliveries before claim previews, acceptance and local indexing, and retain their
validated binding with the local index record. This does not enable holder-mode issuance.

Add a strict ciphertext-only holder handoff contract, an explicit-recipient DAG JWE
primitive that does not add the caller, and a shared exact recipient-key-set check.
These are preparatory primitives only; holder-mode send and publish are not enabled.
