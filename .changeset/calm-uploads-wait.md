---
'learn-card-base': patch
'learn-card-app': patch
---

Wait and retry document uploads when extraction capacity is busy, with bounded backoff, cancellation, and localized feedback. Stop waiting on account changes or when the upload screen closes, and preserve results from requests already accepted for extraction.
