# @learncard/smoketests

## 0.0.3

### Patch Changes

- [#1952](https://github.com/learningeconomy/LearnCard/pull/1952) [`6404c1106a5b9b35c3f6ee34d021b0b596f334fd`](https://github.com/learningeconomy/LearnCard/commit/6404c1106a5b9b35c3f6ee34d021b0b596f334fd) Thanks [@Custard7](https://github.com/Custard7)! - lca-api: when `ESCROW_ENCLAVE_MODE=remote` but `ESCROW_ENCLAVE_REMOTE_URL`/`ESCROW_ENCLAVE_REMOTE_TOKEN` is missing, log a distinctive error once per container (cold start included, values never logged) and emit `LearnCard/Escrow EnclaveFailure` with `Reason=remote_config_missing`. Smoketests probe `/api/keys/escrow/attestation` on staging and production. Canary docs: both environments use the 7-day hold (`tier3_hold_duration_ms` now validated), observed drill timings, rollout record.

## 0.0.2

### Patch Changes

- [#1156](https://github.com/learningeconomy/LearnCard/pull/1156) [`8febdde50a0b7405ba2be98b72071e6c9cf5d515`](https://github.com/learningeconomy/LearnCard/commit/8febdde50a0b7405ba2be98b72071e6c9cf5d515) Thanks [@goblincore](https://github.com/goblincore)! - feat(tests): read-only Playwright smoketests for staging/prod (LC-1732)
