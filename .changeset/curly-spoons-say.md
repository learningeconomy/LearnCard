---
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
---

Thin Federation: Cross-instance credential exchange

### New Features

**External URI Resolution**

-   URI resolution now automatically detects external domains and fetches resources from remote brain-service instances
-   Storage resolve endpoint handles both local and external URI resolution transparently
-   Boost URIs from external domains are now correctly preserved when fetched

**Federated Inbox API**

-   New `POST /api/inbox/receive` endpoint accepts credentials from trusted external brain-services
-   DID Auth JWT authentication for service-to-service communication
-   Creates federated inbox credential records with issuer tracking
-   Sends notifications to recipients when credentials are received

**Trust Registry**

-   Environment-based service whitelist via `TRUSTED_BRAIN_SERVICES`
-   `isServiceTrusted()` checks if a service is trusted by extracting server DID from user DID
-   `getTrustedServices()` returns list of trusted brain-services

**Seamless SDK Integration**

-   `sendCredential()` now automatically detects external DIDs and federates
-   No separate method needed - existing API works for both local and cross-instance sends
-   DID resolution finds inbox service endpoints from DID Documents

**DID Document Updates**

-   Added `UniversalInboxService` endpoint to DID documents
-   Added `LearnCardBrainService` endpoint for service discovery
-   Services can now discover each other via DID resolution

### Bug Fixes

-   Fixed `getBoost()` to preserve original URI domain when returning boosts from external services
-   Fixed trust check to properly extract server DID from user DID for comparison
-   Fixed external URI resolution to use correct domain comparison

### Testing

-   Added comprehensive federation E2E tests in `tests/federation-e2e/`
-   Tests cover: trust registry, DID resolution, federated inbox, external URI resolution
-   Docker Compose setup for multi-instance testing
