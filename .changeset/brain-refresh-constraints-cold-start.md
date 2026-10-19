---
"@learncard/network-brain-service": patch
---

Run the credential refresh constraints before the index setup on cold start instead of alongside it, and retry transient schema errors the same way the index setup does.
