---
"@learncard/network-plugin": patch
---

fix(network-plugin): load the trusted Boost registry lazily, once, with a 5 s timeout so it never blocks LearnCard init
