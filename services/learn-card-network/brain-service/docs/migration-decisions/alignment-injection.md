# Alignment injection is issue-time only

## Decision

OBv3 alignment injection now happens only while preparing a credential for issuance.

`prepareCredentialFromBoost()` calls `injectObv3AlignmentsIntoCredentialForBoost()` before the unsigned credential is returned for signing/encryption.

## Why

- Read paths must stay byte-stable for E2EE hardening.
- Resolve-time mutation breaks content-addressing expectations and makes reads stateful.
- Issue-time injection ensures the stored credential already contains the final OBv3 alignments.

## Current verification points

- `src/helpers/boost.helpers.ts` injects alignments inside `prepareCredentialFromBoost()`.
- The old resolve-path helper `ensureAlignmentsForBoostCredential` is gone.
- `test/helpers/alignment-injection.spec.ts` covers both expectations without requiring a database.
