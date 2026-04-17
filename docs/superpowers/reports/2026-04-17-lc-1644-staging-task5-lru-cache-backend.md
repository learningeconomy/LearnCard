# LC-1644 Backend Benchmark: staging-task5-lru-cache-backend

| Meta | Value |
|------|-------|
| Commit | `262e82da` |
| Date | 2026-04-17T21:21:08.971Z |
| Iterations | 20 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 20 | 367 | 412 | 720 | 335 | 720 | 387 | ✅
| handleSendCredentialEvent | 22 | 318 | 655 | 4135 | 279 | 4135 | 505 |
| handleSendCredentialEvent:buildCredential | 22 | 0 | 0 | 1 | 0 | 1 | 0 |
| handleSendCredentialEvent:logActivityAndSendBoost | 22 | 73 | 80 | 211 | 32 | 211 | 69 |
| handleSendCredentialEvent:ownerAndSaReads | 22 | 1 | 1 | 5 | 0 | 5 | 1 |
| handleSendCredentialEvent:parallelReads | 22 | 1 | 2 | 9 | 0 | 9 | 1 |
| handleSendCredentialEvent:saIssue | 22 | 248 | 598 | 3908 | 235 | 3908 | 433 |
| handleSendCredentialEvent:saResolve | 22 | 0 | 0 | 0 | 0 | 0 | 0 |
| issueCredentialWithSigningAuthority | 22 | 247 | 598 | 3907 | 234 | 3907 | 432 |
| issueCredentialWithSigningAuthority:didAuthVp | 22 | 1 | 63 | 297 | 1 | 297 | 18 |
| issueCredentialWithSigningAuthority:http | 22 | 240 | 592 | 3601 | 229 | 3601 | 410 |
| issueCredentialWithSigningAuthority:initDid | 22 | 1 | 1 | 4 | 1 | 4 | 1 |
| issueCredentialWithSigningAuthority:parse | 22 | 3 | 3 | 4 | 1 | 4 | 3 |
