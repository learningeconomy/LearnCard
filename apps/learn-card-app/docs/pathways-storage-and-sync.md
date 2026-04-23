# Pathways — Storage, Sharing & Sync

> **Status:** Design note, not yet built. Pathways currently live in a
> client-only Zustand store. This doc captures the intended server-side
> shape so the wire-up, when we're ready for it, doesn't require
> re-deciding the fundamentals. Companion to
> [`pathways-architecture.md`](./pathways-architecture.md) — read that
> first for the in-app data model and agent pipeline; this doc focuses
> strictly on *where state lives* and *how it moves*.

---

## 0. TL;DR

- **Primary store: `learn-cloud-service` (MongoDB).** Pathways are
  user-owned documents. They sit next to credentials and xAPI records,
  where agents already read from.
- **Edge index: `brain-service` (Neo4j).** A lightweight `Pathway`
  pointer node participates in the social graph — authorship, sharing,
  app-listing references, composition, outcome-credential types. No
  pathway content lives here.
- **Sharing re-uses `ConsentFlowContract`.** The same primitive that
  gates app access gates pathway access. Humans with write-propose
  scope become first-class authors in the same proposal queue agents
  use.
- **App listings become semantically legible to agents** via a
  `snapshot` field on `app-listing` actions plus `semanticTags` on the
  listing itself. Vector embeddings come later.
- **Sync is revision-based with optimistic concurrency.** Last-writer-
  wins for whole-pathway upserts; structural conflicts surface as
  proposals in the existing queue, not as a new conflict UI.

---

## 1. The stack we're designing into

Two services with clean, non-overlapping responsibilities today:

### `brain-service` — the identity + social graph (Neo4j only)

- `Profile`, `AppStoreListing`, `Integration`, `Boost`,
  `SigningAuthority`, `ConsentFlowContract`
- Edges: `CREATED_BY`, `PUBLISHES_LISTING`, `INSTALLS`, `CONSENTED_TO`,
  `ENDORSES`
- Best at: "who knows what", "who has access to what", "what
  references what"
- Worst at: whole-document CRUD, append-only logs, blob-adjacent
  metadata

### `learn-cloud-service` — user-owned document storage (MongoDB)

- `Credential` (encrypted VC JWE blobs)
- `CredentialRecord` (encrypted credential index with xAPI metadata)
- `CustomDocument` (arbitrary user-owned encrypted documents, keyed by
  `did + cursor`)
- `User`
- DID-authenticated via `didAndChallengeRoute`
- Per-user size quota (`MAX_CUSTOM_STORAGE_SIZE`)
- Change-stream-ready (Mongo replica set)
- Best at: per-user document CRUD, encrypted-at-rest, paginated
  indexing, append-only writes
- Worst at: cross-user graph traversal

### Why this matters for pathways

Pathways are **user-owned authored documents with an attached graph of
references to shared entities**. That shape is *native* to the split
we already have:

- The **document half** (nodes, edges, progress, evidence, FSRS state)
  belongs where credentials already live — in learn-cloud-service.
  Agents that read pathways also read credentials and xAPI; colocation
  means one transport, one auth hop, one trust boundary.
