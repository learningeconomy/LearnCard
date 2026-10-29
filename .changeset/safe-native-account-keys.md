---
'learn-card-base': patch
---

Keep native cached private-key restoration scoped to the active account. Reject ambiguous stored keys before account identity is available while preserving shared SQLite connection ownership.
