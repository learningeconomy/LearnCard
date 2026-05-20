---
'@learncard/sd-jwt-vc-plugin': minor
---

Initial release of `@learncard/sd-jwt-vc-plugin` — SD-JWT-VC holder + verifier read-path (RFC 9901 + draft-ietf-oauth-sd-jwt-vc-16). Holder can parse, reconstruct, and verify selectively-disclosed credentials from any DID-resolvable issuer (`did:key`, `did:web`, `did:jwk` plus the rest via the existing DIDKit bridge). Accepts both the canonical `dc+sd-jwt` (draft-16) and legacy `vc+sd-jwt` format strings. Browser-first; no Node-only dependencies.

Out of scope this release (tracked as follow-ups): KB-JWT signing for presentations, per-claim consent UI, Token Status List, issuer-side signing, openid4vc transport wiring.
