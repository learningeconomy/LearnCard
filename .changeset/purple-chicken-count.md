---
"learn-card-app": patch
"learn-card-base": patch
"@learncard/types": patch
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
"@learncard/cli": patch
---

fix: [LC-2288] Recover credential claims in place without false expiration errors or duplicate issuance, preserving confirmed save and refresh progress.

Expose claim reconciliation in CLI method and capability discovery, and require `call --write` because reconciliation can finish acceptance and usage accounting.
