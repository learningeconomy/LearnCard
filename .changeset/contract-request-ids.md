---
'@learncard/types': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
'@learncard/network-plugin': minor
'@learncard/cli': patch
'learn-card-base': patch
---

**Breaking:** `sendContractRequest` now returns `{ requestId, status }` instead of `true`.

Add `getContractRequest(contractUri, requestId)` to read one contract request by its request ID, and let `cancelContractRequest` take `{ requestId }` instead of a target profile ID. `getContractSentRequests` rows gain `target` and may omit `profile`.

Prepare for requests addressed to an email: a request marked `addressedByEmail` shows only the email to other parties until it is accepted, in `getContractRequest`, `getContractSentRequests`, `getRequestStatusForProfile` and the decision notifications. Request status gains `expired`.
