---
"learn-card-base": patch
---

Tighten types in the Keycloak auth provider and sign-in adapter: guard the nullable `ErrorResponse.error` code before comparing it, and give the pending sign-in attempt an explicit accessor so TypeScript doesn't narrow it to `never` across the redirect-completion closure.
