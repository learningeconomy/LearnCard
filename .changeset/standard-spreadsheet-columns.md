---
"learn-card-app": patch
"@learncard/helpers": minor
"@learncard/types": patch
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
---

Import spreadsheets from the Issue import modal and choose column mappings for independent grades, numeric credits, standard Evidence, awarded dates, and description text. Preserve source cells across type changes, zero credits across editor round trips, and the original awarded date independently of issuance time. Use shared field materialization in previews, queued issuance, and local profile signing without modifying signed credentials.

The network plugin and brain-service now coerce declared OBv3/CLR credit fields to finite numbers and normalize awarded dates to UTC before signing. Blank credit fields are omitted; malformed nonblank fields are rejected (BAD_REQUEST in brain-service). Calendar days use midnight UTC, while timestamps require complete seconds and an explicit timezone. Offset spelling is normalized while preserving the instant; signed credentials are left unchanged.
