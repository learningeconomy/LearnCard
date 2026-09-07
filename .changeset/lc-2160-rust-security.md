---
'@learncard/didkit-plugin': patch
'@learncard/didkit-plugin-node': patch
'@learncard/create-http-bridge': patch
---

Rebuild DIDKit consumers from the LC-2160 Rust dependency remediation, removing vulnerable legacy dependency branches. Preserve seeded Ed25519 identities and JWE interoperability. Preserve DIDKit's independent workspace lock during WASM builds, and validate native prebuilds for SSI/DIDKit pin changes.

RSA Marvin (RUSTSEC-2023-0071) remains unresolved in rsa 0.9.10. Deployment requires separate authorized risk approval. Hosted WASM publication and its immutable default URL must be updated before this release ships.
