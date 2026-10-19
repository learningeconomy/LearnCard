---
"@learncard/network-brain-service": patch
---

Add a relationship index on `CREDENTIAL_SENT.activityId`. Credential activity feeds and stats join each activity to its credential by this property; without the index every activity row scanned all `CREDENTIAL_SENT` relationships.
