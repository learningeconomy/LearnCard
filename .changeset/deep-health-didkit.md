---
'@learncard/network-brain-service': patch
'@learncard/lca-api-service': patch
'@learncard/learn-cloud-service': patch
---

Add /health-check/deep: issues and verifies a test credential + presentation in-process, proving the full DIDKit crypto path (plugin load, signing, and the native plugin runtime delegation) works, and reports which DIDKit engine (native/wasm) loaded. Shallow health checks stayed green through two DIDKit outages on 2026-07-02; this endpoint makes those failure modes observable from a plain HTTP probe.
