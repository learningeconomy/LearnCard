# Migration Decision: Existing Certified VCs in Storage

## Context

The LearnCard Network (LCN) is moving toward a hardened End-to-End Encryption (E2EE) model. As part of this transition, the brain-service no longer possesses the ability to decrypt user credentials or issue "certified" versions of those credentials.

### What are Certified VCs?

Certified VCs (type: `CertifiedBoostCredential`) were credentials issued by the brain-service that wrapped a user's original credential. They allowed the server to index and verify the content of a boost without requiring the user's private keys at read-time.

The structure typically included:
- **Type**: `['VerifiableCredential', 'CertifiedBoostCredential']`
- **Issuer**: `did:web:{domain}` (the brain-service DID)
- **Credential Subject**: The recipient's DID
- **Boost ID**: The URI of the associated boost
- **Boost Credential**: The original credential payload embedded within the certified wrapper

These are stored in the Neo4j database as `Credential` nodes with `INSTANCE_OF` relationships to `Boost` nodes.

## Options Considered

### Option A: Leave in place but stop reading (Recommended)

Existing certified VCs remain in the database but the application code no longer references or attempts to read them.

**Pros:**
- Zero risk of data loss during migration.
- No operational overhead or complex cleanup logic.
- Harmless existence as orphaned nodes.
- Consistent with the deletion of `issueCertifiedBoost` and `decryptCredential` logic.

**Cons:**
- Minor database bloat from unused records.

### Option B: One-shot deletion job

Run a database migration to find and delete all `Credential` nodes with the `CertifiedBoostCredential` type.

**Pros:**
- Reclaims database space immediately.
- Removes all traces of the legacy certification model.

**Cons:**
- High risk of accidental data loss if query parameters are incorrect.
- Requires downtime or careful locking in Neo4j.
- Unnecessary complexity for a harmless data type.

### Option C: Mark deprecated and age out

Implement logic to mark these records as deprecated and delete them only when they are encountered or after a specific period.

**Pros:**
- Gradual cleanup.

**Cons:**
- Adds "zombie" logic to the codebase that we are trying to simplify.
- Increases maintenance burden.

## Final Decision

We have chosen **Option A: Leave in place but stop reading**.

### Rationale

The server can no longer create new certified VCs because the `issueCertifiedBoost` helper has been removed. Similarly, the certification path in the code has been deleted, meaning no active code path attempts to read or process these credentials.

Existing certified VCs are harmless. They are standard Verifiable Credentials that happen to have a specific type. Since the server can no longer decrypt credentials, it cannot use the embedded payloads anyway.

Leaving them in place avoids the risks associated with a large-scale database migration and the operational complexity of implementing an aging-out strategy.

## Operational Steps

No immediate action is required.

### Future Cleanup

A cleanup job may be scheduled after a suitable retention period (for example, one year) to prune these records from the database. This job should be run as a background maintenance task during low-traffic periods.
