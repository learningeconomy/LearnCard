---
'@learncard/network-plugin': minor
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/vc-plugin': patch
---

Managed refreshable sends through the standard send paths (LC-2198). `send({ type: 'boost', refresh: true })` now issues refreshable credentials for profile/DID recipients: with local signing the SDK allocates the managed refresh service, injects it (with its inline JSON-LD context) before signing, and hands the signed credential to the server's unified send so activity/contract behavior and the canonical receipt are preserved; without local signing the request is served by the signing-authority path. Email/phone recipients always reject before anything is created.

`sendBoost` with literal `{ enableRefresh: true }` now returns `{ credentialUri, refresh }` instead of a plain URI string, where `refresh` is the metadata-only issuance receipt (refreshId, refreshService, credentialId, issuerDid, holderDid, credentialStatus) needed to publish future versions via `publishCredentialRefresh`. Legacy callers — boolean options, omitted options, or object options without `enableRefresh` — still receive the credential URI string; a dynamically typed `enableRefresh` degrades the result to `string | { credentialUri, refresh }`. Managed encryption remains holder-only and mandatory even when `encrypt: false`.

`@learncard/types` adds the `ManagedCredentialRefreshReceipt` validator plus optional `refresh` on the unified send input/response validators; `@learncard/helpers` adds the shared managed context preparation helpers (`prepareManagedRefreshContext`, `injectManagedRefreshService`) now also used by SDK `issueCredential` signing.
