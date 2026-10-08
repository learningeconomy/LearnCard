---
"@learncard/types": minor
"@learncard/network-plugin": minor
"@learncard/network-brain-client": patch
"@learncard/network-brain-service": minor
"@learncard/ler-rs-plugin": patch
"learn-card-app": patch
---

Publish Resume Builder PDFs through version-bound encrypted managed attachments. Add owner chunk staging/cleanup and guarded recipient retrieval, preserve atomic share lifecycle and passcode protection, and keep original selected credential contexts and proofs intact inside LER-RS records.

LER-RS `verifications` now uses JSON-LD `@json` so embedded original credentials retain their contexts and proofs. This changes canonicalization for newly issued LER-RS credentials; it does not rewrite or re-sign embedded source credentials.
