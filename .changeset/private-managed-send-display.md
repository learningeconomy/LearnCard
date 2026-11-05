---
'@learncard/types': minor
'@learncard/network-plugin': patch
'@learncard/helpers': patch
'@learncard/vc-plugin': patch
'@learncard/network-brain-service': patch
---

Keep managed and signed-only send anchors limited to explicit public display metadata, disable request-input telemetry on credential routes, and remove signing-key debug output. Add bounded public update summaries and enumerated update reasons. Managed send request fingerprints now use a versioned server HMAC over public metadata only. The inline template's name is never copied to the anchor, but its category is copied when `display.category` is omitted, since consent-flow write authorization is keyed on a Boost's category and treats an absent one as unrestricted.
