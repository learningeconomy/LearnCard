---
'scoutpass-app': patch
---

Fix ScoutPass's SSS key-derivation factory never receiving the resolved tenant. `getResolvedTenantConfig` was called without being imported, and a catch-all swallowed the resulting `ReferenceError`, so the SSS strategy always ran with no `tenantId`. It now sends `X-Tenant-Id: scoutpass` to lca-api, so recovery / OTP emails are ScoutPass-branded even from native builds (whose `localhost` origin otherwise resolves to LearnCard). Escrow stays off. ScoutPass currently ships with `keyDerivation: 'web3auth'`, so this only takes effect once ScoutPass switches to SSS.
