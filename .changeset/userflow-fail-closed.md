---
"learn-card-app": patch
---

Userflow fails closed: if the tenant config cannot be resolved, no Userflow project is loaded (previously it fell back to LearnCard's tokens).
