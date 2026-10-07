---
"learn-card-base": patch
---

Replace the regex-based trailing-slash trim in the Keycloak auth provider's authority-URL construction with a linear-time character loop, resolving a CodeQL polynomial-ReDoS finding. Behavior is unchanged.
