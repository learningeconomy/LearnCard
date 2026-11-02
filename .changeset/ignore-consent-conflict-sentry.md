---
'@learncard/network-brain-service': patch
---

Stop reporting expected `CONFLICT` tRPC errors (like re-consenting to a contract you've already consented to) to Sentry, the same way `BAD_REQUEST`, `NOT_FOUND` and `FORBIDDEN` are already filtered.
