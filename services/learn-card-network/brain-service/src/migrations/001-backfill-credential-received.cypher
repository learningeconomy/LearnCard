// Migration 001: Backfill CREDENTIAL_RECEIVED for pre-existing troop IDs
//
// Problem:
//   PR #973 (merged 2026-02-13) introduced the new revocation system and a UI
//   change that shows "Pending Acceptance" for credentials that have a
//   CREDENTIAL_SENT relationship but no corresponding CREDENTIAL_RECEIVED.
//
//   Before PR #973, the old acceptance flow added credentials to a user's
//   LearnCloud wallet without creating CREDENTIAL_RECEIVED in Neo4j. This means
//   every troop ID issued before Feb 13 2026 shows as "Pending Acceptance" even
//   though the user already holds the credential in their wallet.
//
// Fix:
//   Create the missing CREDENTIAL_RECEIVED relationships. Uses MERGE so it is
//   safe to run multiple times (idempotent).
//
// Usage:
//   Run against the target Neo4j instance via the browser console or cypher-shell.
//   Run Stage 1 first, verify the fix on staging/prod, then run Stage 2 if needed.
//
// ---
//
// STAGE 1 (safe): Self-issued credentials only (sender === recipient)
//   These are definitionally accepted — e.g. a national admin who issued
//   themselves their own national admin ID.  Zero risk of accidentally claiming
//   something the user never accepted.
//
MATCH (profile:Profile)-[sent:CREDENTIAL_SENT]->(credential:Credential)
WHERE sent.to = profile.profileId
  AND sent.date < '2026-02-13T00:00:00.000Z'
  AND NOT EXISTS {
    MATCH (credential)-[:CREDENTIAL_RECEIVED]->(profile)
  }
MERGE (credential)-[r:CREDENTIAL_RECEIVED]->(profile)
ON CREATE SET
  r.from = profile.profileId,
  r.date = sent.date
RETURN COUNT(r) AS created;

// ---
//
// STAGE 2 (broader): All pre-PR#973 sent credentials without CREDENTIAL_RECEIVED
//   Covers credentials issued from one profile to another (e.g. an admin issuing
//   a scout their Scout ID) that were accepted via the old flow.
//
//   Trade-off: also marks genuinely-pending (sent-but-never-accepted) credentials
//   as received.  Acceptable for records that are months old and were never acted
//   on, but review the count before running on production.
//
//   UNCOMMENT to run Stage 2:
//
// MATCH (sender:Profile)-[sent:CREDENTIAL_SENT]->(credential:Credential)
// WHERE sent.date < '2026-02-13T00:00:00.000Z'
// MATCH (recipient:Profile {profileId: sent.to})
// WHERE NOT EXISTS {
//     MATCH (credential)-[:CREDENTIAL_RECEIVED]->(recipient)
// }
// MERGE (credential)-[r:CREDENTIAL_RECEIVED]->(recipient)
// ON CREATE SET
//   r.from = sender.profileId,
//   r.date = sent.date
// RETURN COUNT(r) AS created;
