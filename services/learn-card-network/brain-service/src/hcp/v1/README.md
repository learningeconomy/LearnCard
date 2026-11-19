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
| `hcp.v1.entries.accept`   | `POST /hcp/v1/entries/accept`     | none (LearnCard addition)       | subject only                                                    |
| `hcp.v1.grants.create`    | `POST /hcp/v1/grants`             | §6.1.5 grant                    | subject only                                                    |
| `hcp.v1.grants.offer`     | `GET /hcp/v1/contract-offer`      | none (LearnCard addition)       | subject only                                                    |
| `hcp.v1.grants.list`      | `GET /hcp/v1/grants`              | §5.4 List grants                | subject only                                                    |
| `hcp.v1.grants.get`       | `GET /hcp/v1/grants/{grantId}`    | §5.2.6 Read own grant           | subject, or the grant's client                                  |
| `hcp.v1.grants.revoke`    | `DELETE /hcp/v1/grants/{grantId}` | §6.2 Revoke / §5.2.7 Relinquish | subject, or the grant's client                                  |
| `hcp.v1.entries.list`     | `POST /hcp/v1/entries/list`       | none (LearnCard addition)       | subject only                                                    |
| `hcp.v1.audit.list`       | `POST /hcp/v1/audit`              | §8.3 Read audit log             | subject only                                                    |
| `hcp.v1.export`           | `POST /hcp/v1/export`             | §5.4.1 Export                   | subject only                                                    |

Wire types live in `schemas.ts`; read it alongside this table.

### Who is calling

Every procedure except `meta` uses the brain's DID-auth chain with a valid challenge
(`privateScopedRoute`: no request input is attached to Sentry).

- **Context Subject**: the caller has a LearnCard profile and sends no `grantId`. Its
  subject id is the profile's stored `did` (`profile.did`). For a normal profile
  that is its did:key. It is not the did:web
  (`did:web:<domain>:users:<profileId>`) that `getProfile` and other profile routes
  return. `entries.create` must name the subject id in `subject.id`. A Management
  Client reads it from `entries.list` (`subject.id`). A Context Client reads it from
  its grant (`subject.id`).
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
   when `assertedBy.id` is the authenticated caller. A client's write lands as a
   suggestion unless its grant has `canWrite: true` (see Suggestions below).
4. Clients receive **disclosures** (§7.4): a grant-scoped random `ref`, never the
   entry `id`, only the categories the grant covers, and `useUntil` capped at one
   hour (no revocation notification channel exists, §7.6 rule 4).
5. Revise appends an immutable version; a stale `expectedVersion` is
   `version-conflict` and changes nothing.
6. Withdraw sets status `deleted` (soft): hidden from clients, kept for the subject
   and export. Withdraw and revoke are idempotent and record one event.

### Categories

A category is a Draft 3 §4.5 registered slug (the 9 in registry version 1) or a
**custom category**: an absolute URI under a domain its definer controls. v1 accepts
a custom category when it is an `https:` or `http:` URI whose host is a DNS name
(not an IP or a single label, not the spec's `hcp.example` namespace, §1.7), with no
userinfo, in canonical form (`new URL(id).href === id`, so `https://LearnCard.com`
is rejected; write `https://learncard.com/`). Anything else, including an
unregistered slug, is `malformed-request`.

- Custom categories are matched as exact strings everywhere: grants, queries,
  disclosures, stores. Lists are ordered registry-first, then custom sorted.
- A subject query with no `categories` has no category filter, so it finds custom
  entries; `categoriesSearched` is the registered set plus custom categories found.
  A client query with no `categories` still searches exactly what its grant reads.
- Custom categories appear in a grant's `access` but never in `scopes` (§6.1.1:
  their colons would make a scope string ambiguous).
- `meta.supported_categories` lists only the registered categories: custom ones
  are per subject and `meta` is public. `meta.custom_categories` (LearnCard
  addition) says how they are accepted and declares them `high` sensitivity
  (§4.5: never `low`; v1 cannot know what an arbitrary one holds).

