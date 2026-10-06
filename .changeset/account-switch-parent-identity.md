---
"learn-card-base": patch
---

Preserve the parent's displayed profile image across account switches. Refresh the destination profile query without overwriting the source account's cache or delaying switch completion on a profile-read failure.

Keep explicitly typed children classified as children when switching accounts, even if a legacy record has the service-profile flag.
