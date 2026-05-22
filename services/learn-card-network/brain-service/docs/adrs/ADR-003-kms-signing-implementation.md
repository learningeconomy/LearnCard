# ADR-003: AWS KMS Signing Implementation Plan

## Status
Proposed

## Context
Following the decision in [ADR-001](./ADR-001-hsm-kms-selection.md) to use AWS KMS for managing signing keys, we need a concrete implementation plan to transition the `brain-service` from seed-based signing to HSM-backed signing.

Currently, the service uses a `SEED` environment variable to derive keys. This implementation will delegate the actual cryptographic signing to AWS KMS, ensuring private keys never leave the HSM boundary.

## Proposed Changes

### 1. Infrastructure Integration
- Add `@aws-sdk/client-kms` to the `brain-service` dependencies.
- Configure IAM roles for the `brain-service` execution environment (Lambda or EC2) to allow `kms:Sign` and `kms:GetPublicKey` permissions for authorized keys.

### 2. Signing Authority Model Update
The `SigningAuthority` model in Neo4j/MongoDB will be updated to support KMS-backed keys:
- Add an optional `kmsKeyArn` field.
- When `kmsKeyArn` is present, the service will use AWS KMS for signing instead of a local seed.
- For a transitional period, the `seed` field will remain supported for existing authorities.

### 3. LearnCard Plugin Implementation
We will implement a custom `KmsCryptoPlugin` for the LearnCard SDK:
- **Sign**: Instead of using a local private key, the plugin will call the AWS KMS `Sign` API.
- **Verify**: The plugin will use the public key retrieved via `GetPublicKey` or standard DID resolution.
- **Key Type**: We will primarily use `ECC_NIST_P256` (ES256) or `ECC_SECG_P256K1` (ES256K) as supported by AWS KMS and the DID standards we use (e.g., `did:key`, `did:web`).

### 4. Signing Flow
When a credential needs to be signed:
1. The service identifies the `SigningAuthority` to use.
2. If it's a KMS-backed authority, it retrieves the `kmsKeyArn`.
3. The service prepares the unsigned credential (e.g., a JWT or Linked Data Proof).
4. The service calls the `KmsCryptoPlugin`, which sends the digest of the credential to AWS KMS.
5. AWS KMS returns the signature.
6. The service attaches the signature to the credential and returns it.

## Rationale
This approach fulfills the security requirements of Phase 5 while maintaining backward compatibility. By using a dedicated plugin, we keep the core logic of `brain-service` decoupled from the specific KMS implementation.

## Consequences
- **Dependency**: The service will have a hard dependency on AWS KMS for new signing operations.
- **Latency**: Signing will involve a network call to AWS KMS, adding a small amount of latency (typically <50ms).
- **Security**: Private keys are no longer stored in environment variables or the database, significantly reducing the impact of a potential server compromise.
- **Auditability**: Every signing operation will be logged in AWS CloudTrail.
