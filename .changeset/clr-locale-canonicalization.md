---
"learn-card-base": patch
---

Validate and canonicalize the active locale for all callers, including backend request URLs and payloads as well as CLR date and quantity formatting. Malformed values such as `en_US` or `en--US` now fall back to `en` instead of being stripped and passed through. Valid tags use canonical casing (`EN-us` becomes `en-US`). Validation rejects crafted values containing request delimiters, preserving request-parameter safety.
