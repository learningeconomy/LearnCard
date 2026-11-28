---
'learn-card-app': patch
'learn-card-base': patch
---

perf: `/consent-flow`, `/claim/boost` and `/connect/:profileId` render before sign-in settles. The contract, boost or profile shows right away; actions that differ for signed-in and signed-out visitors (and the recipient's details on a claim) show a placeholder until sign-in is known, and `/connect` no longer builds a demo wallet to read a profile. `learn-card-base` now depends on `@learncard/network-brain-client`: `useContract` reads contracts through the no-auth client unless a wallet is already running, instead of building a throwaway wallet for signed-out visitors, and `getAnonymousNetworkClient` (`learn-card-base/helpers/anonymousNetworkClient`) is shared with the app store queries.
