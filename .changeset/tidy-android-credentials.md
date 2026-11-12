---
'@learncard/openid4vc-plugin': minor
'@learncard/sd-jwt-vc-plugin': patch
---

LC-2159: Add transport-neutral Digital Credentials API request parsing and response creation for the unsigned OpenID4VP SD-JWT profile. Responses enforce explicit request-bounded disclosures and bind holder proofs to the trusted origin and nonce without HTTP submission. Existing URI/direct-post transports are preserved.

Support portable Ed25519 signing and verification on older Android WebViews while retaining JWK operation restrictions. Preserve JOSE verification for other supported issuer curves, including Ed448.
