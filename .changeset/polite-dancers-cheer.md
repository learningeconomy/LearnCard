---
"learn-card-app": patch
"scoutpass-app": patch
"learn-card-base": patch
"@learncard/learn-cloud-plugin": patch
---

fix: [LC-2294] Search complete credential collections, keep visible totals stable, and recover from incomplete loading without misleading empty states.

Keep searching other records and metadata pages when one legacy credential cannot load, while preserving an incomplete, retryable result. Scope shared-credential metadata caches to the reader account, and translate collection status and recovery feedback in LearnCard and ScoutPass with accessible dashboard contrast.

Search older wrapped credentials by displayed and achievement names, keep scrolling after collection totals finish, and refresh only the originating account's affected lists once per bulk save. Localize LearnCard's unavailable category counts with narrow, right-to-left-safe layouts, and preserve live ScoutPass managed-list localization.

Await optimistic list/count updates after saving without making claim completion or contract sync wait for background paginated rescans.
