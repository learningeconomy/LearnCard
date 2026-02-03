---
"learn-card-app": patch
---

perf: Mock DIDKit WASM in Playwright tests to avoid slow CDN fetch

This speeds up our internal tests. It is not user-facing
