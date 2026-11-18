---
'@learncard/cli': patch
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
'learn-card-base': minor
'learn-card-app': minor
---

Let people choose whether an app adds credentials directly or only suggests them (LC-2423). A contract write category may set `canWrite: false` (missing means true); terms keep the per-category boolean and add `write.credentials.canWrite[category]`. A write lands directly only when the person allowed the category, their `canWrite` is not false, and the contract's is not false; otherwise it lands as a suggestion: a pending credential with a `suggest` transaction and a `CREDENTIAL_SUGGESTED` notification. This covers writes, auto-boosts and refreshes. Senders can force a suggestion with `writeCredentialToContract(..., { mode: 'suggest' })`. Holders accept with `acceptCredential` or dismiss with the new `dismissContractSuggestion(credentialUri)` (a `dismiss` transaction). `getConsentFlowCredentials` returns only direct writes unless `actions` asks for suggestions, so the app's sync never accepts a suggestion. `contractWriteMode` in `@learncard/helpers` gives the effective mode, and a `canWrite` change is classified (true to false is relaxed, false to true is expanded_optional, with existing holders kept at suggest). The consent screen shows Off / Suggest only / Add directly per write category and starts new consents at Suggest only; the contract builder adds write categories with `canWrite: false` and an "Add directly" setting.
