# ADR-001: HSM/KMS Selection for Signing Authorities

## Status
Proposed

## Context
The `brain-service` currently manages signing keys using a `SEED` environment variable. This seed initializes a `LearnCard` instance and derives private keys for DIDs used in credential issuance. 

Storing these keys in environment variables poses a security risk. If the environment is compromised, the keys can be extracted. We need a more secure solution that keeps private keys within a protected boundary, such as a Hardware Security Module (HSM) or a Key Management Service (KMS).

## Options Considered

### 1. AWS CloudHSM
Dedicated HSM hardware providing FIPS 140-2 Level 3 compliance.
- **Pros**: Highest level of physical security and control.
- **Cons**: Expensive (~$1.45/hr per HSM), requires managing a cluster, and has high operational overhead.

### 2. AWS KMS
A managed service for creating and controlling cryptographic keys.
- **Pros**: Pay-per-use pricing, native IAM integration, automatic key rotation, and FIPS 140-2 Level 2 (software) or Level 3 (HSM) compliance.
- **Cons**: Keys are managed by AWS, though they remain within the HSM boundary.

### 3. GCP Cloud KMS
Google's managed key management service.
- **Pros**: Similar to AWS KMS with pay-per-use pricing and a simple API.
- **Cons**: Adding a dependency on GCP while the rest of the stack is on AWS increases cross-cloud complexity.

### 4. AWS Nitro Enclaves
Isolated compute environments for processing sensitive data.
- **Pros**: Provides a Trusted Execution Environment (TEE) for cryptographic operations.
- **Cons**: High implementation complexity and requires specific EC2 instance types.

## Decision
We will use **AWS KMS** for managing signing keys in `brain-service`.

## Rationale
AWS KMS is the most pragmatic choice for our current infrastructure:
- **Cost**: It uses a pay-per-use model, which is much cheaper than dedicated HSMs for our current volume.
- **Integration**: Since `brain-service` is already on AWS, KMS integrates naturally with our existing IAM roles and CloudTrail for auditing.
- **Security**: It provides strong security guarantees, ensuring that private keys never leave the HSM in plaintext.
- **Maintenance**: As a fully managed service, it handles key rotation and availability without manual intervention.

## Consequences
- We will implement a new `LearnCard` plugin or update the `CryptoPlugin` to delegate signing operations to AWS KMS.
- The `SEED` environment variable will be removed once the migration is complete.
- IAM policies for `brain-service` will need to be updated to grant access to specific KMS keys.
- All signing operations will now be recorded in AWS CloudTrail, providing a clear audit log of credential issuance.
