---
'@learncard/types': minor
'@learncard/network-plugin': patch
'@learncard/vc-plugin': patch
'@learncard/network-brain-service': patch
---

Keep managed and signed-only send anchors limited to explicit public display metadata, disable request-input telemetry on credential routes, and remove signing-key debug output. Add bounded public update summaries and enumerated update reasons. Managed send request fingerprints now use a versioned server HMAC over public metadata only.
