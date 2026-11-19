---
'@learncard/lca-api-service': minor
'@learncard/lca-api-plugin': minor
---

ClassLink account continuity (LC-2409), server side. lca-api now enforces who may add a ClassLink personal email (`CLASSLINK_ACCOUNT_CONTINUITY_ENABLED`, off by default; `CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT`; per-district `accountContinuity`) and refuses with a stable reason code. Verifying the personal email makes it the account's sign-in email (its ClassLink Firebase user's email and the contact method, restored exactly on removal or when the school login moves), and returns a custom token to sign back in; the school email keeps signing in through an alias while the district trusts it and the student used ClassLink within `schoolEmailAliasMaxIdleDays` (default 365, per district, 0 turns it off). Email-code login, network hand-off and the Keycloak bridge (which now requires `email_verified`) resolve users through one helper. New routes: `classlink.getAccountContinuity` and `classlink.removePersonalEmail`, with matching `lca-api-plugin` methods. Recovery tokens now record `proof: 'email-otp'`.
