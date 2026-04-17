# LC-1644 Backend Benchmark: staging-task6-retry-timeout-backend

| Meta | Value |
|------|-------|
| Commit | `0062d573` |
| Date | 2026-04-17T21:24:19.850Z |
| Iterations | 20 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 20 | 365 | 640 | 761 | 299 | 761 | 395 | ✅
| handleSendCredentialEvent | 22 | 309 | 662 | 3579 | 256 | 3579 | 475 |
| handleSendCredentialEvent:buildCredential | 22 | 0 | 0 | 1 | 0 | 1 | 0 |
| handleSendCredentialEvent:logActivityAndSendBoost | 22 | 75 | 93 | 100 | 32 | 100 | 69 |
| handleSendCredentialEvent:ownerAndSaReads | 22 | 1 | 3 | 21 | 0 | 21 | 2 |
| handleSendCredentialEvent:parallelReads | 22 | 1 | 4 | 34 | 0 | 34 | 3 |
| handleSendCredentialEvent:saIssue | 22 | 236 | 576 | 3472 | 212 | 3472 | 401 |
| handleSendCredentialEvent:saResolve | 22 | 0 | 0 | 0 | 0 | 0 | 0 |
| issueCredentialWithSigningAuthority | 22 | 235 | 576 | 3470 | 212 | 3470 | 401 |
| issueCredentialWithSigningAuthority:didAuthVp | 22 | 1 | 77 | 127 | 1 | 127 | 10 |
| issueCredentialWithSigningAuthority:http | 22 | 229 | 574 | 3340 | 210 | 3340 | 389 |
| issueCredentialWithSigningAuthority:initDid | 22 | 1 | 1 | 3 | 1 | 3 | 1 |