### Errors

Errors are Draft 3 §5.5 Core errors, `{ type, detail }`. The service throws
`HcpV1Error`; `router.ts` maps every failure on an HCP route once, including the
two the transport raises before the service runs:

| `type`              | tRPC code      | HTTP | Raised by                                         |
| ------------------- | -------------- | ---- | ------------------------------------------------- |
| `malformed-request` | `BAD_REQUEST`  | 400  | the service, or input schema validation           |
| `invalid-token`     | `UNAUTHORIZED` | 401  | the DID-auth chain or a missing `hcp:*` API scope |
| `scope-denied`      | `FORBIDDEN`    | 403  | the service                                       |
| `version-conflict`  | `CONFLICT`     | 409  | the service                                       |

The Core error is `data.hcp` in both the tRPC error shape and the OpenAPI error
body (the brain `errorFormatter` copies it; other routes get no `data.hcp`). The
message is the detail. Schema failures keep `issues` in the OpenAPI body.

```json
{
    "message": "expectedVersion is not the entry's current version.",
    "code": "CONFLICT",
    "data": {
        "code": "CONFLICT",
        "httpStatus": 409,
        "path": "hcp.v1.entries.revise",
        "hcp": {
            "type": "version-conflict",
            "detail": "expectedVersion is not the entry's current version."
        }
    }
}
```

Every not-authorized outcome has the same detail, so a response never says whether
an entry exists. Statuses follow the brain's tRPC mapping, not the §9.7 HTTP binding
(which would make `malformed-request` 422 and use `application/problem+json`): see
`conformsTo` below.

### Audit atomicity

Every store method that changes an entry or grant (`insertEntry`, `appendVersion`,
`transitionEntryStatus`, `insertGrant`, `transitionGrantStatus`) takes the audit
event that records the change and writes both in one Neo4j transaction: they commit
together or not at all, and a change that does not happen (`false`) writes no event.
This covers create, revise, withdraw, lazy entry expiry, grant issue, revoke and
lazy grant expiry. The memory store checks the event before it mutates anything.
`ActivitySink` is only for events with no state change of their own:
`context.exported` and the access log (`context.read` and read denials, below).
Lifecycle events never go through it.

### Access log (LC-2422)

Every query and get entry appends a Draft 3 §8.1 `context.read` before the result
is returned, the subject's own reads included (§8.1 says "any query or get entry";
the app's My info uses `entries.list`, which is not a §5.2 read and logs nothing).
v1 declares synchronous audit durability (§8.4), so if the event cannot be
recorded, the read fails and returns nothing.

