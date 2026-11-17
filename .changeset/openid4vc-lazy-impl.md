---
'@learncard/openid4vc-plugin': patch
---

Load the VCI / VP / SIOP implementation on the first async plugin call instead of at plugin init. The sync parsers stay eager. A failed load (for example a stale chunk after a deploy) is retried once and never cached: if the retry fails too, the call rejects with the original import error and the next call loads again.
