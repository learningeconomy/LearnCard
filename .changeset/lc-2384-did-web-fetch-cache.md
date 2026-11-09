---
'@learncard/didkit-plugin': patch
---

Dedupe and short-TTL cache concurrent did:web `did.json` fetches so opening one credential no longer stampedes the issuer document.

Wallet boot (`getDidKitPlugin`) installs with `WALLET_DID_WEB_DOCUMENT_TTL_MS` (60s) so a credential modal that keeps re-resolving does not refetch every 10s; library `DEFAULT_DID_WEB_DOCUMENT_TTL_MS` remains 10s.
