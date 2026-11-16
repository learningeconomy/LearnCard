# HCP v1 (brain service)

LearnCard's first versioned API for the Human Context Protocol (HCP). It lets a
person (the **Context Subject**) keep context entries about themselves, and lets
agents (**Context Clients**) read and write that context only under a grant the
person issued. LC-2419, epic LC-2418.

## Spec pin

"HCP v1" is LearnCard's API version. It implements **HCP 2.0 Draft 3**:

|            |                                            |
| ---------- | ------------------------------------------ |
| Repository | https://github.com/loyalagents/hcp-spec    |
| Path       | `spec/2.0-draft-3/specification.md`        |
| Commit     | `b790561830702c067cd7810c96ee78dd3d84741c` |

The same pin is served by `hcp.v1.meta` (`service/meta.ts`, `HCP_SPEC_PIN`). Operation
and field names follow Draft 3. Where LearnCard needs something Draft 3 does not
define, the schema comments say "LearnCard addition".

## API

Mounted once in `src/app.ts` as `hcp`; every procedure is `hcp.v1.<area>.<op>`.

| tRPC                      | OpenAPI                           | Draft 3                         | Who may call                                                    |
| ------------------------- | --------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `hcp.v1.meta`             | `GET /hcp/v1/meta`                | §19 discovery (adapted)         | anyone, no auth                                                 |
| `hcp.v1.entries.create`   | `POST /hcp/v1/entries`            | §5.2.3 Create                   | subject; client with `write` on every category                  |
| `hcp.v1.entries.query`    | `POST /hcp/v1/entries/query`      | §5.2.1 Query                    | subject; client with `read` + purpose                           |
| `hcp.v1.entries.get`      | `POST /hcp/v1/entries/get`        | §5.2.2 Get entry                | subject (by `entryId`); client (by `ref`) with `read` + purpose |
| `hcp.v1.entries.revise`   | `POST /hcp/v1/entries/revisions`  | §5.2.4 Revise                   | subject; client with `write` on every category of the entry     |
| `hcp.v1.entries.withdraw` | `POST /hcp/v1/entries/withdraw`   | §5.2.5 Withdraw                 | subject; client with `write` on every category of the entry     |
| `hcp.v1.grants.create`    | `POST /hcp/v1/grants`             | §6.1.5 grant                    | subject only                                                    |
| `hcp.v1.grants.list`      | `GET /hcp/v1/grants`              | §5.4 List grants                | subject only                                                    |
| `hcp.v1.grants.get`       | `GET /hcp/v1/grants/{grantId}`    | §5.2.6 Read own grant           | subject, or the grant's client                                  |
| `hcp.v1.grants.revoke`    | `DELETE /hcp/v1/grants/{grantId}` | §6.2 Revoke / §5.2.7 Relinquish | subject, or the grant's client                                  |
| `hcp.v1.audit.list`       | `POST /hcp/v1/audit`              | §8.3 Read audit log             | subject only                                                    |
| `hcp.v1.export`           | `POST /hcp/v1/export`             | §5.4.1 Export                   | subject only                                                    |

Wire types live in `schemas.ts`; read it alongside this table.

### Who is calling

Every procedure except `meta` uses the brain's DID-auth chain with a valid challenge
(`privateScopedRoute`: no request input is attached to Sentry).

- **Context Subject**: the caller has a LearnCard profile and sends no `grantId`. Its
  subject id is the profile's DID.
- **Context Client**: an agent identified by the DID it authenticated with. It sends
  `grantId`; the grant must name that DID as `client.id`, be `active`, and be
  unexpired. Agents need no profile. No identity proofs (Taylor + Jacksón, Nov 16).
- API tokens (auth grants) also need the LearnCard scope `hcp:read` or `hcp:write`
  (`*:*` covers both). These are brain API-token scopes, unrelated to HCP's
  `hcp:{category}:{action}` grant scopes.

### Policy, in the order it runs

1. Resolve the actor (`auth.ts`) before touching any entry. A missing, foreign,
   revoked or expired grant is `scope-denied`. A lapsed grant is marked `expired`
   and `grant.expired` is recorded the first time it is presented.
2. Reads need a `purpose` the grant approved for the categories read. A query with
   no `categories` searches exactly the categories the grant reads for that purpose;
   naming any other category is denied; an empty list is malformed. Entries whose
   `permittedPurposes` exclude the purpose are never disclosed.
3. Writes need `write` on every category touched. `issuer-attested` is accepted only
   when `assertedBy.id` is the authenticated caller.
