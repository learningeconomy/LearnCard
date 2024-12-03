---
'@learncard/network-brain-service': patch
'@learncard/network-brain-client': patch
'@learncard/network-brain-plugin': patch
'@learncard/types': patch
---

-   Don't give default claim role if profile already has a role
-   Allow profiles who can resolve parents to resolve children
-   Return default claim permissions from `getBoost`
-   Fix `generateClaimLink` permissions check
-   Actually allow `$regex` to work via `superjson` with tRPC, regex strings with HTTP API
-   Allow querying boost recipients
