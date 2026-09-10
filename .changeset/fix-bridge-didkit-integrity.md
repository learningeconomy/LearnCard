---
'@learncard/create-http-bridge': patch
---

Synchronize the bundled DIDKit WASM with the current plugin artifact and restore checksum-verified bridge builds. Intentional WASM updates now refresh the integrity pin and bridge copy together; ordinary builds continue to reject unexpected artifact changes.
