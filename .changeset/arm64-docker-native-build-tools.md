---
'@learncard/network-brain-service': patch
'@learncard/learn-cloud-service': patch
'@learncard/lca-api-service': patch
---

Install python3, make, and g++ during `bun install` in the shared monorepo Docker image so linux/arm64 builds can compile native addons (utf-8-validate) via node-gyp.
