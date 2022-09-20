---
'@learncard/core': minor
---

New Plugin: VC Templates

- Allows creating new credentials/presentations easily based on pre-defined templates

New methods: newCredential and newPresentation

- `wallet.newCredential()` is identical to `wallet.getTestVc()`
- `wallet.newCredential({ type: 'achievement' })` will provide you with a _different_ credential, and 
its fields are overwriteable via arguments passed to that function.
E.g. `wallet.newCredential({ type: 'achievement', name: 'Nice!' })`
