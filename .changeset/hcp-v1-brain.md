---
'@learncard/network-brain-service': minor
---

Add HCP v1 to the brain service (LC-2419): a versioned `hcp.v1` tRPC router, also under `/hcp/v1/*` in OpenAPI, that implements HCP 2.0 Draft 3 context operations (create, query, get, revise, withdraw), subject-issued grants for agent DIDs, an audit log and export. Categories may be registered or custom (URIs), and errors carry the HCP Core error as `data.hcp` (`{ type, detail }`). Each entry or grant change commits with its audit event in one transaction, and deleting a profile deletes all of its HCP data. v1 keeps its own schemas, service, store and `HcpV1*` Neo4j labels, so a later version can sit beside it and v1 can be removed alone. For a Management Client there is also `hcp.v1.entries.list` (LearnCard addition): the person's own entries plus the Context Subject id to name when creating one, with no audit event.
