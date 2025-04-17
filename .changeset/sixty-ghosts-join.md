---
'@learncard/network-brain-service': patch
---

Introduce a new authenticated HTTP endpoint for issuing and sending credentials to consent flow contracts via a registered signing authority.

```http
POST /api/consent-flow-contract/write/via-signing-authority/{contractUri}/{did}
```

Key features:

- Validates the DID and contract URI, ensures the target profile has consented to the contract, and verifies issuer permissions.
- Leverages a registered signing authority to sign credentials (VC or JWE).
- Delivers signed credentials over the network while respecting notification settings and contract terms.
- Mirrors the existing `sendBoostViaSigningAuthority` route for consistency.
- Adds comprehensive end-to-end tests covering the entire credential issuance and delivery flow.
