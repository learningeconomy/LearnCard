---
'learn-card-app': patch
'learn-card-base': patch
'@learncard/network-brain-service': patch
'@learncard/network-plugin': patch
---

fix: [LC-2371] Sync uploaded, pasted, and Partner Connect credentials to live consent contracts. Shared store/add/bulk-save callers retain successful saves when consent discovery or sharing fails, with durable, account-scoped retries. Partner Connect returns after queuing delivery; AI Topic/Session saves keep their previous sharing opt-out. Persist acknowledged terms to avoid duplicate mutations on retry and cancel retries after recategorization. Automatic sharing remains limited to LearnCloud-indexed credentials; SQLite-only sharing is not supported.

Keep background discovery out of contract-sync banners, and keep contract-scoped Partner Connect status syncing until that account's queued credential deliveries finish. Persist only credential identifiers and category in delivery jobs.

Persist failed contract destinations so an exhausted credential delivery reports an error only to affected partners. Unattributed failures remain visible in account-wide status without blocking unrelated contracts indefinitely.

Guard automatic deliveries against current category consent at the server write while preserving explicit selective sharing. Uploads persist account-scoped delivery jobs immediately after successful indexing, before network sharing starts.

Treat blank legacy category expiries as no expiry while preserving the server's automatic-sharing consent and expiry guards.

Persist pending delivery updates transactionally across tabs, retain legacy retry checkpoints, and recover abandoned attempts without losing other saved credentials. Successful background delivery reports completed progress.

Initialize cross-tab notifications only when browser event APIs are available, preserving credential-helper imports in storage-only environments.
