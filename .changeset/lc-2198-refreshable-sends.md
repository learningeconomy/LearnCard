---
'@learncard/network-plugin': major
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/vc-plugin': patch
'@learncard/network-brain-service': patch
---

Managed refreshable sends through the standard send paths (LC-2198). `send({ type: 'boost', refresh: true })` now issues refreshable credentials for profile/DID recipients: with local signing the SDK asks the server to run every managed-send guard, create or reuse the boost and allocate the managed refresh service in one step, injects the service (with its inline JSON-LD context) before signing, and hands the signed credential to the server's unified send so activity/contract behavior and the canonical receipt are preserved; without local signing the request is served by the signing-authority path. Email/phone recipients always reject before anything is created.

`sendBoost` with literal `{ enableRefresh: true }` now returns `{ credentialUri, refresh }` instead of a plain URI string, where `refresh` is the metadata-only issuance receipt (refreshId, refreshService, credentialId, issuerDid, holderDid, credentialStatus) needed to publish future versions via `publishCredentialRefresh`. Legacy callers — boolean options, omitted options, or object options without `enableRefresh` — still receive the credential URI string; a dynamically typed `enableRefresh` degrades the result to `string | { credentialUri, refresh }`. Managed encryption remains holder-only and mandatory even when `encrypt: false`.

`@learncard/types` adds the `ManagedCredentialRefreshReceipt` validator plus optional `refresh` on the unified send input/response validators; `@learncard/helpers` adds the shared managed context preparation helpers (`prepareManagedRefreshContext`, `injectManagedRefreshService`) now also used by SDK `issueCredential` signing.

Refreshable `send` accepts an optional `idempotencyKey` so a whole call can be retried without duplicating the boost, refresh allocation or delivery.

Completed-send comparisons canonicalize nested result keys so equivalent receipts remain idempotent regardless of property insertion order. Keyed sends reuse the recipient validation already performed in the request.

Signing a credential with a managed refresh service now rejects conflicting inline JSON-LD term definitions (including `authorization`) instead of producing a credential whose refresh terms are not correctly signed. Credentials without a managed service are unaffected.

Managed send and refresh publication recover from a stale local issuer DID document after signing-authority registration: if proof verification fails, the server refreshes the authenticated issuer's document and verifies once more without relaxing signature checks.
