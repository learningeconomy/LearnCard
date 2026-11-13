# CLR helpers

This directory owns CLR normalization, transcript display types, and reusable
presentation helpers for LearnCard App and other consumers such as ScoutPass.

- `normalize.ts` / `types.ts`: pure, source-preserving credential normalization.
- `selectors.ts`: subject selection, record identity, and profile/identifier access.
- `display.ts` / `display.types.ts`: projection of canonical records into the existing
  transcript UI contract. Call `createClrTranscriptDisplayModel(canonical)` when the
  credential has already been normalized, or `normalizeClrTranscriptDisplayModel(raw)`.
- `relationships.ts`: display relationships, conservative lookup, and navigation policy.
- `kind.ts` / `presentation.ts`: title heuristics, labels, formatting, grouping, and
  assessment summaries. These policies never modify canonical credential claims.
- `evidence.ts`: evidence metadata and actions delegated to the shared attachment opener.
- `renderer.ts` / `helpers.ts`: compatibility entry points for existing consumers.

App consumers import directly from this shared directory; the former app helper
files and component-level helper re-exports have been removed. New parsing logic
belongs here, not in a component or another app helper. Core imports from this
directory's `index.ts` do not load UI presentation or native attachment dependencies.

## Model boundaries

Each embedded credential occurrence remains a separate record. Matching top-level
Achievements augment only definition fields; unmatched definitions remain records
without invented issuer, date, result, or other assertion claims. Unknown types
remain available through `records` and the display model's catch-all category.

Use canonical record IDs for UI keys. Missing/duplicate-ID fallbacks are scoped to
the source document and must not be persisted as globally stable credential IDs.
Resolve aliases with `resolveClrRecord`; an ambiguous alias never selects the first
assertion. Internal UI navigation uses `findClrRecordByCanonicalId` (or
`createClrRecordSelection`) so even the first duplicate occurrence remains selectable.
Do not use canonical-first lookup for unresolved external association aliases.
Synthetic IDs reserve supplied IDs throughout the document before allocation.
Multiple credential subjects emit a warning and are not collapsed to one
learner. The original credential remains accessible unchanged.

Results preserve `value`, `status`, and `achievedLevel` separately. Display callers
use `getResultDisplayValue` for fallback text. Conflicting result descriptions remain
unresolved. Mapped fields retain their full canonical source paths, including array
indexes and top-level definition origins.

Activity, award, and validity dates remain independent in the canonical model.
The legacy `earnedAt` display field prefers activity end, then award, then validity
start. Parsed credit text is explicitly marked `directlyMapped: false`.

Credit quantities and totals keep earned, available, and description-derived values
separate. Explicit zero survives; missing earned credits remain unknown. The
optional `creditUnit` extension on the subject applies to earned credits, and the
same extension on the achievement applies to available credits. Totals group by
quantity kind and exact declared unit; unspecified units form their own group.
No unit conversion is inferred. Compatibility scalar totals are absent when a
category has multiple unit groups. Collection issuance (`issuanceDate`) and validity
start (`validFrom`) are also independent fields.

Relationship `kind` and source-provided names are stable data; the app translates
chip labels at render time. `RelationshipDisplayModel.label` is a deprecated English
compatibility fallback; new consumers should translate `kind` with `relatedRecordName`.
The app uses this fallback only when a relationship message is unavailable.
Date and quantity formatters validate BCP-47 locales
and fall back to English for malformed persisted values. Hashed identifiers remain
available in details but are excluded from learner display names.

Proof presence is metadata, not successful cryptographic verification.

## Occurrence verification

`verification.ts` shares CLR verification between wallet and share viewers.
`verifyClrCredentialTree(model, verify, budget, onUpdate)` checks the outer
credential and every signed embedded occurrence, returning progressive immutable
snapshots. `records` uses canonical record IDs; duplicate source credential IDs
never share a verdict. Descendant results retain source paths and do not replace
the containing record's own signer or signature result.
Unmapped signed occurrences still qualify verification summaries. Only occurrences
with a canonical record owner receive record-detail navigation; do not invent a
navigation target for ambiguous or otherwise unmapped source data.

Keep proof, lifecycle, subject binding and registry trust separate. A valid
publisher signature does not validate a district signature, and a valid district
signature does not establish that its learner matches the CLR learner. Binding
uses exact subject IDs; missing or ambiguous subjects remain unconfirmed. Registry
lookup is per exact issuer DID, never inherited from the publisher.

`isClrPublisherVerified(snapshot)` reflects only the settled outer credential.
`isClrRecordConfirmed(node)` also requires its signed descendants, lifecycle and
learner binding to be confirmed. Never use the latter to relabel a valid publisher
as invalid because one district record failed. Passing a snapshot to
`createClrTranscriptDisplayModel(canonical, snapshot)` keeps this distinction.
Snapshots retain each occurrence's own issuer name, image and verification methods;
these are display metadata, not registry trust.

