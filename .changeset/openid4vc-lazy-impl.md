---
'@learncard/openid4vc-plugin': patch
---

Load the VCI / VP / SIOP implementation on the first async plugin call instead of at plugin init. The sync parsers stay eager.
