---
'@learncard/network-brain-service': patch
---

Commit app credential activity and delivery together to avoid competing Neo4j writes and partial audit records. Enqueue recipient notifications only after the database transaction commits.
