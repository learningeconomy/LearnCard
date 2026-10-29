---
'learn-card-base': patch
---

Keep native cached private-key restoration scoped to the active account. Restore duplicate rows only when they contain a single distinct key, and reject conflicting keys. If a UID lookup has no key, require authentication or recovery rather than restoring an email-only legacy key.
