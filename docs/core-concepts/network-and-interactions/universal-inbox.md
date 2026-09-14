# Universal Inbox

This document explains the core concepts behind the Universal Inbox feature. It's designed to give you a deep understanding of what it is, the problems it solves for both developers and end-users, and why it is a critical component of the LearnCard ecosystem.

## What is Universal Inbox?

At its core, the **Universal Inbox** is an API that allows any person or organization to send a verifiable credential to any recipient using a common identifier, like an email address or phone number.

It acts as a smart and secure "digital mailbox." An issuer can send a credential to `user@example.com` without needing to know if that person already has a LearnCard Passport. The Universal Inbox holds the credential securely and sends a simple notification to the user. When the user clicks the link in the notification, the system seamlessly guides them through either logging into their existing passport or creating a new one to claim their credential.

Think of it as the universal on-ramp to the LearnCard ecosystem. It's the bridge that connects traditional communication methods with the world of self-sovereign identity.

## Security and retention

Until a recipient creates an account, no recipient encryption key exists. LearnCard therefore encrypts the credential payload to the network service while it is waiting to be claimed. The service decrypts it only long enough to finalize delivery. In one database transaction, it saves a recovery copy encrypted exclusively to the claiming decentralized identifier (DID), marks the claim issued, and removes the service-readable escrow. Concurrent finalizers cannot overwrite that recovery copy. Expired payloads are also removed; deleting expired audit records requires an explicit operational setting.

The standard claim window is 30 days. Issuers can choose a shorter window with `configuration.expiresInDays`. Use the shortest practical window for transcripts, Comprehensive Learner Records (CLRs), and other sensitive learner data. Embedded claim flows can remain available for up to 720 days by default, which is usually inappropriate for sensitive records unless the integration overrides its issuance policy.

Claims are single-use: after successful delivery, starting another exchange for the same claimed records returns no pending credentials. Repeating `/inbox/finalize` returns only newly pending records. Clients should save returned credentials immediately. If the HTTP response is lost or local storage fails, the same claiming DID can recover its delivery for **seven days** with `POST /inbox/deliveries` (authenticated, `inbox:read` scope). This also works for a claimant without a network profile. The endpoint returns a paginated list of `{ id, credential, expiresAt }`; `credential` is a JSON Web Encryption (JWE) object that the holder decrypts locally. It never re-signs or re-issues the credential. Use the stable inbox `id` to deduplicate retries, and use the returned `cursor` while `hasMore` is true.

The SDK handles local decryption:

```typescript
const page = await learnCard.invoke.recoverInboxCredentials({ limit: 25 });
// page.records contains { id, credential, expiresAt }, with decrypted credentials.
// Persist each credential once per id; fetch subsequent pages using page.cursor.
```

The service and issuer cannot decrypt claim recovery copies. Ordinary automatic deliveries to existing profiles remain readable by both recipient and issuer and are durably stored before the inbox receipt is created. These paths do not create temporary escrow.

**API response change:** `/inbox/issued`, `/inbox/credentials/{credentialId}`, and the tracking record returned by `/inbox/claim` expose metadata only. They omit `credential` for every status, including legacy records. Integrators must use the claim response or authenticated delivery recovery for credential content; ciphertext is never exposed through issuer metadata routes.

### Operations and rollout

The `inboxMaintenance` Lambda runs daily. Expiry, recovery cleanup, audit deletion, and legacy migration each process batches of 100, with at most ten batches per operation per invocation. The recovery endpoint rejects expired copies immediately; maintenance subsequently removes their ciphertext. Issued audit records remain without the service-readable payload or display metadata.

Audit deletion is **off by default**. After reviewing the backlog, set `INBOX_DELETE_EXPIRED_RECORDS=true` in the deployment environment to enable deletion 90 days after `expiredAt` (or `expiresAt` for legacy expired records). Newly expired historical pending records receive today's `expiredAt`, giving them a full retention interval. Payload expiry and recovery cleanup run even when audit deletion is disabled or encryption is unavailable.

Before enabling maintenance on an existing deployment, run these read-only counts against that deployment's Neo4j database:

```cypher
MATCH (ic:InboxCredential)
WHERE ic.currentStatus = "PENDING" AND datetime(ic.expiresAt) <= datetime()
RETURN count(ic) AS pendingToExpire;
```

```cypher
MATCH (ic:InboxCredential)
WHERE ic.currentStatus = "EXPIRED"
  AND datetime(coalesce(ic.expiredAt, ic.expiresAt)) < datetime() - duration({days: 90})
RETURN count(ic) AS auditRecordsEligibleForDeletion;
```

```cypher
MATCH (ic:InboxCredential)
WHERE ic.credential IS NOT NULL
  AND (ic.currentStatus <> "PENDING" OR NOT ic.credential STARTS WITH "lc-inbox-jwe:v1:")
RETURN count(ic) AS legacyPayloads;
```

