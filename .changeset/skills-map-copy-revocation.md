---
'learn-card-base': patch
'learn-card-app': patch
---

Skills map and skill counts now drop LearnCloud copies whose network credential was revoked on LearnNetwork with no status list. Copies record the network credential they came from (`networkUri`) and their status is checked through it. A status check that comes back unclear no longer brings back skills from a credential already seen revoked, including when the credential briefly fails to load. Only credentials that carry skills are checked, and status-list results are reused for five minutes or until a revoke or suspend clears them.
