# LC-1644 Backend Benchmark: staging-task4-parallel-all-backend

| Meta | Value |
|------|-------|
| Commit | `5cf6a219` |
| Date | 2026-04-17T21:00:54.074Z |
| Iterations | 20 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 20 | 360 | 419 | 1526 | 334 | 1526 | 423 | ✅
| handleSendCredentialEvent | 22 | 312 | 1485 | 1762 | 284 | 1762 | 434 |
| handleSendCredentialEvent:buildCredential | 22 | 0 | 0 | 1 | 0 | 1 | 0 |
| handleSendCredentialEvent:logActivityAndSendBoost | 22 | 54 | 80 | 84 | 38 | 84 | 59 |
| handleSendCredentialEvent:ownerAndSaReads | 22 | 1 | 6 | 21 | 1 | 21 | 3 |
| handleSendCredentialEvent:parallelReads | 22 | 3 | 5 | 6 | 1 | 6 | 3 |
| handleSendCredentialEvent:saIssue | 22 | 243 | 1434 | 1671 | 232 | 1671 | 369 |
| handleSendCredentialEvent:saResolve | 22 | 0 | 0 | 0 | 0 | 0 | 0 |
| issueCredentialWithSigningAuthority | 22 | 243 | 1434 | 1670 | 231 | 1670 | 369 |
| issueCredentialWithSigningAuthority:didAuthVp | 22 | 1 | 77 | 138 | 1 | 138 | 11 |
| issueCredentialWithSigningAuthority:http | 22 | 238 | 1429 | 1524 | 227 | 1524 | 354 |
| issueCredentialWithSigningAuthority:initDid | 22 | 1 | 2 | 4 | 1 | 4 | 1 |
| issueCredentialWithSigningAuthority:parse | 22 | 2 | 6 | 6 | 1 | 6 | 3 |
