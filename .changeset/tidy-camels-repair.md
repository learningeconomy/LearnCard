---
'@learncard/network-brain-service': patch
'learn-card-app': patch
---

Fix claim links backed by app-owned signing authorities failing with 500 (LC-1942)

- The VC-API claim workflow (`workflows.participateInExchange`) now resolves whether a claim link's signing authority belongs to an app store listing and passes the app's did:web as `ownerDidOverride` when issuing, matching the app-store issuance flows. Previously the LCA-API lookup used the user's DID and missed app-owned SA records.
- Underlying issuance errors are now surfaced in the exchange error message instead of a generic "Failed to issue credential for exchange".
- BoostCMS claim-link generation now signs with a user-owned signing authority (preferring the primary), instead of blindly using the first registered SA — which could silently be an app-owned SA from the developer portal.
