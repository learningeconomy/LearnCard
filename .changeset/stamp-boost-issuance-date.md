---
'@learncard/network-brain-service': patch
---

Stamp the issuance date when issuing credentials from Boost templates (claim links, VC-API workflows, ConsentFlow autoboosts), so a stale or malformed template `issuanceDate`/`validFrom` no longer fails signing or back-dates new credentials. VC 2.0 credentials built from templates (including direct sends and inbox issuance) now get a fresh `validFrom` and drop any leftover `issuanceDate`, which DIDKit can't sign under the VC 2.0 context.
