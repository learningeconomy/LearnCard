---
'@learncard/types': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': minor
'@learncard/network-plugin': minor
'@learncard/helpers': patch
---

Add an optional `exclude` filter to managed boost pagination. Omit boosts with a matching name or category before selecting a page. Each exclusion accepts an exact string, a list, or a regular expression. Missing field values remain eligible, and exact exclusions preserve slash-delimited strings over tRPC. Existing queries retain their matching behavior.
