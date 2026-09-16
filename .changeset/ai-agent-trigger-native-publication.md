---
'@learncard/ai-agent-service': patch
---

Wait for the exact native DIDKit package and Linux binding to be published and loadable before deploying Trigger tasks, preventing production releases from racing the separate native-package publishing workflow. Keep workspace development exports scoped to bundling so the deployed Node worker loads compiled native-package JavaScript instead of raw TypeScript.
