---
'learn-card-app': patch
'learn-card-base': patch
---

fix: [LC-2371] Sync uploaded, pasted, and Partner Connect credentials to live consent contracts. Shared store/add/bulk-save callers retain successful saves when consent discovery or sharing fails, with durable, account-scoped retries. Partner Connect returns after queuing delivery; AI Topic/Session saves keep their previous sharing opt-out. Persist acknowledged terms to avoid duplicate mutations on retry and cancel retries after recategorization. Automatic sharing remains limited to LearnCloud-indexed credentials; SQLite-only sharing is not supported.

Keep background discovery out of contract-sync banners, and keep contract-scoped Partner Connect status syncing until that account's queued credential deliveries finish. Persist only credential identifiers and category in delivery jobs.

Persist failed contract destinations so an exhausted credential delivery reports an error only to affected partners. Unattributed failures remain visible in account-wide status without blocking unrelated contracts indefinitely.
