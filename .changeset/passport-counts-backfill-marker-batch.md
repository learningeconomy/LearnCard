---
'@learncard/learn-cloud-plugin': patch
'learn-card-base': patch
'learn-card-app': patch
---

Fresh-device Passport/Home counts: the counts start the visibility backfill when its marker is missing, so a sign-in that skips the auth coordinator still writes it, and the marker read goes in the same batched request as the counts (LC-2413).
