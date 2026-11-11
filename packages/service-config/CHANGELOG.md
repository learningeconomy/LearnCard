# @learncard/service-config

## 0.1.1

### Patch Changes

- [#1670](https://github.com/learningeconomy/LearnCard/pull/1670) [`7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2`](https://github.com/learningeconomy/LearnCard/commit/7656a57d30c6d80b8a25a8bb14bcd3b08b3648c2) Thanks [@Custard7](https://github.com/Custard7)! - Select backend stage files by tenant as well as stage. `CONFIG_TENANT=scouts` loads `config.scouts.<stage>.json` (generated from the live ScoutPass Lambdas), so ScoutPass deployments no longer inherit LearnCard domains, trust settings or seed-encryption flags; a named tenant without a stage file fails closed. `ESCROW_ENCLAVE_MODE` is now forwarded in runtime-secrets bundle mode too.
