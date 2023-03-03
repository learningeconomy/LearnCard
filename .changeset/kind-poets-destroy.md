---
"@learncard/core": patch
"@learncard/types": patch
"@learncard/network-plugin": minor
"@learncard/meta-mask-snap": patch
"@learncard/network-brain-service": minor
---

- Updates LCN Brain to wrap VCs in a `CertifiedBoost` VC when using `sendBoost`, and verifying that the VCs use the boostId, and verify that the sender is authorized to issue the boost + that the credential matches the boost credential.
- Updates LCN Plugin to append boostId to a boost VC when calling `sendBoost()`
- Adds `getBoostRecipients` function to LCN Brain + LCN Plugin so you can retrieve a list of boost recipients
- Adds new `boost` type to `learnCard.invoke.newCredential({ type: 'boost' })` to VC Templates Plugin
- Adds new VC Verification plugin, extending `learnCard.invoke.verifyCredential()` so it will verify a CertifiedBoost VC with a registry of trusted CertifiedBoost verifiers 
- Add tests for LCN Plugin + VerifyBoost Plugin
- Add tests for `sendBoost` for LCN Brain
- Add tests for `getBoostRecipients` for LCN Brain
