---
'@learncard/didkit-plugin': minor
'@learncard/didkit-plugin-node': minor
'@learncard/create-http-bridge': patch
'@learncard/network-brain-service': minor
'@learncard/types': minor
---

Support final-spec P-256 `ecdsa-rdfc-2019` verification in the rebuilt DIDKit engines and public proof options. Require authentication-purpose DIDAuth proofs in both VCALM exchange verification branches. Preserve existing EdDSA behavior and outgoing Ed25519 wallet suite negotiation; this does not add key-aware P-256 wallet production.

External VCALM responders must sign DIDAuth presentations with `proofPurpose: 'authentication'`, echo the requested `challenge` and `domain`, and use a verification method authorized for authentication by the holder's DID document. Presentations signed with `assertionMethod` (including the previous `issuePresentation` default) are now rejected by claim-link and inbox-claim exchanges. First-party LearnCard and ScoutPass responders already use authentication proofs.

Allow `created` to be omitted only on final `ecdsa-rdfc-2019` DataIntegrityProofs in shared VC/VP schemas, while preserving the timestamp requirement for other proof suites.

Inbox claims retain a holder-encrypted recovery copy and therefore also require a supported X25519 key-agreement method. A `did:web` holder can use P-256 for authentication and a separate X25519 key for delivery. Signing-only P-256 `did:key` holders remain supported by generic claim links, but cannot claim inbox deliveries. Failed delivery encryption now returns an error without consuming the pending credential or exchange challenge.
