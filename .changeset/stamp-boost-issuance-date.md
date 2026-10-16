---
'@learncard/network-brain-service': patch
---

Stamp the issuance date when issuing credentials from Boost templates (claim links, VC-API workflows, ConsentFlow autoboosts), so a stale or malformed template `issuanceDate`/`validFrom` no longer fails signing or back-dates new credentials.
