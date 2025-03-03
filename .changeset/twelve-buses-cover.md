---
'@learncard/network-brain-service': patch
'@learncard/types': patch
'@learncard/network-plugin': patch
---

Add ADD_ADMIN Claim Hook type that automatically grants admin privileges when claiming a boost. This enables:

- Automatic admin role assignment for target boosts when claiming a source boost
- Requires admin permissions on both source and target boosts to create hook
- Cascading deletion when either boost is removed
- Validation of admin permissions hierarchy during hook creation
