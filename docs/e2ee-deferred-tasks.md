# E2EE Hardening: Deferred Tasks

This document outlines the tasks from the E2EE hardening plan that have been deferred. These are significant infrastructure changes that require dedicated planning and execution.

## Phase 0.5: Break-glass Access
- **Requirement**: A mechanism for emergency access to encrypted data with full audit logging.
- **Why Deferred**: Requires a new route, audit log infrastructure, and time-limited token logic.
- **Implementation Notes**: Implement a "break-glass" route that requires multi-party approval or high-level administrative credentials. Every access must be logged to a tamper-proof audit trail.
- **Estimated Effort**: ~2 weeks

## Phase 0.7: Private-boost Field Encryption
- **Requirement**: Encrypting specific fields within private boosts.
- **Why Deferred**: Requires deep integration with AWS KMS and significant schema changes in the database.
- **Implementation Notes**: Identify sensitive fields in the boost schema. Use KMS to encrypt these fields before storage and decrypt them on retrieval.
- **Estimated Effort**: ~3 weeks

## Phase 2.1: Content-addressed URIs
- **Requirement**: Moving to a URI scheme based on the content hash of the credential.
- **Why Deferred**: Requires a new URI scheme and fundamental changes to the storage layer.
- **Implementation Notes**: Implement a hashing algorithm (e.g., SHA-256) to generate URIs. Update all references to use the new content-addressed format.
- **Estimated Effort**: ~3 weeks

## Phase 2.3: SUPERSEDES Relationship
- **Requirement**: A formal relationship in the graph to track credential versioning.
- **Why Deferred**: Requires Neo4j schema updates and new client-side tooling to handle the relationship.
- **Implementation Notes**: Add a `SUPERSEDES` relationship type in Neo4j. Update the issuance logic to automatically link new versions of a credential to their predecessors.
- **Estimated Effort**: ~2 weeks

## Phase 3.2: SDK Encryption
- **Requirement**: Updating the wallet SDK to support encrypted-only boosts.
- **Why Deferred**: Requires significant changes to the wallet SDK and how it handles boost data.
- **Implementation Notes**: Update the SDK to enforce encryption for all boost data. Ensure that decryption keys are managed securely within the wallet.
- **Estimated Effort**: ~3 weeks

## Phase 3.3: Recovery-key Recipient
- **Requirement**: Integrating recovery keys into the AuthCoordinator.
- **Why Deferred**: Requires complex integration with the existing authentication and recovery flows.
- **Implementation Notes**: Update the AuthCoordinator to support recovery-key recipients. Ensure that recovery keys can be used to reconstruct the user's master key.
- **Estimated Effort**: ~2 weeks

## Phase 3.4: Server-side JWE
- **Requirement**: Implementing a sign-then-encrypt pipeline on the server.
- **Why Deferred**: Requires a fundamental shift in the credential issuance pipeline.
- **Implementation Notes**: Implement the JWE (JSON Web Encryption) standard for server-side encryption. Ensure that credentials are signed before being encrypted.
- **Estimated Effort**: ~2 weeks

## Phase 4.2: Sign-then-encrypt Pipeline
- **Requirement**: Full implementation of the sign-then-encrypt flow.
- **Why Deferred**: This is the full-scale implementation of Phase 3.4, requiring extensive testing and migration.
- **Implementation Notes**: Complete the transition to the JWE-based pipeline for all credential types.
- **Estimated Effort**: ~3 weeks

## Phase 4.4: Decouple Skill Extraction
- **Requirement**: Moving away from ad-hoc skill extraction to a structured-data alternative.
- **Why Deferred**: Requires a complete redesign of how skills are identified and extracted from credentials.
- **Implementation Notes**: Define a structured data format for skills. Update the extraction logic to use this format instead of unstructured text.
- **Estimated Effort**: ~4 weeks

## Phase 4.5: Federation Handshake
- **Requirement**: A cross-instance JWE protocol for federated credential sharing.
- **Why Deferred**: Requires a standardized protocol for instances to exchange encrypted data.
- **Implementation Notes**: Implement a handshake protocol that allows different LearnCard instances to securely exchange JWE-encrypted credentials.
- **Estimated Effort**: ~3 weeks

## Phase 5.2: HSM-backed Signing
- **Requirement**: Full integration of AWS KMS for all signing operations.
- **Why Deferred**: Requires updating all signing logic and ensuring high availability.
- **Implementation Notes**: Replace the current seed-based signing with calls to the AWS KMS API.
- **Estimated Effort**: ~3 weeks

## Phase 5.3: Key Migration
- **Requirement**: Importing existing keys into AWS KMS.
- **Why Deferred**: Requires a secure process for migrating existing key material without exposure.
- **Implementation Notes**: Use the AWS KMS import feature to securely move existing keys into the HSM.
- **Estimated Effort**: ~1 week
