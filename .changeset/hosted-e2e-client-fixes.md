---
'@learncard/lca-api-client': patch
'@learncard/network-brain-client': patch
'@learncard/learn-cloud-client': patch
'@learncard/network-plugin': patch
'@learncard/lca-api-service': patch
---

fix: [LC-2137] Surface the original request error when auth refresh fails instead of hanging; allow `deleteProfile` with API tokens that lack `profiles:read`; retry did:web signing on `Key mismatch` after refreshing the DID document.
