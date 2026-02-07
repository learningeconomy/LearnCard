---
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
'@learncard/types': minor
---

Add semantic skill search backed by embeddings.

The brain service now generates and stores vector embeddings for skills and exposes semantic search over skills using Neo4j vector queries. Embeddings are generated via Google Gemini embeddings (`gemini-embedding-001`) with configurable batching for efficient backfills, and backfill execution can be safely toggled via environment variables.

This also adds the typed semantic search route and plugin method so SDK consumers can call semantic skill search directly through the network plugin.
