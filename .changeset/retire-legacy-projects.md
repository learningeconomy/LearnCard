---
'@learncard/cli': patch
'@learncard/lca-api-client': patch
'@learncard/lca-api-plugin': major
'@learncard/lca-api-service': patch
---

Retire the legacy CHAPI example, MetaMask Snap projects, Discord bot, and Simple Signing service, client, and plugin.

Managed signing authority consumers now use `@learncard/lca-api-plugin`. Replace `getSimpleSigningPlugin(learnCard, endpoint)` with `getLCAPlugin(learnCard, endpoint)`. Historical implementations remain available through Git history.