Maintenance encrypts pending legacy plaintext and wipes terminal legacy payloads. A failed record increments `failed` and moves behind untouched migration candidates; it cannot block the rest of its batch. The returned totals include `migrated`, `wiped`, `failed`, `expired`, `deleted`, and `deliveriesWiped`. `failed` counts failed attempts. Pending legacy display names remain available during rollout without decrypting encrypted escrow on metadata routes.

Invoke the worker during rollout and verify that no plaintext records remain before enabling sensitive issuances. From the brain-service directory, use `bunx serverless invoke --function inboxMaintenance --stage <stage>` with the deployment's normal credentials and configuration. Repeat for backlogs exceeding the per-run budget, and investigate failed records. Migration can safely run concurrently with claims.

Escrow encryption depends on the brain service's configured `SEED`. Preserve access to that key while pending records exist; replacing it without re-encrypting pending payloads makes those records unreadable. This protects storage at rest, not against a compromised service with access to the decryption key. Removing node properties does not erase older database backups or transaction logs; apply the corresponding storage retention policies to those as well.

### Security regression tests

From `services/learn-card-network/brain-service`, run `bun run test:inbox:e2e` with Docker running, or run `bunx nx run network-brain-service:test:inbox:e2e` from the repository root. The PR workflow runs this target in its `inbox-security` job. The suite starts fresh Neo4j and Redis containers on random ports and an HTTP server. It inspects stored properties and cache values directly, exercises signing and claim wiping, and tests migration, retention, and concurrent finalization without clearing development databases. The signing-authority test adapter signs locally; external signing-authority transport is covered by the broader `tests/e2e` suite.

## The Problem It Solves

Before the Universal Inbox, issuing a credential involved significant friction for both the issuer and the recipient.

### **For the Issuer (the Developer):**

- **The Old Problem:** To send a credential, a developer first had to solve a complex "chicken-and-egg" problem. Do they ask the user for their LearnCard DID? What if the user doesn't have one? Do they build a UI to manage one-off "claim links"? This forced every integrating partner to become an expert in decentralized identity concepts just to perform a simple action.
- **The Solution:** The Universal Inbox removes this burden entirely. It provides a single, simple API endpoint (`POST /inbox/issue`). The developer only needs to provide the credential data and the recipient's email. Our system handles the rest, abstracting away the complexity of whether the user is new or existing.

### **For the Recipient (the End-User):**

- **The Old Problem:** The user had to be educated about what a LearnCard Passport was _before_ they could receive their first credential. This created a learning curve and a barrier to entry.
- **The Solution:** The Universal Inbox meets the user where they already are: their email inbox or text messages. The first interaction they have is a simple, familiar notification: "State University has sent you a digital record." The experience of creating a passport becomes a natural and necessary step to claiming something of value, not an abstract concept they have to learn upfront.

## Why It Matters

The Universal Inbox is more than just a feature; it's a strategic pillar for adoption and growth.

1. **It Radically Simplifies Integration:** By providing a familiar, RESTful API that feels like using services like Postmark or Twilio, we dramatically lower the barrier to entry. Developers can integrate our most powerful feature in minutes, not days, accelerating the growth of our entire ecosystem.
2. **It Bridges the Centralized and Decentralized Worlds:** This is the most critical function. True adoption of self-sovereign identity requires a smooth transition from the systems people use every day. The Universal Inbox is that transition. It uses centralized identifiers (email, phone) as a secure and user-friendly invitation into a decentralized, user-owned world.
3. **It Upholds Our Core Principles Without Compromise:** Despite its simplicity, the Universal Inbox never compromises on self-sovereignty. The partner never creates a passport on the user's behalf. The user, and only the user, creates their account and controls their private keys. The system simplifies the _invitation and delivery_, not the fundamental principles of ownership and control.

In short, the Universal Inbox makes the powerful and complex world of verifiable credentials feel simple, intuitive, and accessible to everyone.

## Guardian-Gated Credentials

When issuing credentials to minors or managed accounts, the Universal Inbox supports **guardian gating**. By specifying a `guardianEmail` when sending a credential, the system requires a trusted guardian to approve the credential before the recipient can claim it.

- The guardian receives an approval email with a secure OTP challenge
- The credential remains in `AWAITING_GUARDIAN` status until the guardian acts
- Once a guardian creates a LearnCard account and establishes a MANAGES relationship with the child, all future credentials to that child are automatically guardian-gated — no `guardianEmail` needed from the issuer

This enables COPPA-friendly credential issuance workflows where parental consent is required. See the [Guardian-Gated Credentials](../../how-to-guides/implement-flows/guardian-gated-credentials.md) guide for implementation details.
