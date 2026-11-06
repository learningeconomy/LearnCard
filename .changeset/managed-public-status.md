---
"@learncard/types": patch
"@learncard/network-plugin": patch
"@learncard/helpers": patch
"@learncard/network-brain-service": patch
---

Use server-bound public status coordinates for managed credential sends, preserving status descriptors across credential versions. Add the managed status repair contract.

Support external HTTPS Bitstring Status Lists for managed issuance, publication and repair without reserving external indexes. Preserve template-provided status descriptors and report statusManagement separately from the signed refresh receipt. Managed lifecycle actions on external entries fail with a provider-specific precondition error rather than reporting a network-only revocation or suspension.

Gate preparation-time status binding on client capability so existing clients can continue allocating status coordinates before signing. Preserve the selected mode across idempotent retries.
