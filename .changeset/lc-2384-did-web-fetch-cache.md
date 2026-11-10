---
'@learncard/didkit-plugin': patch
---

Dedupe and short-TTL cache concurrent did:web `did.json` fetches so opening one credential no longer stampedes the issuer document.

`getDidKitPlugin` keeps the generic 10s default and never raises a shorter preinstalled TTL. LearnCard App wallet boot calls `installWalletDidWebDocumentFetchCache()` (`WALLET_DID_WEB_DOCUMENT_TTL_MS` = 60s) before `initLearnCard` as an explicit opt-in.