A `context.read` carries the §8.2 members: `participants.retrievalId` (the result's),
`purpose`, `purposeDescription`, `grantId`, `entryId` (get only), `categories` (those
disclosed; to a client, only those its grant covers), and `disclosed`: each entry's
stable `id`, `version` and, for a client, `useUntil`. `data` holds `maxEntries` and
`categoriesSearched` (query) and `directives` (always empty in v1). The log names
entries by id, never the client's `ref`, and never records the query text.

Draft 3 has no denial event. When a client is refused a read under a grant issued
to it (expired or revoked grant, a category or purpose the grant does not cover, an
entry out of reach), v1 appends the LearnCard extension event
`https://learncard.com/hcp/v1/events/read-denied` (`READ_DENIED_EVENT`; a URI, as
§A.3 asks of custom values) with `purpose`, `purposeDescription`, the requested
`categories`, `entryId` where the `ref` names one under that grant, and `data`
`{ operation: 'query' | 'get', reason: 'outside-grant', grantStatus }`. The
response is the same `scope-denied`.

A caller presenting a grant id that exists but was issued to another client is
logged the same way in that grant's subject's log, with the caller's DID as the
`context-client` initiator and `data.reason: 'not-grant-client'`. Its `ref` is not
resolved (a stranger holds no refs under the grant), so `entryId` is null. The
response is the same `scope-denied`, so the caller learns nothing about the grant.
A caller with no grant or an unknown grant id is refused with no event: it names no
subject whose log should hold it. Nor is the subject presenting their own grant id
logged; they are refused as any other non-client caller.

### Contract grants (LC-2421)

A ConsentFlow contract may carry an optional HCP section (`contract.hcp`, typed as
`ConsentFlowContractHcpValidator` in `@learncard/types`):
`{ agents, categories, actions: ['read'], purposes, duration: '1h' | '4h' | '24h' | 'ongoing' }`.
The contract is owned by the operator's LearnCard profile; `agents` names the DIDs
that may act under it. `actions` is read only; contract grants never get `canWrite`.

- `grants.offer({ contractUri })` returns what allowing would grant, resolved by the
  brain: the contract's name, owner profile, version, agents, access and duration.
  The consent screen shows that name and owner instead of a self-asserted name.
- `grants.create({ client: { id }, source: { type: 'consentflow', contractUri,
contractVersion } })` issues the grant. Only the agent DID and the version the
  person reviewed come from the request; access, duration and the client name come
  from the contract. A contract that moved past that version is `version-conflict`;
  an agent the contract does not name, or a contract without an HCP section (gone,
  retired or expired), is `malformed-request`.
- The grant stores the resolved access, `source.contractUri` and
  `source.contractVersion` (its pin). `ongoing` is `persistent`; the others are
  `temporary`, capped by the contract's `expiresAt`.
- Every use narrows the pinned access by the contract's current section
  (`service/contracts.ts` `effectiveGrant`, from `resolveActor` and the grant views):
  categories, actions and purposes are intersected, a shorter duration or the
  contract expiry pulls in the end, and a contract that is gone, retired, expired,
  without its section, or no longer naming the agent leaves no access. So a narrowing
  (`relaxed`) version applies to existing grants at once, and a widening version
  reaches no further than the pin. A later version that adds back something the pin
  already held reaches the grant again: the person allowed it.
- Allowing the contract again issues a new grant pinned to the current version and
  revokes the earlier ones for that agent and contract (`grant.revoked` with
  `data: { reason: 'superseded', supersededBy }`).
- Versioning reuses LC-2194: an HCP change creates a contract version like any
  other. `classifyHcpChange` (`@learncard/helpers`) classifies it; anything that
  reaches further (new agent, category, action or purpose, a changed purpose
  description, a longer duration) needs a `reason`, as asking for more does today.
- HCP grants are not ConsentFlow terms: allowing creates no terms, and an HCP change
  stays out of the version's `kind`, so it never moves terms holders to
  `needs_reconsent`. An HCP-only change still bumps the version and records the usual
  update for terms holders, with an empty scope diff.

### Suggestions (LC-2423)

A client with `write` suggests by default. The grant's `canWrite` (set only by a
direct grant: `grants.create({ ..., canWrite: true })` with a `write` action; contract
grants are always `false`) decides, through the `WritePolicy` seam
(`service/seams.ts` `grantWritePolicy`):

- `entries.create` from a client without `canWrite` stores the entry with status
  `suggested` (a LearnCard addition to §4.6 statuses) and records `context.created`
  with `data.suggested: true`. With `canWrite` it is `active`, as before.
- Suggested entries are invisible to every client read (`query`, `get`), including
  the suggesting client's, until the person accepts. The subject sees them in
  `entries.list` and export.
- `entries.accept({ entryId })` (subject only) moves a suggestion to `active` and
  records `https://learncard.com/hcp/v1/events/suggestion-accepted`. Accepting an
  active entry is a no-op; anything else is `malformed-request`.
- Dismiss is `entries.withdraw` by the subject. A client without `canWrite` may
  revise or withdraw only suggested entries (in categories it can write), never
  active ones.
- Grants issued before LC-2423 read as `canWrite: false`.

### Profile delete

