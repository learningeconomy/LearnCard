---
"@learncard/types": patch
"@learncard/network-plugin": patch
"@learncard/helpers": patch
"@learncard/network-brain-service": patch
---

Use server-bound public status coordinates for managed credential sends, preserving status descriptors across credential versions. Add the managed status repair contract.

Gate preparation-time status binding on client capability so existing clients can continue allocating status coordinates before signing. Preserve the selected mode across idempotent retries.
