---
'@learncard/didkey-plugin': minor
'@learncard/didkit-plugin': minor
'learn-card-base': patch
'learn-card-app': patch
---

Faster LCA cold start on the cached-key path:

- `@learncard/didkey-plugin`: add `getEd25519DidKeyFromSeed`, a plain-JS (`@noble/ed25519`) did:key derivation that matches the DIDKit path, and derive the secp256k1 keypair only on first use.
- `@learncard/didkit-plugin`: concurrent and repeated `init()` calls share one WASM init (no 250 ms polling); a failed init clears so the next call retries. Add `initDidKit` to start that init without building a plugin.
- `learn-card-app` / `learn-card-base`: the auth coordinator derives the DID in JS instead of building a signing wallet, and app entry warms DIDKit without awaiting it.
