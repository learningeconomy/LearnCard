---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Tell integrations when a consent category's `shareUntil` date passes. The consentFlowDeadline job now emits an integration-only `consent_updated` event with `reason: "share_until_passed"` (event id `<termsId>:share_until:<category>:<shareUntil>`, one per category and date, no profile notification). The consent stays live; only that category's shared data stops being returned by the data reads. Terms now carry a derived `nextShareUntil` (earliest future `shareUntil` among shared categories, indexed), set by every terms write and filled for existing consents by a one-off, resumable backfill in the same job, so the job never scans all consents.
