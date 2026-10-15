---
"@learncard/network-brain-service": minor
---

Move skill-matching embeddings from Google `gemini-embedding-001` (768-d) to Amazon Nova 2 Multimodal Embeddings on Bedrock (`amazon.nova-2-multimodal-embeddings-v1:0`, us-east-1, 1024-d). Skills are indexed with `GENERIC_INDEX` and search queries use `TEXT_RETRIEVAL`; vectors are written to a new versioned Neo4j property and vector index side by side with the legacy index, the query-embedding cache key now includes model and dimension, and a locked, resumable backfill (`skill-embeddings:backfill`) re-embeds existing skills. `@google/genai` and the `SKILL_EMBEDDING_GOOGLE_*` settings are removed (LC-2206).
