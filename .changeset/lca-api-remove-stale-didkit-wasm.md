---
'@learncard/lca-api-service': patch
---

Remove an outdated DIDKit WASM copy from lca-api's `src/`. Nothing loaded it; lca-api keeps loading DIDKit from `@learncard/didkit-plugin` (or the copy its build places next to the bundle).
