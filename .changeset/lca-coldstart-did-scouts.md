---
'scoutpass-app': patch
---

Scouts' auth coordinator derives the cached-key did:key in plain JS (`getEd25519DidKeyFromSeed`) instead of building a signing wallet just to read the DID. Signing (`signDidAuthVp`) still uses `getSigningLearnCard`.
