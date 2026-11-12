---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

LC-2254: Route OpenSALT issuer-registry lookups through an allowlisted same-origin Netlify edge proxy (`/api/registry-proxy`) on web and native, so OpenSALT-listed issuers no longer show as unknown because of CORS. Falls back to the direct request, and never marks an issuer trusted on failure.
