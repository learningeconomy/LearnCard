---
"@learncard/didkit-plugin": patch
"@learncard/didkit-plugin-node": patch
"learn-card-app": patch
---

Fix slow CLR presentation signing with the updated SSI canonicalizer, and ship matching DIDKit WASM, JavaScript glue, source revisions, and a content-addressed hosted default URL. Verify the decompressed CloudFront payload against its SHA-256 before proposing future updates.

Show a localized error and retry action when credential share-link generation fails, instead of leaving compact and full sharing surfaces loading indefinitely.

Canonicalization now bounds ambiguous-node work. Highly symmetric credentials or presentations, including previously issued credentials, can reach these limits during signing or verification. A resource-limit error does not by itself establish that a credential's signature is invalid.
