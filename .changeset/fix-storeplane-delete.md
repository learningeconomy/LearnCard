---
"@learncard/core": patch
"@workspace/e2e-tests": patch
---

Added optional `delete` method to the Store Control Plane, allowing storage plugins to support credential deletion. When implemented, this method removes stored credentials and automatically invalidates the read cache.
