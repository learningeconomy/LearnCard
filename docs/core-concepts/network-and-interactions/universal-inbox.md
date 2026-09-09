# Universal Inbox

This document explains the core concepts behind the Universal Inbox feature. It's designed to give you a deep understanding of what it is, the problems it solves for both developers and end-users, and why it is a critical component of the LearnCard ecosystem.

## What is Universal Inbox?

At its core, the **Universal Inbox** is an API that allows any person or organization to send a verifiable credential to any recipient using a common identifier, like an email address or phone number.

It acts as a smart and secure "digital mailbox." An issuer can send a credential to `user@example.com` without needing to know if that person already has a LearnCard Passport. The Universal Inbox holds the credential securely and sends a simple notification to the user. When the user clicks the link in the notification, the system seamlessly guides them through either logging into their existing passport or creating a new one to claim their credential.

Think of it as the universal on-ramp to the LearnCard ecosystem. It's the bridge that connects traditional communication methods with the world of self-sovereign identity.

## Security and retention

Until a recipient creates an account, no recipient encryption key exists. LearnCard therefore encrypts the credential payload to the network service while it is waiting to be claimed. The service decrypts it only long enough to finalize delivery and removes the escrowed payload immediately after a successful claim. Expired payloads are also removed, and expired audit records are deleted according to the network retention policy.

The standard claim window is 30 days. Issuers can choose a shorter window with `configuration.expiresInDays`. Use the shortest practical window for transcripts, Comprehensive Learner Records (CLRs), and other sensitive learner data. Embedded claim flows can remain available for up to 720 days by default, which is usually inappropriate for sensitive records unless the integration overrides its issuance policy.

Claims are single-use: after successful delivery, starting another exchange for the same claimed records returns no pending credentials. Repeating `/inbox/finalize` returns only newly pending records. Clients must save the returned credentials as part of the claim flow.

### Operations and rollout

The `inboxMaintenance` Lambda runs daily. It marks overdue pending records `EXPIRED` and removes their payloads immediately. It deletes expired audit records 90 days after `expiredAt` (or `expiresAt` for legacy expired records). Issued audit records remain, without the credential payload or its display metadata.

Maintenance also migrates legacy data in batches of 100: pending plaintext payloads are encrypted, and terminal records have their payloads removed. Invoke the worker once during rollout before enabling sensitive issuances, and verify that no plaintext records remain; do not wait for the first daily invocation. For a Serverless deployment, run `bunx serverless invoke --function inboxMaintenance --stage <stage>` from the brain-service directory using the deployment's normal credentials and configuration. Large backlogs may require repeated invocations if a run reaches the Lambda timeout. Migration can safely run concurrently with claims.

Escrow encryption depends on the brain service's configured `SEED`. Preserve access to that key while pending records exist; replacing it without re-encrypting pending payloads makes those records unreadable. This protects storage at rest, not against a compromised service with access to the decryption key. Removing node properties does not erase older database backups or transaction logs; apply the corresponding storage retention policies to those as well.

### Security regression tests

From `services/learn-card-network/brain-service`, run `bun run test:inbox:e2e` with Docker running. The suite starts fresh Neo4j and Redis containers on random ports and an HTTP server. It inspects stored properties and cache values directly, exercises signing and claim wiping, and tests migration, retention, and concurrent finalization without clearing development databases. The signing-authority test adapter signs locally; external signing-authority transport is covered by the broader `tests/e2e` suite.

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
