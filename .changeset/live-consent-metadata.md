---
'@learncard/types': patch
'@learncard/network-brain-service': patch
'learn-card-base': patch
'learn-card-app': patch
---

Return live, unexpired consent metadata for server-side AI authorization, preserving original adult grants and exposing current manager-backed guardian approval for child profiles. Record verified guardian approval with consent terms and audit transactions; require reapproval for legacy child grants or changed contracts. Bind client approval caching and request headers to the specific child, and prevent failed signing from authorizing a guarded action.
