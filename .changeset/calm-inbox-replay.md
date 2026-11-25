---
'@learncard/types': minor
'@learncard/network-brain-service': minor
---

Support issuer-scoped idempotency keys on ordinary single inbox issuance by reusing the existing durable batch admission, leases and encrypted replay records. Unkeyed and managed-refresh requests retain their existing paths. Keyed ordinary requests require the existing inbox queue configuration. Each keyed request keeps one durable decision (a new `InboxBatchRequest` node with a uniqueness constraint on `id`, created on start like the existing inbox batch constraints; no existing data is rewritten): of the items admitted for a request before a delivery, a refusal or a replayed success, at most one may issue, and the decision is removed only after every job of the request is gone.
