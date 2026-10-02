---
"learn-card-app": minor
"@learncard/openid4vc-plugin": patch
---

Add opt-in encrypted verifier history with recording controls, bounded retention and exact deletion. Keep receipts outside credential indexes and suppress capture before viewing private history.

OID4VP transport errors now expose stable codes and HTTP status without response URLs, fetch causes, verifier status text or response bodies. Consumers that previously inspected `VpSubmitError.body` or `.cause` must use `code` and `status`; successful submission responses still expose `body`.
