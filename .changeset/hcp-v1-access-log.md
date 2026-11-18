---
'@learncard/network-brain-service': minor
'learn-card-app': minor
---

Add the HCP v1 access log (LC-2422). Every `hcp.v1.entries.query` and `entries.get` now records a Draft 3 `context.read` event with what it disclosed (entry ids, versions, `useUntil`), its purpose and retrieval id, before returning; if the event cannot be recorded, the read fails. A client refused a read under its own grant records the LearnCard event `https://learncard.com/hcp/v1/events/read-denied` (`data.reason: 'outside-grant'`); another app presenting that grant is logged too (`data.reason: 'not-grant-client'`) and gets the same `scope-denied`. `audit.list` returns both to the person, and the app's Activity tab shows them as plain sentences, such as "Demo Tutor saw your Goals and Learning".
