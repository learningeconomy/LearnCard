---
'@learncard/didkit-plugin': minor
'@learncard/didkit-plugin-node': minor
'@learncard/create-http-bridge': patch
'@learncard/network-brain-service': patch
---

Support final-spec P-256 `ecdsa-rdfc-2019` verification in the rebuilt DIDKit engines and public proof options. Require authentication-purpose DIDAuth proofs in both VCALM exchange verification branches. Preserve existing EdDSA behavior and outgoing Ed25519 wallet suite negotiation; this does not add key-aware P-256 wallet production.
