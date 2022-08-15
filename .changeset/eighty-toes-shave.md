---
'@learncard/react': patch
---

Use `emptyWallet` to instantiate a `LearnCard` in `VCCard`

Previously, this component was providing dummy key material and instantiating a full-blown `LearnCard`
object even though it only made use of verification functionality. Now, it calls `emptyWallet` and
instantiates a much smaller `LearnCard` without needing to provide dummy key material
