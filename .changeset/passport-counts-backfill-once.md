---
'learn-card-base': patch
'learn-card-app': patch
---

Fresh-device Passport/Home counts: the visibility backfill and its marker now run once per wallet per app session, whichever starts it and even when the wallet's DID turns from did:key into did:web as the profile loads. Every caller shares one marker read, so a counts request carries one marker read. A run that doesn't leave the marker can be retried in the same session (LC-2413).
