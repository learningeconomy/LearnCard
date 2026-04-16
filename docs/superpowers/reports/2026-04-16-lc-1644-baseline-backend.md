# LC-1644 Backend Benchmark: baseline-backend

| Meta | Value |
|------|-------|
| Commit | `69688f08` |
| Date | 2026-04-16T21:30:00.683Z |
| Iterations | 10 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 10 | 89 | 133 | 133 | 72 | 133 | 97 | ✅
| handleSendCredentialEvent | 12 | 52 | 93 | 93 | 38 | 93 | 59 |
| handleSendCredentialEvent:buildCredential | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| handleSendCredentialEvent:getBoost | 12 | 1 | 2 | 2 | 1 | 2 | 1 |
| handleSendCredentialEvent:getIntegration | 12 | 1 | 2 | 2 | 0 | 2 | 1 |
| handleSendCredentialEvent:getOwner | 12 | 1 | 2 | 2 | 0 | 2 | 1 |
| handleSendCredentialEvent:logActivity | 12 | 17 | 51 | 51 | 12 | 51 | 22 |
| handleSendCredentialEvent:readListing | 12 | 0 | 2 | 2 | 0 | 2 | 1 |
| handleSendCredentialEvent:saIssue | 12 | 15 | 25 | 25 | 12 | 25 | 16 |
| handleSendCredentialEvent:saResolve | 12 | 1 | 4 | 4 | 0 | 4 | 1 |
| handleSendCredentialEvent:sendBoost | 12 | 14 | 25 | 25 | 11 | 25 | 15 |
| handleSendCredentialEvent:targetProfile | 12 | 1 | 2 | 2 | 0 | 2 | 1 |
| issueCredentialWithSigningAuthority | 12 | 15 | 24 | 24 | 12 | 24 | 16 |
| issueCredentialWithSigningAuthority:didAuthVp | 12 | 1 | 3 | 3 | 1 | 3 | 1 |
| issueCredentialWithSigningAuthority:http | 12 | 13 | 20 | 20 | 10 | 20 | 14 |
| issueCredentialWithSigningAuthority:initDid | 12 | 1 | 1 | 1 | 0 | 1 | 1 |
| issueCredentialWithSigningAuthority:parse | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