Use one `createVerificationBudget()` per pass (30 seconds), including a share's
holder presentation and selected members. Work is bounded to four credential
checks at once. Cancellation stops new checks and discards late results; the
SDK verification promise itself cannot be aborted. Resolution/transport failures,
missing status evidence and exhausted budgets remain unavailable, not invalid.
Reuse DIDKit's existing DID-web document cache; never cache credential proof
results merely by issuer DID or raw credential ID.

Unsigned children and successful same-publisher children need no extra UI.
Signed-child exceptions must still qualify the summary, including same-publisher
failures. Do not equate status-list presence with an active status or registry
membership with signature validity.

## Regression coverage

Run `vitest run src/helpers/credentials/clr` from `packages/learn-card-base`, and
the `clrRenderer` suites plus `src/components/clr-transcript` from
`apps/learn-card-app`. The app corpus suite verifies both canonical preservation
and display parity against every registered CLR fixture.

`tests/clr-verification.mocked.spec.ts` exercises actual DIDKit signatures, a real
revoked bitstring list, tampering and duplicate IDs on desktop/mobile. It staggers
issuer responses to check stable geometry, checks English/Spanish/French/Arabic
status labels, and proves exactly five cold DID-document requests for 50 records.
Only registry discovery is isolated; signature and status verification are real.

## Collection layouts (LC-2215)

`inferClrLayout(canonical)` returns `{ kind, reason }`, with `kind` set to
`academic`, `military`, or `general`. Title terms and compatible academic types are
configured in `layout-heuristics.ts`; its linear scanner avoids backtracking on
untrusted collection titles. The scanner recognizes ASCII words only, so localized
titles with accented letters may fall back to general. This is a presentation hint, never a new
credential claim. CLR 2.0's use-case categories are not machine-readable sectors.
Military or service-branch titles explicitly naming training, service, qualifications,
records or transcripts select the military layout. Known record titles include
Joint Services Transcript, AARTS (including its expanded name), and CCAF Transcript.
These phrases consume their own transcript word; a separate academic title still
conflicts (for example, "Military Service and Academic Transcript" selects general).
Provider names alone, including Community College of the Air Force, are insufficient.
Academic titles or explicit GPA/degree evidence in an otherwise academic collection
select academic. Conflicting titles or insufficient
evidence select general. Publisher names, child text, tenants and fixture tags do
not establish the collection's sector. Standalone course presentation is retained.

This intentionally narrows the previous academic default: a course-only collection
named "Westbridge University – Fall 2025" selects general, even with credits or
terms. Without a decisive title, explicit GPA or a degree is required and **every**
child must have only configured academic-compatible types. An untyped child,
Certificate, License, or Membership prevents that structural fallback. An explicit
academic collection title still selects academic for those records. Source data and
record access are preserved; the general view simply avoids assuming academic context.

`groupClrRecords(records, layout)` partitions canonical occurrences exactly once,
keeping source order within each section. Specific type hints take precedence over
activity hints derived from dates or roles. Military groups courses and programs as
Training; general keeps those sections separate. Unknown records and memberships
remain accessible through Other records. No membership-specific layout is implied.

LearnCard App's `components/clr-renderer` owns the shared frame, collection header,
section lists and record navigation. Existing transcript surface exports delegate
to `ClrRenderer` for compatibility. Academic tables/terms/GPA stay in the academic
views; result scales, evidence, alignments and source-backed record details remain
shared. New hosts should pass the existing display model, `ViewOptions`, and their
credential/sharing context to `ClrRenderer`. Optional `onViewDetails` delegates
navigation to the host. Only cards offer the detail action; embeds are summaries
for every layout. The renderer memoizes layout, sections, and the canonical display
record map per model, sharing these with its header, lists, and navigator. No
normalization occurs inside child components.

UI navigation checks the canonical display-record map before alias lookup so duplicate
source IDs do not make preserved occurrences inaccessible. `findClrRecordById`
continues conservative alias resolution; ambiguous association endpoints stay
non-navigable. Canonical IDs must not be persisted as global credential IDs.

The `/dev/clr-transcript` picker includes comprehensive military, mixed-career,
and training-provider examples. The military fixture is synthetic and unsigned;
proof presence is never treated as verification or training completion. New UI
labels are translated in English, Spanish, French and Arabic.

Numeric result axes stay left-to-right in every locale: the minimum label is on
the left, and achieved/required markers use that same coordinate system. The
surrounding Arabic interface remains right-to-left.

Browser regressions cover military assessment details, training-provider numeric
results, and malformed stored locales at desktop and mobile widths with simulated
47/34 insets. The spec runs in the existing mocked E2E tier without sign-in; for
the Chromium/Firefox/WebKit matrix, run from `apps/learn-card-app`:

```bash
bunx playwright test --config playwright.clr.config.ts
```

Set `PW_MOCK_PORT` to reuse an existing local dev server. For manual surface QA,
select **Military — Training Record**, open **View details** from **Card**, and
confirm the same three records remain available. **Embed** is a read-only summary
and must not offer a detail action or record links.
