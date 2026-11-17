---
'learn-card-base': patch
'learn-card-app': patch
---

[LC-2433] Identify the LaunchDarkly user once per context instead of on every app render, so a cold start no longer cancels its own flag requests and user-targeted flags load.
