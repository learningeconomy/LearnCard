---
"learn-card-base": patch
---

fix: prevent mixed login state on app resume — a transient wallet/private-key reconstruction failure no longer caches a spurious "no profile" result, which previously surfaced "Complete Profile", the age gate, and the JoinNetworkModal for users who had already onboarded
