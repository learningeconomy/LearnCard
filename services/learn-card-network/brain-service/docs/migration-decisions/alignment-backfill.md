# Alignment backfill after resolve-path hardening

## Decision

Brain-service no longer injects OBv3 alignments during `storage.resolve`.

Credential resolution must now return byte-identical content on every read. Alignment injection happens only at issue time via `prepareCredentialFromBoost()`, which already calls `injectObv3AlignmentsIntoCredentialForBoost()` before the credential is signed or stored.

## Why

- Resolve-time mutation breaks content-addressing guarantees.
- The same credential could previously resolve to different bytes before and after cache warmup.
- Phase 2.2 of the E2EE hardening plan requires read paths to be side-effect free.

## Backfill query

Use this Cypher query to identify stored boost credentials that still lack alignments and may need a one-time backfill or re-issuance flow:

```cypher
MATCH (credential:Credential)
WITH credential, apoc.convert.fromJsonMap(credential.credential) AS doc
WHERE any(t IN coalesce(doc.type, []) WHERE t = 'BoostCredential')
  AND none(subject IN CASE
        WHEN doc.credentialSubject IS NULL THEN []
        WHEN apoc.meta.type(doc.credentialSubject) = 'LIST' THEN doc.credentialSubject
        ELSE [doc.credentialSubject]
      END
      WHERE (
        coalesce(size(coalesce(subject.alignment, [])), 0) > 0
        OR coalesce(size(coalesce(subject.achievement.alignment, [])), 0) > 0
      ))
RETURN credential.id AS credentialId,
       doc.boostId AS boostUri,
       doc.issuer AS issuer,
       doc.credentialSubject AS credentialSubject
ORDER BY credentialId;
```

## Operational note

Existing credentials identified by the query above should be handled through an explicit migration/backfill process. They should not be rewritten opportunistically during `storage.resolve`.
