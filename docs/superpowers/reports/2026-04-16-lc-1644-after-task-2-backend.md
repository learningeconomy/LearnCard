# LC-1644 Backend Benchmark: after-task-2-backend

| Meta | Value |
|------|-------|
| Commit | `c0a1ce02` |
| Date | 2026-04-16T21:36:13.311Z |
| Iterations | 10 (+2 warmup) |
| Target p50 total | ≤4000ms |
| Errors | 1 |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 10 | 100 | 146 | 146 | 93 | 146 | 112 | ✅
| handleSendCredentialEvent | 11 | 63 | 485 | 485 | 49 | 485 | 102 |
| handleSendCredentialEvent:buildCredential | 11 | 0 | 1 | 1 | 0 | 1 | 0 |
| handleSendCredentialEvent:getBoost | 11 | 1 | 28 | 28 | 1 | 28 | 4 |
| handleSendCredentialEvent:getIntegration | 11 | 1 | 2 | 2 | 0 | 2 | 1 |
| handleSendCredentialEvent:getOwner | 11 | 1 | 15 | 15 | 0 | 15 | 2 |
| handleSendCredentialEvent:logActivity | 11 | 21 | 61 | 61 | 14 | 61 | 25 |
| handleSendCredentialEvent:readListing | 11 | 1 | 10 | 10 | 0 | 10 | 2 |
| handleSendCredentialEvent:saIssue | 11 | 19 | 312 | 312 | 15 | 312 | 47 |
| handleSendCredentialEvent:saResolve | 11 | 1 | 16 | 16 | 1 | 16 | 3 |
| handleSendCredentialEvent:sendBoost | 11 | 16 | 31 | 31 | 12 | 31 | 17 |
| handleSendCredentialEvent:targetProfile | 11 | 1 | 9 | 9 | 1 | 9 | 2 |
| issueCredentialWithSigningAuthority | 11 | 19 | 310 | 310 | 15 | 310 | 47 |
| issueCredentialWithSigningAuthority:didAuthVp | 11 | 1 | 38 | 38 | 1 | 38 | 5 |
| issueCredentialWithSigningAuthority:http | 11 | 16 | 267 | 267 | 13 | 267 | 40 |
| issueCredentialWithSigningAuthority:initDid | 11 | 1 | 3 | 3 | 1 | 3 | 1 |
| issueCredentialWithSigningAuthority:parse | 11 | 1 | 1 | 1 | 0 | 1 | 1 |
