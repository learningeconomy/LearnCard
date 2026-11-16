---
'learn-card-base': patch
'learn-card-app': patch
---

Stop two false reports at app start. Campaign messages no longer fail with "Campaign profile changed" when the wallet's DID turns from did:key into the profile's did:web as the profile loads (LEARN-CARD-APP-M7A). Credential list and count reads that React Query cancels (key change or unmount) are no longer reported as errors (LEARN-CARD-APP-M6W, M6T, M70).
