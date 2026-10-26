---
"@learncard/network-plugin": patch
---

Deduplicate concurrent lookups of the same profile within a network client, while keeping subsequent reads fresh and allowing failed lookups to retry.
