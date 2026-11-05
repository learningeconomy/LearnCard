---
'@learncard/sss-key-manager': minor
'@learncard/lca-api-service': patch
'learn-card-base': patch
'learn-card-app': patch
'@learncard/escrow-canary': patch
---

Prepare VetPass to use escrow recovery on LearnCard's escrow enclave. The enclave serves one tenant: it signs and checks its own authority tenant label (`learncard`). Before this change VetPass sent its app tenant (`vetpass`) instead, so its first authority-state read failed.

- **sss-key-manager:** new optional `escrow.authorityTenant`, used for everything the enclave signs or checks (intent tenant, authority state, hold and code-delivery records, persisted recovery expectations). `tenantId` is still sent as `X-Tenant-Id` and used for branding. It defaults to `tenantId`, so LearnCard and ScoutPass behave as before. If signed evidence carries another label, the client throws the new `EscrowAuthorityTenantMismatchError` (a subclass of `EscrowEvidenceError` that names both labels) before rotating shares or taking any recovery step. A malformed label throws in `createSSSStrategy`.
- **learn-card-base:** new tenant config field `auth.sss.escrowAuthorityTenant` (validated), forwarded with the escrow trust policy by `getEscrowStrategyConfig`. Also adds the helpers `getEscrowAuthorityTenant`, `escrowAuthorityBrandName`, `getEscrowEmailSenderBrand` and `getEscrowEmailSender` (compares the app's `branding.name` with the enclave brand).
- **lca-api:** checks escrow intents and authority state against the new `ESCROW_AUTHORITY_TENANT` setting (default `learncard`, so no infrastructure change), not the client-supplied `X-Tenant-Id`. It also refuses an enroll when the authority state it reads carries a different tenant. Holds, emails and links still use the app tenant. The default is global, so the ScoutPass deployment (escrow off) must set its own value before it turns escrow on.
- **learn-card-app:** no VetPass config change: VetPass escrow stays off at every stage until the SSS switch turns it on together with LearnCard production. A new test keeps it off until then, and afterwards fails if VetPass and LearnCard differ in key derivation, escrow mode, pins or authority tenant at any deployed stage. When the enclave's email brand differs from the app's, the recovery screens explain that the code and some other emails come from LearnCard (4 locales).
- **escrow-canary:** tier 3 reports any `EscrowEvidenceError` subclass, including the new tenant mismatch, as `evidence` rather than `unexpected`.
