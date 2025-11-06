---
'@learncard/network-brain-service': patch
---

Improve auto-connect behavior and fix Cypher aggregation

- Connect recipients across descendant boosts when a parent boost has `autoConnectRecipients` enabled.
- Fix Cypher aggregation in write-time connection computation by splitting collection steps.
- Store `CONNECTED_WITH` sources as `boost:<parentId>` so toggling `autoConnectRecipients` off removes only those edges.
- Slightly more work at write-time to simplify and speed up read-time connections.
