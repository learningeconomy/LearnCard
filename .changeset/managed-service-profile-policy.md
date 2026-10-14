---
"@learncard/network-brain-service": patch
---

fix: [LC-2225] Separate managed organizations from child consent and sharing restrictions. Preserve guardian approval history and explicitly typed children's protections, including legacy records with a service flag. Keep organization creation supported while rejecting service flags on Family and explicitly typed child creation paths.

Keep guardian-gated consent writes aligned with read and share policy for legacy service-flagged children, and prevent those children from changing their own profile type to evade protection.
