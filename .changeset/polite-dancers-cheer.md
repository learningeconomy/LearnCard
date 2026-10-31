---
"learn-card-app": patch
"scoutpass-app": patch
"learn-card-base": patch
"@learncard/learn-cloud-plugin": patch
---

fix: [LC-2294] Search complete credential collections, keep visible totals stable, and recover from incomplete loading without misleading empty states.

Keep searching other records and metadata pages when one legacy credential cannot load, while preserving an incomplete, retryable result. Scope shared-credential metadata caches to the reader account, and translate collection status and recovery feedback in LearnCard and ScoutPass with accessible dashboard contrast.
