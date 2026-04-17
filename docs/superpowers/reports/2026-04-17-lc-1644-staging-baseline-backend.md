# LC-1644 Backend Benchmark: staging-baseline-backend

| Meta | Value |
|------|-------|
| Commit | `05e007bf` |
| Date | 2026-04-17T20:19:49.524Z |
| Iterations | 10 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 10 | 365 | 423 | 423 | 313 | 423 | 375 | ✅
| handleSendCredentialEvent | 12 | 317 | 4547 | 4547 | 264 | 4547 | 671 |
| handleSendCredentialEvent:buildCredential | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| handleSendCredentialEvent:getBoost | 12 | 2 | 28 | 28 | 1 | 28 | 4 |
| handleSendCredentialEvent:getIntegration | 12 | 1 | 6 | 6 | 0 | 6 | 1 |
| handleSendCredentialEvent:getOwner | 12 | 1 | 15 | 15 | 0 | 15 | 3 |
| handleSendCredentialEvent:logActivity | 12 | 38 | 78 | 78 | 22 | 78 | 39 |
| handleSendCredentialEvent:readListing | 12 | 1 | 14 | 14 | 0 | 14 | 2 |
| handleSendCredentialEvent:saIssue | 12 | 227 | 4299 | 4299 | 219 | 4299 | 567 |
| handleSendCredentialEvent:saResolve | 12 | 1 | 16 | 16 | 1 | 16 | 3 |
| handleSendCredentialEvent:sendBoost | 12 | 59 | 87 | 87 | 17 | 87 | 50 |
| handleSendCredentialEvent:targetProfile | 12 | 1 | 7 | 7 | 0 | 7 | 2 |
| issueCredentialWithSigningAuthority | 12 | 226 | 4299 | 4299 | 218 | 4299 | 566 |
| issueCredentialWithSigningAuthority:didAuthVp | 12 | 1 | 71 | 71 | 1 | 71 | 7 |
| issueCredentialWithSigningAuthority:http | 12 | 222 | 4223 | 4223 | 215 | 4223 | 556 |
| issueCredentialWithSigningAuthority:initDid | 12 | 1 | 4 | 4 | 1 | 4 | 1 |
| issueCredentialWithSigningAuthority:parse | 12 | 1 | 3 | 3 | 0 | 3 | 1 |
