---
'@learncard/service-config': patch
'@learncard/lca-api-service': patch
'@learncard/network-brain-service': patch
'@learncard/learn-cloud-service': patch
---

Select backend stage files by tenant as well as stage. `CONFIG_TENANT=scouts` loads `config.scouts.<stage>.json` (generated from the live ScoutPass Lambdas), so ScoutPass deployments no longer inherit LearnCard domains, trust settings or seed-encryption flags; a named tenant without a stage file fails closed. `ESCROW_ENCLAVE_MODE` is now forwarded in runtime-secrets bundle mode too.
