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

## Regression coverage

Run `vitest run src/helpers/credentials/clr` from `packages/learn-card-base`, and
the `clrRenderer` suites plus `src/components/clr-transcript` from
`apps/learn-card-app`. The app corpus suite verifies both canonical preservation
and display parity against every registered CLR fixture.

## Collection layouts (LC-2215)

`inferClrLayout(canonical)` returns `{ kind, reason }`, with `kind` set to
`academic`, `military`, or `general`. Title terms and compatible academic types are
configured in `layout-heuristics.ts`; its linear scanner avoids backtracking on
untrusted collection titles. This is a presentation hint, never a new
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
