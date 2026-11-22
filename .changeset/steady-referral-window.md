---
'@learncard/network-brain-service': minor
'@learncard/network-plugin': patch
---

Allow a new contract request after denial, cancellation, or the end of an accepted consent. Give each sender separate rolling 30-day allowances for direct requests and email attachments to the same profile and contract. Each allowance defaults to three. Exact pending retries reuse the current request ID. Direct sends preserve a different sender’s pending email invitation. Learners can review and act on each request by ID.
