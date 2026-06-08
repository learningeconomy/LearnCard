---
"learn-card-base": minor
"learn-card-app": patch
---

Add prettifyVerificationItems helper to humanize raw SD-JWT-VC verification check codes (parse, disclosure_hash_integrity, issuer_resolved, issuer_signature, vct, expiration) and W3C VC check codes (proof, credentialStatus, credentialSchema) into user-friendly labels in the Credential Verifications display. Idempotent — already-prettified items pass through unchanged. Applied in useVerifyCredential and BoostPreview.useVerification.
