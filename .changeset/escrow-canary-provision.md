---
'@learncard/escrow-canary': minor
---

Add an operator provisioning tool (`dist/provision.mjs`) that creates canary accounts through the normal user path (email-code login, new SSS key, escrow opt-in or PIN) and writes their secrets with staged, compare-and-swap Secrets Manager updates. Not part of the Lambda bundle.
