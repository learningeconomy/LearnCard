---
'learn-card-base': patch
'learn-card-app': patch
---

Prepare production for the Web3Auth → SSS migration: point SSS at lca-api's REST base (`/api`), refuse to migrate a key whose DID doesn't match the account (`verifyMigrationIdentity`), re-derive provisional migrations on a new device instead of stranding them, prompt escrow-enrolled accounts without a PIN once per device, and add the `sss-pilot` tenant overlays.
