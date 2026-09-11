---
'@learncard/types': patch
'@learncard/network-brain-service': patch
'@learncard/partner-connect': patch
'learn-card-base': patch
'learn-card-app': patch
---

Return live, unexpired consent metadata for server-side AI authorization, preserving original adult grants and exposing current manager-backed guardian approval for child profiles. Record verified guardian approval with consent terms and audit transactions; require reapproval for legacy child grants or changed contracts. Bind client approval caching and request headers to the specific child, and prevent failed signing from authorizing a guarded action.

Require current app-owned consent when resolving learner context, including credential sharing exclusions and withdrawn or expired grants. The formatter client sends only selected storage URIs and personal-field names to the configured AI service, refreshes consented data for each request, and exposes the server's consent revision and cache metadata. Remove browser prompt caching and legacy DID-based AI authentication; invalidate sessions and WebSocket tickets across wallet or service changes, including in-flight negotiations.

Refresh guardian approval at final consent submission if it expired while editing. Issue standards-valid signed credentials in the learner-context benchmark so the formatter exercises real proof verification rather than accepting unverifiable fixtures.
