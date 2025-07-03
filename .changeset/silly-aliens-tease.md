---
'@learncard/network-brain-service': patch
'@learncard/network-plugin': patch
'@learncard/types': patch
---

Introduces a new optional boolean `allowAnyoneToCreateChildren` on Boost nodes.

When set to `true` on a parent boost:

-   Any profile can create child boosts without possessing the `canCreateChildren` role permission.
-   The permission gate (`canProfileCreateChildBoost`) now short-circuits when this flag is detected.

This change updates:

-   Boost schema & shared types (`@learncard/types`)
-   Brain-service model & access-layer logic (`@learncard/network-brain-service`)
-   Unit and E2E tests to cover the new behaviour.
