---
'@learncard/lca-api-plugin': minor
'@learncard/lca-api-service': minor
'learn-card-app': patch
---

Transcript issuers can say how long delivery will take. An accepted transcript request response may include `expectedInSeconds` or an ISO 8601 `expectedBy`; lca-api stores it and returns it as an additive `expectedBy` field from `transcripts.request` and `transcripts.getStatus` (and the plugin's `transcriptsRequest` / `transcriptsGetStatus` types). Malformed, past or more than 30-day estimates are ignored. The app keeps its live steps for estimates of 30 seconds or less, shows a progress bar with the time left for estimates up to 5 minutes, and for longer ones confirms the request and when to expect it. The School Connect card shows the same estimate and only offers manual recovery once the estimate has passed.
