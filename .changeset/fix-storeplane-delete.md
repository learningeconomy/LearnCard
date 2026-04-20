---
"@learncard/core": patch
"@learncard/learn-cloud-service": patch
"@learncard/learn-cloud-client": patch
"@learncard/learn-cloud-plugin": patch
---

Added optional `delete` method to the Store Control Plane, allowing storage plugins to support credential deletion. When implemented, this method removes stored credentials and automatically invalidates the read cache.
