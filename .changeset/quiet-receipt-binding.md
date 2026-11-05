---
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
'@learncard/vc-plugin': minor
---

Add holder-authorized pre-accept managed delivery receipts and shared binding validation.
Allow refresh callers to pin the original public status and refresh service, and reject
changed managed versions without a strictly newer signed validFrom. Verify managed
deliveries before claim previews, acceptance and local indexing, and retain their
validated binding with the local index record. This does not enable holder-mode issuance.
