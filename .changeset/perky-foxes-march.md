---
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
"@learncard/lca-api-service": patch
"@workspace/e2e-tests": patch
---

feat: [LC-2155] - Eliminate CertifiedBoostCredential wrapper

Direct credentials use their signed Boost network URI for the trusted-network check.
Plaintext sends reject mismatched Boost IDs. Encrypted signing-authority issuance
includes all subjects and, for delegated consent AutoBoosts, the contract owner.

Compatibility limitation: client-encrypted `signedCredential` payloads are stored
unchanged, without a server-generated wrapper or status entries. Without server-retained
status coordinates, network revocation changes the recipient relationship only and
is not reflected by a holder's `verifyCredential` call. Such integrations must publish
their own signed status-list updates or use server-managed signing-authority issuance.
Encrypted storage now warns when status metadata is missing.
