---
"learn-card-app": minor
"@learncard/openid4vc-plugin": patch
---

Add opt-in encrypted verifier history with recording controls, bounded retention and exact deletion. Keep receipts outside credential indexes and suppress capture before viewing private history.

OID4VP transport errors now expose stable codes and HTTP status without response URLs, fetch causes, verifier status text or response bodies. Consumers that previously inspected `VpSubmitError.body` or `.cause` must use `code` and `status`; successful submission responses still expose `body`.


Capture consent from an owner-encrypted local snapshot without pre-send Cloud reads. Quarantine unreadable history, allow exact-ID recovery Clear, preserve future-dated/recent other-generation receipts, and share live eligibility/cancellation guards across flows. Known JARM failures expose an allowlisted `jarmCode`; unexpected response preparation failures use `internal_error` without private causes.
