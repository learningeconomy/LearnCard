---
'@learncard/types': minor
'@learncard/network-brain-service': minor
---

Support issuer-scoped idempotency keys on ordinary single inbox issuance by reusing the existing durable batch admission, leases and encrypted replay records. Unkeyed and managed-refresh requests retain their existing paths. Keyed ordinary requests require the existing inbox queue configuration.
