---
'@learncard/lca-api-service': minor
'@learncard/lca-api-plugin': minor
---

ClassLink account continuity (LC-2409), server side. lca-api now enforces who may add a ClassLink personal email (`CLASSLINK_ACCOUNT_CONTINUITY_ENABLED`, off by default; `CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT`; per-district `accountContinuity`) and refuses with a stable reason code. Verifying the personal email also sets it as the recovery email when that is safe. New routes: `classlink.getAccountContinuity` and `classlink.removePersonalEmail`, with matching `lca-api-plugin` methods. Recovery tokens now record `proof: 'email-otp'`.
