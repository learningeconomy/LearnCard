---
"@learncard/types": patch
---

Record lanes can declare `issuance.delivery: 'push' | 'offer'`. When it is absent, delivery is 'push', so existing declarations parse unchanged. 'offer' makes Platform Issuance return a claim offer instead of signing at release.
