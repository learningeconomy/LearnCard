---
"@learncard/types": patch
---

Accept nonempty scalar strings for CLR `Association.type`, including `"Association"`, full IRIs, and custom type names, while preserving the existing nonempty string-array contract. This validator checks structural compatibility; strict CLR conformance still requires the official schema's `"Association"` value.