4. Clients receive **disclosures** (§7.4): a grant-scoped random `ref`, never the
   entry `id`, only the categories the grant covers, and `useUntil` capped at one
   hour (no revocation notification channel exists, §7.6 rule 4).
5. Revise appends an immutable version; a stale `expectedVersion` is
   `version-conflict` and changes nothing.
6. Withdraw sets status `deleted` (soft): hidden from clients, kept for the subject
   and export. Withdraw and revoke are idempotent and record one event.

Errors are Draft 3 §5.5 codes, thrown by the service as `HcpV1Error` and mapped once
in `router.ts`: `malformed-request` → `BAD_REQUEST`, `scope-denied` → `FORBIDDEN`,
`version-conflict` → `CONFLICT`. The tRPC message starts with the HCP code. Every
not-authorized outcome has the same detail, so a response never says whether an
entry exists.

## Layout

```
src/hcp/
  index.ts              hcpRouter = { v1 }   (the only file app.ts imports)
  structure.test.ts     enforces the coupling rules below
  v1/
    router.ts           tRPC procedures, OpenAPI meta, error mapping
    schemas.ts          zod wire types, v1-owned
    auth.ts             actor resolution and grant evaluation
    ports.ts            the only brain-internal imports v1 needs
    service/            transport-free domain logic: plain functions (deps, caller, input)
      entries.ts grants.ts governance.ts meta.ts views.ts seams.ts deps.ts errors.ts
    store/
      port.ts           HcpV1Store interface
      neo4j.ts          production adapter (raw Cypher, HcpV1* labels)
      memory.ts         unit-test adapter
      store.contract.ts shared contract, run against both adapters
```

## Coupling

- Only `src/app.ts` imports `src/hcp`; nothing outside `src/hcp` imports `src/hcp/v1`.
- Inside v1, brain internals are imported only by `ports.ts`, `store/neo4j.ts`
  (`@instance`) and `router.ts` (`@routes` builders).
- Versions never import each other.
- Neo4j: v1 owns `HcpV1ContextEntry`, `HcpV1EntryVersion`, `HcpV1EntryRef`,
  `HcpV1Grant`, `HcpV1Event`, and draws no relationship to other brain nodes. Subject
  and client are DID properties.

`structure.test.ts` fails on any violation.

## Seams (stubbed, not built)

| Seam           | Where              | Today                                                          | Follow-up                                    |
| -------------- | ------------------ | -------------------------------------------------------------- | -------------------------------------------- |
| `WritePolicy`  | `service/seams.ts` | always `{ kind: 'write' }`                                     | LC-2423 suggest vs write                     |
| `ActivitySink` | `service/seams.ts` | records lifecycle events                                       | LC-2422 access log (`context.read`, denials) |
| grant `source` | `schemas.ts`       | `{ type: 'direct' }` only; `consentflow` is typed and rejected | LC-2421 consent-flow versioning              |

## Not in v1

Out of scope by decision: consent-flow templates, semantic search, identity proofs.
Not implemented yet (Draft 3 has them): `context.read` audit events (LC-2422),
Idempotency-Key (§9.6), onward sharing and `context.shared` (§5.2.8), standing rules
and directives (§6.3, §6.4), confirmation (§3.8), recategorize and restrict purposes,
hard delete and import (§5.4), narrowed grants (§6.1.5.1), the `provenance` action
(§7.4.1), relationships and conflicts (§4.2.3, §4.7), VC evidence ingest (§14),
custom categories, the MCP binding. Relevance ordering is `lexical` (§7.3).
`conformsTo` is not claimed: tRPC paths are not the Draft 3 HTTP binding.

## Tests

```
# unit: service against the memory store, memory store contract, coupling rules
bunx vitest run --config vitest.config.ts src/hcp

# Neo4j (testcontainers, needs Docker): store contract + router through appRouter
bunx vitest run --config vitest.integration.config.ts test/hcp-v1-store.neo4j.spec.ts test/hcp-v1.spec.ts
```

## Adding v2 / shedding v1

- **v2**: add `src/hcp/v2/` with its own router, schemas, store and `HcpV2*` labels,
  and one line in `src/hcp/index.ts`. Add `'v2'` to the `it.each` in
  `structure.test.ts`.
- **Shed v1**: delete `src/hcp/v1/` and `test/hcp-v1*.spec.ts`, remove its line from
  `src/hcp/index.ts`, then delete its data:
  `MATCH (n) WHERE any(l IN labels(n) WHERE l STARTS WITH 'HcpV1') DETACH DELETE n`
  and drop the `hcp_v1_*` constraints and indexes.
