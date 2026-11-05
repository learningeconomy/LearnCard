---
'@learncard/lca-api-service': patch
'@learncard/smoketests': patch
'@learncard/escrow-canary': patch
---

lca-api: when `ESCROW_ENCLAVE_MODE=remote` but `ESCROW_ENCLAVE_REMOTE_URL`/`ESCROW_ENCLAVE_REMOTE_TOKEN` is missing, log a distinctive error once per container (cold start included, values never logged) and emit `LearnCard/Escrow EnclaveFailure` with `Reason=remote_config_missing`. Smoketests probe `/api/keys/escrow/attestation` on staging and production. Canary docs: both environments use the 7-day hold (`tier3_hold_duration_ms` now validated), observed drill timings, rollout record.
