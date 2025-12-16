---
'@learncard/simple-signing-service': minor
'@learncard/simple-signing-client': minor
'@learncard/learn-cloud-service': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': minor
'@learncard/learn-cloud-client': minor
'@learncard/simple-signing-plugin': minor
'@learncard/nx-run-command': minor
'@learncard/network-plugin': minor
'@learncard/lca-api-service': minor
'@learncard/claimable-boosts-plugin': minor
'@learncard/did-web-plugin': minor
'@learncard/dynamic-loader-plugin': minor
'@learncard/lca-api-plugin': minor
'@learncard/linked-claims-plugin': minor
'@learncard/open-badge-v2-plugin': minor
'@learncard/vc-templates-plugin': minor
'@learncard/learn-cloud-plugin': minor
'@learncard/snap-chapi-example': minor
'@learncard/helpers': minor
'@learncard/encryption-plugin': minor
'@learncard/expiration-plugin': minor
'@learncard/learn-card-plugin': minor
'@learncard/types': minor
'@learncard/ethereum-plugin': minor
'@learncard/react': minor
'learn-card-base': minor
'@learncard/core': minor
'@learncard/init': minor
'@learncard/ceramic-plugin': minor
'@learncard/lca-api-client': minor
'@learncard/crypto-plugin': minor
'@learncard/didkey-plugin': minor
'@learncard/didkit-plugin': minor
'@learncard/vc-api-plugin': minor
'@learncard/chapi-example': minor
'@learncard/chapi-plugin': minor
'@learncard/vpqr-plugin': minor
'@learncard/idx-plugin': minor
'learn-card-app': minor
'@learncard/vc-plugin': minor
---

Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

This includes follow-up fixes for Zod v4 behavior and typing changes:

-   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
-   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
-   Allow `Infinity` for generational query inputs in brain-service routes.
-   Document running Vitest in non-watch mode (`pnpm test -- run`).
