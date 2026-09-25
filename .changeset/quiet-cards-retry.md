---
"@learncard/network-brain-service": patch
"@learncard/network-plugin": patch
"@learncard/types": patch
---

Make `acceptPresentation` idempotent so retries of a saved collection do not create duplicate relationships. New or replacement share-link passcodes require at least eight characters; existing shorter passcodes remain valid for recipients. Public share resolution can now return `try_later` when passcode verification is unavailable or throttled.
