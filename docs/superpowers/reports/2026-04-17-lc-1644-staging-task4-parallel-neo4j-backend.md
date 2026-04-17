# LC-1644 Backend Benchmark: staging-task4-parallel-neo4j-backend

| Meta | Value |
|------|-------|
| Commit | `5cf6a219` |
| Date | 2026-04-17T20:58:48.817Z |
| Iterations | 20 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 20 | 373 | 422 | 443 | 327 | 443 | 382 | ✅
| handleSendCredentialEvent | 22 | 331 | 372 | 1759 | 272 | 1759 | 397 |
| handleSendCredentialEvent:buildCredential | 22 | 0 | 0 | 1 | 0 | 1 | 0 |
| handleSendCredentialEvent:logActivity | 22 | 41 | 56 | 70 | 15 | 70 | 40 |
| handleSendCredentialEvent:ownerAndSaReads | 22 | 2 | 7 | 46 | 1 | 46 | 4 |
| handleSendCredentialEvent:parallelReads | 22 | 3 | 6 | 22 | 1 | 22 | 4 |
| handleSendCredentialEvent:saIssue | 22 | 243 | 263 | 1542 | 226 | 1542 | 301 |
| handleSendCredentialEvent:saResolve | 22 | 0 | 0 | 0 | 0 | 0 | 0 |
| handleSendCredentialEvent:sendBoost | 22 | 56 | 79 | 81 | 13 | 81 | 48 |
| issueCredentialWithSigningAuthority | 22 | 243 | 262 | 1540 | 226 | 1540 | 301 |
| issueCredentialWithSigningAuthority:didAuthVp | 22 | 1 | 3 | 128 | 1 | 128 | 7 |
| issueCredentialWithSigningAuthority:http | 22 | 237 | 255 | 1402 | 223 | 1402 | 290 |
| issueCredentialWithSigningAuthority:initDid | 22 | 1 | 2 | 3 | 1 | 3 | 1 |
| issueCredentialWithSigningAuthority:parse | 22 | 2 | 4 | 5 | 1 | 5 | 2 |
