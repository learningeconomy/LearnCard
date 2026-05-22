# E2EE Migration Decisions

## Phase 1.8 — Existing certified VCs in storage

### Decision

**Leave certified VCs in place, but stop reading them.**

Existing `CertifiedBoostCredential` records remain in Neo4j. No new ones are created because `issueCertifiedBoost` has been deleted, and the remaining brain-service code paths no longer read or depend on these server-issued wrapper credentials.

### Why this is the chosen path

- Cheapest migration option: no backfill, no one-shot destructive migration, no new compatibility code.
- No data loss risk: we avoid deleting historical records during the E2EE hardening rollout.
- Existing certified VCs are server-issued metadata, not new stores of user-personal plaintext introduced by the new architecture.
- Once reads stop, the old nodes are effectively orphaned but harmless.

### Current state after Phase 1.5 / 1.6

- `issueCertifiedBoost` is deleted, so no new certified VCs are minted.
- The certification/decryption path is deleted, so the server no longer reads certified VCs as part of boost delivery.
- Existing `CertifiedBoostCredential` nodes may still exist in Neo4j from historical sends.

### Operational effect

- Historical records remain in place.
- They are not part of the forward path for E2EE-safe boost delivery.
- They can be ignored unless we later choose to do explicit database cleanup.

### Future cleanup shape

If we decide to remove them later, do it as a standalone maintenance job with explicit counting, auditing, and deletion.

Count candidate nodes:

```cypher
MATCH (c:Credential)
WHERE c.credential CONTAINS 'CertifiedBoostCredential'
RETURN count(c)
```

Delete candidate nodes:

```cypher
MATCH (c:Credential)
WHERE c.credential CONTAINS 'CertifiedBoostCredential'
DETACH DELETE c
```

Recommended cleanup job outline:

1. Run the count query and capture the result for change review.
2. Sample matching nodes to confirm they are legacy certified wrappers.
3. Execute deletion in a low-traffic maintenance window.
4. Re-run the count query to confirm cleanup completed.
