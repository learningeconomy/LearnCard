---
"@learncard/learn-card-plugin": patch
---

fix: map raw credential-verification diagnostics to friendly copy. did:web issuer resolution runs in-browser and fails (CORS/offline) with raw messages like "Unable to resolve: Error sending HTTP request (.../.well-known/did.json) ... Failed to fetch"; the Credential Verifications panel rendered these (and WASM stack frames) verbatim. `prettifyVerificationItem` now maps resolution/fetch failures to "Issuer — Could not be reached" and other raw engine diagnostics to "Verification — Could not be verified".
