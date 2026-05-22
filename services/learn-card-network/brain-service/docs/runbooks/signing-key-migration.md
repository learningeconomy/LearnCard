# Runbook: Migrating Signing Keys to AWS KMS

This runbook describes the procedure for migrating existing seed-based signing keys in `brain-service` to AWS KMS asymmetric keys.

## Overview
The goal is to move private key material from environment variables and database records into AWS KMS HSMs without changing the associated Decentralized Identifiers (DIDs). This ensures that previously issued credentials remain verifiable.

## Prerequisites
- AWS CLI configured with administrative access to KMS.
- Access to the `brain-service` production database (Neo4j and MongoDB).
- The `kms-migration-tool` (internal script) for handling key imports.

## Migration Procedure

### 1. Key Extraction
For each `SigningAuthority` to be migrated:
- Retrieve the `seed` from the database or environment.
- Use the LearnCard SDK to derive the raw private key and public key (DID) from the seed.
- **Security Note**: This step must be performed in a secure, isolated environment.

### 2. AWS KMS Key Creation
- Create a new asymmetric KMS key for signing and verification.
- **Key Spec**: Must match the existing key type (e.g., `ECC_NIST_P256` or `ECC_SECG_P256K1`).
- **Origin**: Set to `EXTERNAL` to allow importing existing key material.

### 3. Key Import
- Generate an import token and public key from AWS KMS.
- Encrypt the derived private key using the KMS public key.
- Import the encrypted private key into the KMS key created in Step 2.
- Verify that the public key of the KMS key matches the original DID's public key.

### 4. Update SigningAuthority Record
- Update the `SigningAuthority` node in Neo4j:
  - Set `kmsKeyArn` to the ARN of the new KMS key.
  - Keep the `seed` temporarily for fallback.
- Update the service configuration to use the KMS-backed signing path for this authority.

### 5. Verification
- Issue a test credential using the migrated `SigningAuthority`.
- Verify the signature using a standard resolver.
- Ensure the `issuer` DID remains identical to the pre-migration DID.

### 6. Cleanup
- Once verification is successful for all dependent services, remove the `seed` from the `SigningAuthority` record.
- Securely wipe any temporary files or environment variables containing the raw seed or private key.

## Rollback Procedure
If verification fails or issues arise during migration:
1. Revert the `SigningAuthority` record to remove the `kmsKeyArn` or set a flag to prefer the `seed`.
2. The service will fall back to seed-based signing using the existing (non-deleted) seed.
3. Investigate the KMS import failure or configuration error.

## Estimated Time
- **Preparation**: 2 days (scripting and IAM setup).
- **Execution**: 2 days (batch migration of keys).
- **Validation**: 1 day.
- **Total**: 1 week.
