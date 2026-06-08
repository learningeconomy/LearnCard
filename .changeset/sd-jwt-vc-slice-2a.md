---
'@learncard/sd-jwt-vc-plugin': minor
---

Slice 2a — wallet-ready categorization + display view-model.

Adds two new pure helpers (also exposed as plugin methods on `learnCard.invoke.*`):

- `categorizeSdJwt(vct: string): string` — maps the credential's `vct` to a LearnCard wallet category. Default is `'Achievement'`; well-known EUDI PID vcts (`urn:eu.europa.ec.eudi:pid:1`, `urn:eudi:pid:1`) and a small path heuristic (`/pid/`, `/identity/`, etc.) map to `'ID'`. Runtime overrides via `registerSdJwtVctCategory(vct, category)`.
- `toSdJwtDisplayViewModel(parsed: ParsedSdJwtVc): SdJwtDisplayViewModel` — normalizes a parsed credential into the shape the wallet renders: derived category, issuer, ISO-formatted dates, and disclosed claims stripped of SD-JWT protocol metadata (`iss`, `iat`, `exp`, `vct`, `cnf`, `_sd_alg`, etc.). Disclosure keys are emitted as a defensive copy so consumers can mutate freely.

Sets up Slice 2b (openid4vc plugin delegation) and Slice 2c (wallet-app VCDisplayCard adapter).