Deleting a profile deletes all of that person's HCP data, keyed by the profile DID
(the same `profile.did` the router uses as `subjectDid`): entries and every version,
grants where they are the subject, refs under those grants or to those entries, and
their audit events. `accesslayer/profile/delete.ts` calls
`deleteHcpDataForSubject` (from `src/hcp/index.ts`) first. The cascade is one
transaction; if it fails, the profile delete fails and the profile stays, so
nothing is orphaned and the delete can be retried. The audit log goes with the
person: nothing about them remains. A new HCP version adds its store to
`deleteHcpDataForSubject`.

## Layout

```
src/hcp/
  index.ts              hcpRouter = { v1 }; deleteHcpDataForSubject (profile delete)
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

- Only `src/app.ts` (the router) and `src/accesslayer/profile/delete.ts` (the
  cascade) import `src/hcp`, and only its index; nothing outside `src/hcp` imports
  `src/hcp/v1`.
- Inside v1, brain internals are imported only by `ports.ts`, `store/neo4j.ts`
  (`@instance`) and `router.ts` (`@routes` builders).
- Versions never import each other.
- Neo4j: v1 owns `HcpV1ContextEntry`, `HcpV1EntryVersion`, `HcpV1EntryRef`,
  `HcpV1Grant`, `HcpV1Event`, and draws no relationship to other brain nodes. Subject
  and client are DID properties.

`structure.test.ts` fails on any violation.

## Seams (stubbed, not built)

| Seam          | Where              | Today                                             | Follow-up                                 |
| ------------- | ------------------ | ------------------------------------------------- | ----------------------------------------- |
| `WritePolicy` | `service/seams.ts` | suggest unless the grant has `canWrite` (LC-2423) | richer policy (per category, rate limits) |

## Decisions

- Neo4j labels stay version-named (`HcpV1*`). A future v2 gets its own `HcpV2*`
  labels and a one-time copy of v1 data, not a shared or migrated label set.

## Before real users

- **Schema by migration.** Constraints and indexes are created lazily on the first
  query (`store/neo4j.ts` `ensureSchema`). Create them in a migration instead.
- **Query paging.** A query considers only the 500 most recently updated entries
  (`QUERY_CANDIDATE_LIMIT`); older ones are never found. Page through all of them.
- **Entry list paging.** `entries.list` returns the 500 most recently updated entries
  (`LIST_ENTRIES_LIMIT`) and sets `truncated`. Add a cursor.
- **Non-matching entries.** Lexical ranking orders entries but drops none, so a
  query can return entries that share no term with it. Return only matches.

## Not in v1

Out of scope by decision: consent-flow templates, semantic search, identity proofs.
Not implemented yet (Draft 3 has them): Idempotency-Key (§9.6), onward sharing and
`context.shared` (§5.2.8), standing rules and directives (§6.3, §6.4), confirmation
(§3.8), recategorize and restrict purposes,
hard delete and import (§5.4), narrowed grants (§6.1.5.1), the `provenance` action
(§7.4.1), relationships and conflicts (§4.2.3, §4.7), VC evidence ingest (§14),
OAuth AS + PRM live under `src/hcp/oauth/` (Unit 1) and MCP §10.3 tools under
`src/hcp/mcp/` (Unit 2); do not claim `bindings:["mcp"]` / oauth-interop
`conformsTo` until Unit 3 conformance tests pass. Onward-sharing audit
(`hcp_reportSharing`) is registered but returns not-implemented. Relevance ordering is `lexical` (§7.3).
`conformsTo` is not claimed: tRPC paths are not the Draft 3 HTTP binding.

## Management UI (LC-2424)

The app's screens live in `apps/learn-card-app/src/pages/hcp/`, and their hooks are in
`packages/learn-card-base/src/hcp/useHcp.ts`. They call this router through the network plugin's
`getHcpClient()`, which is the authenticated tRPC client typed from `AppRouter`. The signed-in
(or switched-to) profile is the Context Subject.

- Routes: `/hcp` (tabs My info, Apps with access, Activity) and `/hcp/connect`.
  Both sit behind the LaunchDarkly flag `enableHcp`. Vite dev builds always enable them.
  The entry point is a card on Privacy & data (`/privacy-and-data`).
- Consent link: `/hcp/connect?client=<agent DID>&name=<app name>&categories=<slug or
URI>,…&purpose=<why, plain text>[&purposeCode=<URI>][&duration=1h|4h|24h|ongoing]`.
    - Allowing creates one read-only grant: exactly the listed categories, one purpose,
      `temporary` for the duration (default `1h`), or `persistent` for `ongoing`.
    - The purpose code defaults to `https://learncard.com/hcp/purposes/app-access`. An
      agent must query with the same code.
    - `parseConsentLink` yields an `AccessRequest`. This link stays for agents
      without an operator profile (the demo agent's `link`).
- Contract link (LC-2421): `/hcp/connect?contract=<contract URI>[&client=<agent DID>]`.
  The screen loads `grants.offer`, shows the contract's name and "Offered by <owner>'s
  LearnCard account" in place of the unverified warning, and Allow grants under the
  version shown. `client` is needed only when the contract names several agents.

## Try it locally

You need a brain, a Neo4j it can use, and the app. Two ways to get them:

- **Docker compose stack.** From `apps/learn-card-app`, run `bun run dev`. It serves the
  brain on `localhost:4000` and the app on `localhost:3000`, which are the demo script's
  defaults.
- **Brain from source, on your own ports.** This is how LC-2424 was tested. It needs
  only Docker for Neo4j. Ports 4324, 3324 and 27687 are examples; pick any free ones.

    ```
    # 1. A throwaway Neo4j on 127.0.0.1:27687
    export NEO4J_PASSWORD=$(openssl rand -hex 16)
    docker run -d --name hcp-neo4j -p 127.0.0.1:27687:7687 \
      -e NEO4J_AUTH=neo4j/$NEO4J_PASSWORD neo4j:5

    # 2. The brain on :4324 (from services/learn-card-network/brain-service)
    #    SEED is the brain's own key: random, never reused.
    NODE_ENV=development IS_OFFLINE=true PORT=4324 DOMAIN_NAME=localhost%3A4324 \
      NEO4J_URI=bolt://127.0.0.1:27687 NEO4J_USERNAME=neo4j \
      SEED=$(openssl rand -hex 32) \
      bun --conditions=development src/docker-entry.ts

    # 3. The app on :3324 (from apps/learn-card-app). The first command writes the
    #    git-ignored public/tenant-config.json; then point it at your brain.
    bun scripts/prepare-native-config.ts learncard --stage local
    #    In public/tenant-config.json set apis.brainService to
    #    http://localhost:4324/trpc and apis.brainServiceApi to http://localhost:4324/api.
    bun run i18n:compile
    bun --conditions=development ../../node_modules/vite/bin/vite.js --port 3324 --strictPort --host 127.0.0.1
    ```

    Plain `npx vite` can't load the app config unless `@learncard/helpers` has a built
    `dist/`. Either run Vite under `bun --conditions=development` as above, or build
    helpers first with `bunx nx build helpers`.

    `docker-entry.ts` listens on `0.0.0.0`, so the brain is reachable from your LAN.
    Keep only test data in it. Other services (cloud, AI) are not needed for these
    screens. Rerun `prepare-native-config.ts` to undo the config change.

Then, with `HCP_BRAIN_URL` and `HCP_APP_URL` set to your brain and app (defaults:
`http://localhost:4000/trpc` and `http://localhost:3000`):

1. Sign in with a test account. Open Privacy & data, then "Apps that can see your info"
   (or go to `/hcp`). Add something under My info, under Goals or Learning.
2. Make an agent and its consent link, from the repo root:

    ```
    HCP_BRAIN_URL=http://localhost:4324/trpc HCP_APP_URL=http://localhost:3324 \
      bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts link
    ```

    `--conditions=development` is required. Without it, Bun looks for the packages'
    unbuilt `dist/` and fails with `Cannot find module '@learncard/init'`.

    The agent's did:key comes from a random seed. The seed is created on first run and
    kept in `$TMPDIR/lc-hcp-demo-agent.seed` (mode 0600). It is never printed. Run
    `link` and `read` with the same `$TMPDIR`, or `read` is a different agent and gets
    `scope-denied`. The command prints the full link, which looks like:

    ```
    http://localhost:3324/hcp/connect?client=did%3Akey%3Az6Mk…&name=Demo+Tutor&categories=goals_and_constraints%2Ceducation_learner_profile&purpose=Help+you+study&purposeCode=https%3A%2F%2Fdemo-tutor.example%2Fpurposes%2Fstudy-help&duration=1h
    ```

    Signed out, the link goes to `/login?redirectTo=<the link>`. Email sign-in returns
    there; the dev seed-phrase import goes to `/wallet`, so open the link again after it.

3. Open the link and choose Allow. Demo Tutor then shows under Apps with access, and
   Activity shows "You let Demo Tutor see your Goals and Learning".
4. Optional: read as the agent, with the same env as step 2:

    ```
    HCP_BRAIN_URL=http://localhost:4324/trpc \
      bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts read '<grantId>'
    ```

    An agent can't list its own grants (Draft 3 §5.4), so `read` needs the id. The
    screens don't show grant ids; copy `grantId` from the `hcp.v1.grants.list` response
    in the browser's network tab. The agent sees only Goals and Learning, so `[]` means
    nothing is saved under those two yet. Activity then shows "Demo Tutor saw your Goals
    and Learning", or "Demo Tutor looked in your Goals and Learning and found nothing".

5. Choose Stop sharing. Activity then shows "You stopped sharing with Demo Tutor", and
   `read` now fails with `scope-denied`. That refused read shows in Activity as "Demo
   Tutor asked for info it isn't allowed to see and got nothing".

`bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts smoke` runs the same flow over the API with a throwaway person,
and fails unless the person's log holds the agent's `context.read` (matching what it received) and the refused read after Stop sharing.
The script refuses any brain that is not on localhost.

Contract consent (LC-2421), with the same env:

1. `bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts contract` makes a
   throwaway operator profile ("Demo Tutor Co", seed never saved or printed) that owns
   a contract whose HCP section names the agent, and prints its link:
   `http://localhost:3324/hcp/connect?contract=lc%3Anetwork%3A…%3Acontract%3A<id>`.
2. Open it signed in. The screen says "Demo Tutor would like to see some of your info"
   and "Offered by Demo Tutor Co's LearnCard account." Choose Allow; Demo Tutor shows
   under Apps with access.
3. `read '<grantId>'` reads as the agent, as above.

`... hcp-demo-agent.ts contract-smoke` runs the contract flow over the API: allow,
narrow the contract (the existing grant loses a category at once), widen it (the
existing grant keeps its pin), allow again (the new grant gets the wider access and
the old one is revoked), and a DID the grant was not issued to gets `scope-denied`.

Suggestions (LC-2423), with the same env:

1. `... hcp-demo-agent.ts suggest-smoke` runs it over the API with a throwaway person:
   a grant with `write` but no `canWrite`, so the agent's write comes back with
   `suggested: true` and the agent reads nothing; the person accepts it and the agent
   reads it; a second suggestion is dismissed; a grant with `canWrite: true` writes
   directly.
2. Hand-test in the app: `suggest-link` prints a consent URL with `suggest=1`. Open it
   signed in and Allow — the screen says the app can look and suggest additions. Copy
   `grantId` from the `hcp.v1.grants.list` network response, then
   `suggest '<grantId>'` (optional text after the id; default "Practice fractions twice
   a week"). The JSON includes `suggested: true`. In My info the entry shows as
   "Suggested by an app" with Accept and Dismiss; Activity says "Demo Tutor suggested
   info for your Goals" and, after Accept, "You accepted a suggestion for your Goals".

## Tests

```
# unit: service against the memory store, memory store contract, coupling rules
bunx vitest run --config vitest.config.ts src/hcp

# Neo4j (testcontainers, needs Docker): store contract, router through appRouter,
# Core errors over HTTP, profile delete cascade
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
