---
"@learncard/network-brain-service": patch
---

feat: allow profileId routes to accept DID or profileId

Updates 19 routes across the brain service to accept either a profileId OR a DID (did:web or did:key) for the profileId parameter. Uses the existing `getProfileIdFromString` helper to resolve identifiers, enabling more flexible API usage.
