---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Credential-index refreshes no longer block the operation that triggered them (LC-2383). Raw JSON imports resolve as soon as the index write lands, inbox finalize/recovery completes its sync without waiting on the skills and IDs refetches (the list and counts are still awaited), and revoked-credential cleanup finishes its troop-ID refresh while the index refetches run in the background.
