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

App-side helper files are re-export shims. New parsing logic belongs here, not in a
component or another app helper. Core imports from this directory's `index.ts` do
not load UI presentation or native attachment dependencies.

## Model boundaries

Each embedded credential occurrence remains a separate record. Matching top-level
Achievements augment only definition fields; unmatched definitions remain records
without invented issuer, date, result, or other assertion claims. Unknown types
remain available through `records` and the display model's catch-all category.

Use canonical record IDs for UI keys. Missing/duplicate-ID fallbacks are scoped to
the source document and must not be persisted as globally stable credential IDs.
Resolve aliases with `resolveClrRecord`; an ambiguous alias never selects the first
assertion. Multiple credential subjects emit a warning and are not collapsed to one
learner. The original credential remains accessible unchanged.

Results preserve `value`, `status`, and `achievedLevel` separately. Display callers
use `getResultDisplayValue` for fallback text. Conflicting result descriptions remain
unresolved. Mapped fields retain their full canonical source paths, including array
indexes and top-level definition origins.

Activity, award, and validity dates remain independent in the canonical model.
The legacy `earnedAt` display field prefers activity end, then award, then validity
start. Parsed credit text is explicitly marked `directlyMapped: false`.

Proof presence is metadata, not successful cryptographic verification.

## Regression coverage

Run `vitest run src/helpers/credentials/clr` from `packages/learn-card-base`, and
the `clrRenderer` suites plus `src/components/clr-transcript` from
`apps/learn-card-app`. The app corpus suite verifies both canonical preservation
and display parity against every registered CLR fixture.
