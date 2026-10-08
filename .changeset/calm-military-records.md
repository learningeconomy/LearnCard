---
"learn-card-app": patch
"@learncard/credential-library": patch
---

Add a shared CLR renderer with academic, military, and neutral fallback layouts, reusable record sections, and a comprehensive military fixture.

Collection layout selection is intentionally conservative: course counts, credits,
and terms alone no longer select academic. Without an academic title, explicit GPA
or degree evidence is required in a collection whose children all have compatible
academic types; untyped children, certificates, licenses, and memberships fall back
to the general view. Explicit academic titles retain the academic view. Military
record titles include Joint Services Transcript, AARTS, CCAF Transcript, and service
branch record titles. No classification is derived from issuer names or child text.
