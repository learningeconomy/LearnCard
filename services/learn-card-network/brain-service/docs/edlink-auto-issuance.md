# Ed.link Auto-Issuance (POC)

## Overview

Integrates with [Ed.link](https://ed.link/) to automatically issue credentials when teachers return graded assignments in connected LMS platforms (Google Classroom, Canvas, etc.).

## Architecture

```
Teacher grades assignment in LMS
        ↓
Polling service (every 5 min)
        ↓
Fetch classes → assignments → submissions (state === 'returned')
        ↓
Deduplicate via EdlinkIssuedCredential node (Neo4j)
        ↓
Issue credential via issueToInbox()
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/edlink-polling.service.ts` | Background poller, credential signing & issuance |
| `src/helpers/edlink.helpers.ts` | Ed.link Graph API calls |
| `src/routes/edlink.ts` | tRPC routes (connection CRUD, completions) |
| `src/accesslayer/edlink-connection/` | Neo4j access layer for connections |
| `src/accesslayer/edlink-issued-credential/` | Deduplication tracking |

## Feature Flags

- **Frontend**: LaunchDarkly flag `edLinkEnabled` gates the `/school-portal` route
- **Backend**: Env var `EDLINK_ENABLED=true` gates router mounting (app.ts) and polling entry point (docker-entry.ts). The polling service itself also checks `EDLINK_POLLING_ENABLED=true`.

## POC Limitations

- Hardcoded issuer seed instead of signing authorities
- No incremental/delta fetching — refetches all completions every poll
- No webhook support (polling only)
