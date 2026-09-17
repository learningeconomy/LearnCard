---
'@learncard/cli': minor
'@learncard/credential-library': patch
'@learncard/lca-api-plugin': patch
---

CLI: add issuer-org tooling for partner integrations — `org apply` (declarative, idempotent org bootstrap), `doctor` (read-only preflight), `clr validate` (CLR 2.0 transcript lint), `inbox list`, `refresh history`, and `promote` (staging → production).

Credential library: the `clr/provisional-transcript` fixture now marks itself `partial: true` with a `validUntil`, and its in-progress result points at a `Status`-typed ResultDescription (was `RawScore`). `buildFinalTranscriptVariant` strips those provisional markers.

LCA API plugin: skip the encryption-key probe when the profile does not exist yet (it could only 401) and log initialization warnings as one line instead of a full stack dump.
