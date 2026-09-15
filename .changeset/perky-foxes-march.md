---
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
"@learncard/lca-api-service": patch
---

feat: [LC-2155] - Eliminate CertifiedBoostCredential wrapper

Direct credentials use their signed Boost network URI for the trusted-network check.
Plaintext sends reject mismatched Boost IDs. Encrypted signing-authority issuance
includes all subjects and, for delegated consent AutoBoosts, the contract owner.

Compatibility limitation: pre-signed `signedCredential` payloads (both plaintext and
client-encrypted) are stored unchanged, without a server-generated wrapper or status
entries. This includes plaintext credentials from older SDKs or third-party issuers
that omit `credentialStatus`. Without embedded status entries or server-retained status
coordinates, network revocation changes the recipient relationship only and is not
reflected by a holder's `verifyCredential` call. Such integrations must publish their
own signed status-list updates or use server-managed signing-authority issuance with
a VC v2 template. Storage now warns for both plaintext and encrypted credentials when
status metadata is missing or empty, including VC v1 issuance results.
