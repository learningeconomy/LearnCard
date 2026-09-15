---
'@learncard/types': minor
'@learncard/network-brain-service': minor
---

`send()` accepts `options.expiresInDays` (1–720, default 30) for email and phone recipients, matching `/inbox/issue`. It sets how long the credential stays claimable in the Universal Inbox; it does not change the credential's validity period.
