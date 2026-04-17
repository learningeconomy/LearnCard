# LC-1644 Backend Benchmark: staging-task3-h2-confirm-backend

| Meta | Value |
|------|-------|
| Commit | `d4ba54de` |
| Date | 2026-04-17T20:56:07.441Z |
| Iterations | 20 (+2 warmup) |
| Target p50 total | ≤4000ms |

| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |
|-------|---|----------|----------|----------|-----|-----|------|
| client:appEvent:total | 20 | 370 | 427 | 436 | 316 | 436 | 376 | ✅
| handleSendCredentialEvent | 22 | 319 | 366 | 1423 | 278 | 1423 | 375 |
| handleSendCredentialEvent:buildCredential | 22 | 0 | 0 | 0 | 0 | 0 | 0 |
| handleSendCredentialEvent:getBoost | 22 | 1 | 4 | 4 | 1 | 4 | 2 |
| handleSendCredentialEvent:getIntegration | 22 | 1 | 1 | 4 | 0 | 4 | 1 |
| handleSendCredentialEvent:getOwner | 22 | 1 | 1 | 2 | 0 | 2 | 1 |
| handleSendCredentialEvent:logActivity | 22 | 43 | 62 | 146 | 18 | 146 | 46 |
| handleSendCredentialEvent:readListing | 22 | 1 | 1 | 1 | 0 | 1 | 1 |
| handleSendCredentialEvent:saIssue | 22 | 231 | 260 | 1137 | 224 | 1137 | 277 |
| handleSendCredentialEvent:saResolve | 22 | 1 | 1 | 2 | 1 | 2 | 1 |
| handleSendCredentialEvent:sendBoost | 22 | 24 | 79 | 136 | 14 | 136 | 46 |
| handleSendCredentialEvent:targetProfile | 22 | 1 | 2 | 2 | 0 | 2 | 1 |
| issueCredentialWithSigningAuthority | 22 | 231 | 259 | 1137 | 223 | 1137 | 276 |
| issueCredentialWithSigningAuthority:didAuthVp | 22 | 1 | 2 | 64 | 1 | 64 | 4 |
| issueCredentialWithSigningAuthority:http | 22 | 228 | 251 | 1069 | 218 | 1069 | 269 |
| issueCredentialWithSigningAuthority:initDid | 22 | 1 | 2 | 3 | 0 | 3 | 1 |
| issueCredentialWithSigningAuthority:parse | 22 | 2 | 4 | 10 | 1 | 10 | 2 |
