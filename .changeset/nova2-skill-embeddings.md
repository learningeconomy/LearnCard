---
"@learncard/network-brain-service": minor
---

Add Amazon Nova 2 Multimodal Embeddings on Bedrock (`amazon.nova-2-multimodal-embeddings-v1:0`, us-east-1, 1024-d) for skill matching, side by side with the legacy Google `gemini-embedding-001` (768-d) index. With `SKILL_EMBEDDING_BEDROCK_ENABLED`, new and updated skills get Nova vectors (`GENERIC_INDEX`) in a versioned Neo4j property and vector index, and a locked, resumable backfill (`skill-embeddings:backfill`) re-embeds existing skills; legacy Google writes continue unchanged. Semantic search keeps reading the legacy index with Google query embeddings until `SKILL_EMBEDDING_BEDROCK_READ_ENABLED=true` switches it to the Nova index with `TEXT_RETRIEVAL` query embeddings; setting it back to `false` is the rollback. Query-embedding cache keys are scoped by model (and, for Nova, dimension and scheme), so the two read paths never share cached vectors (LC-2206).
