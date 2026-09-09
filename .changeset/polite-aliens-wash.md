---
"learn-card-app": patch
"learn-card-base": patch
"@learncard/create-http-bridge": patch
"@learncard/helpers": patch
"@learncard/react": patch
"@learncard/network-plugin": patch
"@learncard/openid4vc-plugin": patch
"@learncard/network-brain-service": patch
"@learncard/lca-api-service": patch
"@learncard/learn-cloud-service": patch
---

chore: [LC-2175] & [LC-2176] Fixing CodeQL alerts

**Breaking change in @learncard/openid4vc-plugin**: `defaultMakeId` now throws if
`crypto.getRandomValues` is unavailable (no `Math.random()` fallback). This affects
legacy environments without Web Crypto API — modern browsers and Node.js are unaffected.
