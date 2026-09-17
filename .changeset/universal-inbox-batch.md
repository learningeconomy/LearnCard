---
'@learncard/types': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
---

Add Universal Inbox batch issuance through `sendCredentialBatchViaInbox`, tRPC
`inbox.issueBatch`, and `POST /inbox/issue-batch`, with public batch input and result
validators/types, shared configuration defaults, ordered per-item outcomes, and
24-hour issuer-scoped idempotency keys. Later duplicate keys in one batch conflict
deterministically. Completed issuances include reconciliation IDs if replay storage
cannot be confirmed; side-effect-free preflight failures release their keys.

Enforce a 4 MiB JSON payload budget and atomic batch quota admission without
charging rejected batches. Use shared Redis for deployed instances and run the
atomic cache contract against real Redis in CI. Lambda batches remain subject to
the 29-second request timeout and must be chunked according to measured latency.

The existing single-issue route now accepts `configuration.guardianEmail`, exposing
guardian approval to single-issue clients. Both routes reject guardian self-approval
case-insensitively. Rate-limit errors use `TOO_MANY_REQUESTS` (HTTP 429); remove stale
TypeScript casts to `BAD_REQUEST` from existing callers. Those casts did not change
the runtime status code.
