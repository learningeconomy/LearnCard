---
'learn-card-base': patch
---

Reserve document-upload capacity with bodyless requests before transferring the file, keeping busy retries from repeatedly sending document bytes. Bind the upload to its reservation's Fly machine and release abandoned reservations on cancellation when possible.
