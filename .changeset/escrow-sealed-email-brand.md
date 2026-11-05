---
'@learncard/sss-key-manager': minor
'@learncard/lca-api-service': patch
'learn-card-base': patch
'learn-card-app': patch
---

Let the escrow enclave's own recovery emails (code, recovery started, release warning) carry the app's brand. The owner's device seals a display name into the escrow blob at enrollment (`recoveryBrand`), the same way it seals the recovery email and language. This needs the brand-aware enclave image, and stays off until a tenant turns it on (SECURITY.md D21).

- **sss-key-manager:** new optional `escrow.emailBrand`. It is sealed as `recoveryBrand` only when the recovery contact is sealed (nitro enroll/replace), never on a carry. `createSSSStrategy` throws if the value is invalid. New export `canonicalEscrowEmailBrand` (ASCII letters, digits, space, `-`, `'`, `&`; 1-32 characters, starting with a letter; at most 3 digits in total and no `http`/`www`), plus `MAX_ESCROW_EMAIL_BRAND_LENGTH` and `MAX_ESCROW_EMAIL_BRAND_DIGITS`. `EscrowBlobPlaintext` gains `recoveryBrand?`. The blob and release parsers keep a valid brand and drop an invalid one without failing; before this change they dropped the field entirely. `violatesCarryContactRule` also flags a target that claims a brand.
- **learn-card-base:** new tenant config flag `auth.sss.escrowSealEmailBrand` (default false). When it is on, `getEscrowStrategyConfig(sss, { appBrandName })` forwards the canonical app name as `emailBrand`. An invalid name is logged and omitted, and escrow stays enabled. `getEscrowEmailSender` now returns `mixed`, which is true when this app seals its brand. New optional `auth.sss.escrowSharedEmailBrands` (the other apps sharing this app's DIDs): with sealing on, an app whose fallback brand is its own (LearnCard) gets a `shared` note naming them, since a shared DID's brand is "last writer wins". New `getTenantEscrowStrategyConfig(sss, tenant)`, used by both apps' `sss` factories, forwards `branding.name`.
- **learn-card-app:** passes `branding.name` through `getTenantEscrowStrategyConfig`. While sealing is on, the recovery screens say the code and updates may come from either brand, or, in LearnCard, from VetPass if the user also uses it (4 new keys in each of the 4 locales).
- **lca-api:** no code change. The software enclave now keeps the sealed brand through carry and rewrap because it uses the updated parser (covered by a test).