- The **graph half** (who authored, who's working on it, what it
  references, who it's shared with, what outcomes it expects) belongs
  in the brain-service graph, where the equivalent queries for Boosts
  and Listings already run.

This is the same architectural pattern brain-service + learn-cloud
already use for Boosts (graph node in Neo4j, issuance records + VC
blobs in learn-cloud). Pathways slot into it.

---

## 2. Data model

### 2.1 learn-cloud-service (MongoDB, primary store)

#### Collection: `pathway`

One document per pathway, owned by one DID. Encrypted at rest using
the same envelope pattern as `CredentialRecord` / `CustomDocument`.

```ts
// Conceptual — Zod schemas live in @learncard/pathways-types
// (promoted from apps/learn-card-app/src/pages/pathways/types once stable).

export const MongoPathwayValidator = z.object({
    // Identity --------------------------------------------------------
    pathwayId: z.string().uuid(),          // stable across revisions
    ownerDid: z.string(),                  // primary auth key
    revision: z.number().int().nonnegative(), // monotonic; bumped on every write

    // Sync metadata ---------------------------------------------------
    schemaVersion: z.number().int().positive(), // doc-level migration hinge
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().optional(), // soft-delete for sync clients

    // Content — the Pathway doc from pathways-architecture.md § 3 ----
    // Encrypted as a whole blob using the same JWE envelope
    // CredentialRecord uses today. Index fields above stay in the
    // clear so learn-cloud can paginate / query without decrypting.
    payload: EncryptedPathwayValidator, // JWE<Pathway>

    // Denormalized index fields (cleartext) ---------------------------
    // Keep to the minimum the list view needs; everything else lives
    // inside the encrypted payload. These exist so `listPathways` can
    // page without decrypting every document.
    title: z.string(),
    status: z.enum(['active', 'paused', 'completed', 'archived']),
    nodeCount: z.number().int().nonnegative(),
    outcomeCredentialTypes: z.array(z.string()), // for server-side VC match
    referencedListingIds: z.array(z.string().uuid()),
});
```

**Why encrypted payload + cleartext index.** Matches the
`CredentialRecord` pattern in
`@/Users/jackson/Documents/Projects/LEStudios/LearnCard/services/learn-card-network/learn-cloud-service/src/models/CredentialRecord.ts`.
The cleartext fields are ones the *server itself* needs to act on
(list, match VCs to outcomes, count for quota). Everything else — node
descriptions, learner notes, evidence URLs, FSRS state — stays
encrypted. The learner's local `pathwayStore` is the only place the
whole thing sits decrypted.

**Indexes (MongoDB):**

- `{ ownerDid: 1, updatedAt: -1 }` — paginated "my pathways"
- `{ ownerDid: 1, pathwayId: 1 }` (unique) — direct read
- `{ outcomeCredentialTypes: 1 }` — VC-match webhook (server-side
  credentialBinder)
- `{ referencedListingIds: 1 }` — "which pathways use this app"
  analytics + listing-retirement surveys
- `{ ownerDid: 1, status: 1, updatedAt: -1 }` — active-pathway filter

#### Collection: `pathway-proposal`

Proposals live in their own collection keyed by pathway and author.
Agents + humans both write here via the same RPC; the accept/reject
verbs both mutate `pathway` docs through the existing `applyProposal`
logic.

```ts
export const MongoPathwayProposalValidator = z.object({
    proposalId: z.string().uuid(),
    pathwayId: z.string().uuid().nullable(), // null = cross-pathway / new
    ownerDid: z.string(),                     // whose pathway it targets
    authorDid: z.string(),                    // who authored it (may === ownerDid)
    authorKind: z.enum(['agent', 'human']),
    agent: z.string().optional(),             // planner | coach | ... (if agent)
    status: z.enum(['open', 'accepted', 'rejected', 'expired']),

    // Content
    payload: EncryptedProposalValidator,      // JWE<Proposal>

    // Index
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    targetRevision: z.number().int().nonnegative(), // revision the diff was computed against
});
```

**Cross-device correctness.** The client's existing
`invalidateStale(latestById)` logic at
`@/Users/jackson/Documents/Projects/LEStudios/LearnCard/apps/learn-card-app/src/stores/pathways/proposalStore.ts:50`
already handles the "Device A accepted, Device B still sees open"
case — the server just needs to answer "what's the latest status per
proposal id?" on reconnect. That's a single paginated query with a
`since` cursor.

#### Collection: `pathway-version` *(optional, enables time-travel)*

Append-only log of applied diffs. Not needed for v1; priceless when we
want "show me what this pathway looked like a month ago" or "undo the
last three proposals."

```ts
export const MongoPathwayVersionValidator = z.object({
    pathwayId: z.string().uuid(),
    ownerDid: z.string(),
    revision: z.number().int().positive(),
    appliedAt: z.string().datetime(),
    source: z.enum(['learner', 'proposal', 'migration']),
    proposalId: z.string().uuid().optional(), // if source === 'proposal'
    diff: EncryptedDiffValidator,              // JWE<PathwayDiff>
});
```

Separate collection so the hot path (reading current pathway) doesn't
page in history. Retention policy: keep last N revisions or last M
days, whichever first.

#### Evidence blobs

Node evidence (uploaded artifacts) points at blob refs, not inlined
content. Re-use the existing credential blob flow:
learn-cloud-service's `Credential` collection already handles JWE
storage of up-to-N-MB blobs with per-DID quota; evidence is a
degenerate case. Keep `Evidence.uri` opaque (`learncloud://blob/<id>`
or signed S3/R2 URL) so the storage backend is swappable.

### 2.2 brain-service (Neo4j, edge index)

A lightweight `Pathway` node exists here *only* to participate in the
graph. All content lives in learn-cloud.

```cypher
// Identity
(:Pathway {
    pathwayId: string,
    ownerDid: string,
    revision: integer,         // for sync coordination / freshness
    title: string,             // denormalized for display in graph queries
    status: string,            // active | paused | completed | archived
    visibility: string,        // self | shared | public
    updatedAt: datetime,
    lcUri: string              // where to fetch the full doc from learn-cloud
})

// Authorship + progress
(:Profile)-[:AUTHORED]->(:Pathway)
(:Profile)-[:WORKING_ON {progressPct, updatedAt}]->(:Pathway)
(:Profile)-[:FORKED_FROM]->(:Pathway)        // template -> instance

// References into the listing graph
(:Pathway)-[:REFERENCES {nodeId, role}]->(:AppStoreListing)

// Composition
(:Pathway)-[:COMPOSES {renderStyle}]->(:Pathway)  // inline-expandable | link-out

// Outcome expectations — drives the server-side credential matcher
(:Pathway)-[:EXPECTS_OUTCOME {outcomeId, credentialType, minTrustTier}]->(:CredentialType)

// Sharing — reuses ConsentFlowContract pattern
(:Profile)-[:HAS_ACCESS]->(:ConsentFlowContract)-[:GRANTS_ON]->(:Pathway)

// Endorsements (already foreshadowed by EndorsementRef in the schema)
(:Profile)-[:ENDORSES {nodeId, signedAt}]->(:Pathway)
```

**What this enables that Mongo-alone wouldn't:**

- "Which pathways reference `AWS Practice Studio`?" → single edge walk
- "Which learners are working on pathway X?" → single edge walk
- "This pathway composes that pathway composes that one — is the whole
  tree complete?" → bounded traversal
- "What pathways does Mentor Y have visibility into?" → consent graph
  walk, same shape as "what apps has Learner Z consented to"
- "Find pathway templates similar in shape to this one" → graph
  similarity scaffolding (combined with vector embeddings later)

**What it deliberately doesn't hold:** no node list, no edge list, no
stages, no evidence, no FSRS state, no progress detail. Those all stay
in learn-cloud. Keeping the Neo4j node tiny keeps writes cheap (two
writes per structural change — one to each store, coordinated via an
outbox pattern or a single brain-service RPC that fans out).

### 2.3 Fan-out and consistency

The client never writes to both stores directly. One RPC per logical
operation, brain-service orchestrates:

```
Client -> brain-service.pathway.upsert(pathway)
            -> learn-cloud: upsert pathway doc (authoritative revision)
            -> Neo4j: MERGE (:Pathway) + edges (REFERENCES, EXPECTS_OUTCOME)
            -> return { revision }
```

Consistency semantics:

- **Authoritative revision** lives in learn-cloud (Mongo doc).
  Neo4j's `revision` is *advisory* — it's a freshness hint for graph
  queries, not a source of truth. If the two drift (network hiccup
  between the two writes), a reconciliation job catches up.
- **Failure mode:** learn-cloud write succeeds, Neo4j write fails →
  log and retry. Neo4j missing an edge for five seconds is fine; the
  learner sees their pathway either way.
- **Failure mode:** learn-cloud write fails → RPC errors, client
  retains local unsynced state, offline queue re-attempts.

Don't reach for a distributed transaction. Outbox pattern is enough.

---

## 3. Sharing — one primitive, human and machine authors

Sharing is a consent contract, not a new subsystem. The
`ConsentFlowContract` shape brain-service already uses for
`AppStoreListing` access gets extended with a pathway-scoped schema:

```ts
type PathwayShareScope = {
    read: {
        structure: boolean;    // node list, edges, titles
        progress: boolean;     // completion status, timestamps
        evidence: boolean;     // uploaded artifacts
        proposals: boolean;    // open proposals, accepted/rejected history
    };
    write: {
        propose: boolean;      // viewer can emit proposals into the queue
        endorse: boolean;      // viewer can sign off on terminations
    };
    expiresAt?: string;
    role: 'guidance-counselor'
        | 'guardian'
        | 'teacher'
        | 'mentor'
        | 'peer'
        | 'institution';
};
```

**The key insight:** humans with `write.propose: true` become first-
class authors in the same queue agents write to. A counselor
suggesting "add a prep node before the exam" is structurally identical
to the Planner agent suggesting it — a `Proposal` with
`authorKind: 'human'`, `authorDid: counselor.did`, landing in the
learner's existing proposal queue, reviewed in the existing UI,
subject to the existing accept/reject/modify verbs. One code path, one
audit log.

**Guardian semantics** stay special: guardians write on-behalf-of, not
propose-and-approve. Already modeled in brain-service via
`GuardianConsent`; extend analogously, surface it in UI with a clear
"your guardian edited this directly" affordance vs "your mentor
proposed a change."

**Endorsements** are the read-write flip: a viewer with
`endorse: true` cryptographically signs off on a node's completion,
bumping that node's trust tier from `self` → `trusted`. Already
foreshadowed by `EndorsementRef` at
`@/Users/jackson/Documents/Projects/LEStudios/LearnCard/apps/learn-card-app/src/pages/pathways/types/pathway.ts:25`.

**Delegated reads** (guidance counselor dashboard, parent/guardian
view) are scoped queries against learn-cloud with a consent-check on
brain-service: "give me learner X's active pathways *where
counselor.did has read.structure* for each". The consent check is
identical in shape to "does this app have permission to read
credentials of type Y"; the RPC surface is a near-copy.

---

## 4. Making app listings legible to agents

**The current problem.** `action.listingId: 'uuid'` is opaque. An
agent looking at a pathway sees bare UUIDs where semantics should be.

**Three layers. Ship layer 1 now, layer 2 next, layer 3 when we're
ready for embeddings.**

### Layer 1: Snapshot at bind time (do now — cheap, critical)

When a node is authored and linked to a listing, snapshot a tiny
window of listing metadata into the action itself:

```ts
// types/action.ts — ActionDescriptor<'app-listing'> extension
{
    kind: 'app-listing',
    listingId: 'uuid',
    snapshot: {
        displayName: 'Coursera — AWS Cloud Essentials',
        category: 'Learning',
        launchType: 'DIRECT_LINK',
        tagline: 'Learn the fundamentals of AWS cloud.',
        snapshottedAt: '2026-04-23T15:30:00Z',
    },
}
```

**~200 bytes per action. Earns its weight three ways:**

1. **Agents read pathway → understand intent immediately.** No
   hydration hop, no listing-refetch per prompt.
2. **Author intent survives listing drift.** If the Coursera listing
   mutates ("Coursera Plus — 2025 edition"), the pathway's original
   authorial intent is preserved in the snapshot.
3. **Works offline.** Pathway makes sense without a network round-trip
   to brain-service.

A background job refreshes snapshots when the underlying listing
changes materially (display_name, category, launch_type). The refresh
is a proposal to the learner, not a silent mutation — drift is a
*signal* the node author should review.

### Layer 2: Semantic tags on listings (do next)

`AppStoreListing` already has a `category` (single-valued). Add
`semanticTags: string[]` — author-provided, LLM-back-fillable:

```
coursera:        ["video-lecture", "passive", "cloud-fundamentals", "beginner", "2-week-commitment", "aws"]
practice-studio: ["practice-exam", "active", "timed", "cloud-certification", "aws"]
cloud-coach:     ["ai-tutor", "interactive", "adaptive", "1-on-1", "aws"]
```

**Three things this powers:**

- **Agent reasoning.** Coach can say "node 1 is passive, node 2 is
  active — good cognitive sequencing."
- **Planner discovery.** "Find a practice-exam app for AWS
  certification" is a tag query, not a full-text search.
- **Cross-pathway analytics.** "How often does a `passive` node
  precede an `active` node?" — one Neo4j query against the listings
  graph.

Tags live on the listing in Neo4j (authoritative) and are pulled into
the `snapshot.semanticTags` at bind time (so agents get them without
a hop).

### Layer 3: Pathway embeddings (later)

One embedding per pathway computed from
`title + goal + node.title + node.description + action.snapshot +
outcome.label`. Stored in a vector index (Atlas Vector Search is a
natural fit since the docs already live there; Qdrant if we grow out
of Atlas).

**Enables:**

- Onboarding template match ("these three templates are closest to
  what you described")
- Coach reflection ("you've completed three pathways in this shape —
  ready to level up?")
- Cross-learner discovery with explicit opt-in ("learners with
  similar pathway shapes also pursued...")

Don't build this until we have N > ~50 authored pathways in the
system to make the similarity meaningful. Plumb the field now
(embedding is a property of the pathway doc, recomputed async on
write); populate later.

---

## 5. Sync + concurrency

### 5.1 Revision-based optimistic concurrency

Every `Pathway` carries a monotonic `revision: number`. Every write
bumps it. The RPC is CAS-shaped:

```ts
upsertPathway({
    pathway: Pathway,
    ifRevision?: number,  // expected current revision; omit to force
}) -> { revision: number } | { conflict: { currentRevision } }
```

- Single-device happy path: client sends `ifRevision = current`,
  server accepts, returns `current + 1`.
- Two-device conflict: Device A writes at revision 7, Device B (still
  at revision 6) writes with `ifRevision: 6`. Server rejects with
  `conflict: { currentRevision: 8 }`. Device B pulls, re-applies its
  local change as a fresh diff, re-submits.
- For structural (non-progress) conflicts this funnels into the
  **existing proposal queue**: Device B's rejected change materializes
  as a `Proposal` that Device A's user can accept / reject. No new
  conflict UI to build.

### 5.2 RPC surface (target shape — not to build yet)

```ts
// brain-service.pathway.*
list({ ownerDid, since?, cursor? }) -> PaginatedPathways  // index fields only
get({ pathwayId, revision? }) -> Pathway                  // full doc
upsert({ pathway, ifRevision? }) -> { revision } | Conflict
delete({ pathwayId, ifRevision? }) -> { revision }         // soft delete

// brain-service.pathway-proposal.*
list({ pathwayId? | ownerDid, status?, since?, cursor? }) -> PaginatedProposals
submit({ proposal, ifTargetRevision? }) -> { proposalId }
setStatus({ proposalId, status, ifStatus? }) -> { status } | Conflict

// brain-service.pathway-share.*
grant({ pathwayId, granteeDid, scope, expiresAt? }) -> { contractId }
revoke({ contractId }) -> void
list({ pathwayId }) -> Share[]   // who has what scope on this
```

All DID-authenticated the same way learn-cloud already authenticates
(`didAndChallengeRoute`). brain-service is the orchestrator — it talks
to Neo4j and learn-cloud on the client's behalf, enforces
ownerDid/consent gates at the boundary.

### 5.3 Offline

Client's existing `offlineQueueStore` becomes the queue of pending
RPCs. On reconnect:

1. Push queued writes in order, capturing conflicts.
2. For each conflict, re-apply the local intent as a diff against the
   new server revision.
3. If a diff can't merge cleanly (e.g., the node it edits was removed
   server-side), emit it as a proposal for user review rather than
   silently dropping.

Don't over-invest in CRDT semantics now. Last-writer-wins per pathway
+ proposal-queue spillover covers 95% of cases and is honest about
the 5%.

---

## 6. What to do NOW

Priority-ordered. Each item is self-contained and shippable ahead of
any server-side work — together they make the future wire-up a matter
of implementing RPCs, not refactoring schemas.

### 6.1 Must-do (small, cheap, unblocks everything)

1. **Promote pathway types to `@learncard/pathways-types`.** The
   Phase-1 promotion already flagged in
   `@/Users/jackson/Documents/Projects/LEStudios/LearnCard/apps/learn-card-app/docs/pathways-architecture.md`
   § 15. Until this ships, brain-service and learn-cloud can't import
   schemas without circular-deps. Move
   `@/Users/jackson/Documents/Projects/LEStudios/LearnCard/apps/learn-card-app/src/pages/pathways/types/`
   into a new package; everything else stays put for now.
2. **Add `revision: number` + `schemaVersion: number` to `Pathway`.**
   Bump revision in every `buildOps` mutation. Trivial now, central
   to sync later.
3. **Add `snapshot` to `app-listing` ActionDescriptor.** Populate in
   `setAction` when the caller provides a listing; populate in
   `devSeed.ts` when binding demo nodes. The Map + NodeDetail UI
   already fetches the listing for display — populate the snapshot
   from the same hook on first bind, persist into the pathway doc.
4. **Enforce `ownerDid` invariants end-to-end.** Audit every write
   path in `buildOps` / `pathwayStore` / `proposalActions` — every
   mutation should either be keyed by `ownerDid` or reject when
   `ownerDid` doesn't match the current user. Becomes the boundary
   auth check at RPC wire-up.

### 6.2 Should-do (small, makes demo and agents better now)

5. **Add `semanticTags: string[]` to AppStoreListing (brain-service
   schema).** Expose in the AppStoreDeveloper authoring UI. Seed the
   three demo listings with sensible tags. Thread tags through into
   `snapshot.semanticTags` at bind time.
6. **Add an explicit "pathway is JSON-serializable" property test.**
   No `Date` objects, no functions, no circular refs. Already nearly
   true (Zod-driven); a single round-trip property test locks it in.
7. **Write a `serializePathway` / `deserializePathway` pair with
   schemaVersion-based migrations.** Empty migrations today; the
   plumbing matters. First real migration will need it.

### 6.3 Consider-doing (still cheap; genuinely optional for v1)

8. **Stub the RPC surface in brain-service as `throw NotImplemented`
   routes.** Forces the trpc types + OpenAPI docs to exist; surfaces
   the shape to whoever is writing the client hooks next.
9. **Treat `offlineQueueStore` as the canonical sync queue, not a
   throwaway.** Document its invariants (FIFO, conflict-spills-to-
   proposal). When we wire the server, it becomes the outbox.
10. **Write a tiny end-to-end "round-trip" test fixture** — author a
    pathway, serialize, re-deserialize, verify structural identity +
    revision bump. Pin the shape.

### 6.4 Don't do now

- **Don't build a new sharing UI.** Consent-flow UX already exists for
  apps; extend when we wire, not before.
- **Don't compute embeddings.** Not enough pathways in the system to
  make similarity meaningful. Add the field plumbing when it's a
  week's work, not now.
- **Don't design CRDT semantics.** LWW + proposal spillover is fine
  until proven otherwise.
- **Don't migrate evidence blobs.** They're already URI-shaped;
  re-pointing at learn-cloud at wire-up is a string swap.

---

## 7. Open questions / deferred decisions

Things worth resurfacing when we pick this up:

- **Who holds the encryption key for the pathway payload?** Same
  pattern as `CredentialRecord` (learner-held, passphrase-derived)?
  Or a per-pathway DEK wrapped with learner KEK so shared viewers
  can be granted access without re-encrypting everything? The latter
  is more flexible for sharing; the former is simpler for v1.
- **Do proposals live encrypted or cleartext?** Encrypted would
  match the pathway doc; cleartext would let brain-service do simple
  content-based filtering ("give me only `structural` proposals").
  Leaning encrypted with a cleartext `kind` tag in the index fields.
- **Template vs instance as distinct collections, or a flag?** Leans
  flag for v1 (`isTemplate: boolean`); separate collections when
  template authoring becomes a first-class authoring surface.
- **xAPI integration.** Recorder agent naturally wants to read
  xAPI events and match them to pathway nodes ("learner just
  completed a practice exam in AWS Practice Studio → propose
  completion of node 2"). Needs a cross-reference: xAPI statement
  IDs that include `context.extensions.pathwayNodeRef`. Design at
  integration time, but note the hook now.
- **Brain-service + learn-cloud split transaction retries** — outbox
  table? Background reconciler? Pick when the first real production
  race condition happens.
- **Do we persist denormalized `snapshot` in the Neo4j `Pathway`
  pointer for cheaper display queries?** Maybe `title` and that's it.
  Keep the surface small.

---

## 8. Appendix — prior exploration

The earlier sketch proposed brain-service as the primary pathway
store with Mongo for docs. That sketch was *before* noticing that
learn-cloud-service already holds the user's documents (credentials,
xAPI, custom documents) and that brain-service is deliberately Neo4j-
only. The revised direction in this doc — learn-cloud primary, brain-
service for edges — is strictly better because:

- It puts pathways where the data agents already read from
  (credentials + xAPI) lives.
- It doesn't force brain-service to grow a Mongo dependency it
  doesn't have.
- It mirrors the existing Boost pattern (graph node in brain-service,
  artifact in learn-cloud) exactly.
- It honors the trust boundary learn-cloud already enforces: DID-
  authenticated, per-user quota, encrypted-at-rest.

Earlier alternatives considered and rejected:

- **Neo4j-primary for pathways.** Rejected: `buildOps` produces
  whole-document Immer mutations; translating them into node-level
  Cypher writes is a pure tax with no graph-query win for within-
  pathway traversal.
- **Mongo-primary with no Neo4j participation.** Rejected: loses
  cross-pathway graph queries (who references this listing, what
  templates are similar), which are the queries that justify our
  having Neo4j in the first place.
- **Custom storage collection re-use.** Considered: pathways could
  theoretically use `CustomDocument` directly. Rejected: pathways
  need cleartext index fields (title, status, outcomeCredentialTypes,
  referencedListingIds) that custom-storage doesn't have, and the
  VC-match webhook needs a collection it can index by
  `outcomeCredentialTypes`. Give pathways their own collection;
  share infrastructure (auth, encryption, quota) but not shape.
