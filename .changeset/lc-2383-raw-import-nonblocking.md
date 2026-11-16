---
'learn-card-app': patch
'scoutpass-app': patch
---

Raw JSON imports refresh the credential-index queries in the background, so an import or raw claim resolves as soon as the index write lands instead of waiting for the skills, IDs and count refetches (LC-2383).
