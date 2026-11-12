---
'@learncard/didkit-plugin': patch
---

Stop sending inline JSON-LD context objects to the DIDKit WASM context loader. Signing or verifying a credential with an inline context (such as the managed refresh context) no longer triggers WASM out-of-bounds traps (LC-2380).
