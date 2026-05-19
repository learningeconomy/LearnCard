# @learncard/render-method-plugin

Attach W3C `renderMethod` entries to Verifiable Credentials using SVG Mustache templates.

The plugin is stateless and has no required dependent methods or control planes.

## Install

This plugin is part of the LearnCard monorepo and is built with the workspace. It is registered automatically as part of the default LearnCard wallet stack (see `packages/learn-card-base/src/helpers/walletHelpers.ts`).

To add it manually to a custom LearnCard instance:

```ts
import { getRenderMethodPlugin } from '@learncard/render-method-plugin';

const lc = await baseLc.addPlugin(getRenderMethodPlugin(baseLc));
```

## API

### Write side

| Method | Signature | Description |
|---|---|---|
| `attachRenderMethod` | `(vc, config?) => UnsignedVC` | Attaches a `TemplateRenderMethod` to the VC and injects the JSON-LD context. **Opt-in:** returns the VC unchanged when `config` is omitted. Merges with existing `renderMethod` entries. |
| `buildTemplateRenderMethod` | `(config) => TemplateRenderMethod` | Builds a `TemplateRenderMethod` descriptor without mutating a VC. |

### The `formattedValues` convention

Mustache is logic-less, so the spec gives template authors no way to format dates or truncate DIDs. To fill that gap, `buildRenderData` adds a `formattedValues` mirror containing locale-aware variants of fields it detects as ISO 8601 timestamps or long identifiers (DIDs / URNs / URLs).

```ts
const data = lc.invoke.buildRenderData(vc);
// {
//   validFrom: '2024-07-01T00:00:00Z',
//   formattedValues: {
//     validFrom: {
//       long: 'July 1, 2024',
//       medium: 'Jul 1, 2024',
//       short: '07/01/2024',
//       iso: '2024-07-01',
//       year: '2024', month: 'July', day: '1', weekday: 'Monday',
//       relative: '5 months ago',
//       time: '12:30 PM', datetime: 'Jul 1, 2024, 12:30 PM',
//     },
//   },
//   issuer: { id: '…', name: '…' },
// }
```

Templates reference these directly: `{{formattedValues.validFrom.long}}`.

**Locale.** Defaults to `navigator.language` in the browser or `'en-US'` in Node. Override via the third argument: `lc.invoke.buildRenderData(vc, undefined, { locale: 'fr-FR' })`.

**Opt out.** Pass `{ formattedValues: false }` if you want a stable, mirror-free context (useful for snapshot tests).

**Interoperability.** This is a LearnCard convention, not a W3C standard — see `format-aliases.ts` for the full contract. Templates produced by `@learncard/render-method-designer` use a Mustache section-pair fallback (`{{#formattedValues.X.long}}…{{/…}}{{^formattedValues.X.long}}{{X}}{{/…}}`) so a Mustache renderer without the mirror falls back to the raw value rather than rendering empty. Wallets that want byte-identical output can import and call `buildFormattedValues` on their own data context.

### Read side

Layered API — pick the level that fits your need:

| Method | Signature | When to use |
|---|---|---|
| `findTemplateRenderMethod` | `(vc, suite \| suites[]) => TemplateRenderMethod \| null` | **Most common.** Filter by `renderSuite` string. Pass an array for capability negotiation. |
| `findTemplateRenderMethods` | `(vc, suite \| suites[]) => TemplateRenderMethod[]` | All matches of a suite (or any of several). |
| `getSvgMustacheRenderMethod` | `(vc) => TemplateRenderMethod \| null` | Backward-compatible alias for `findTemplateRenderMethod(vc, 'svg-mustache')`. |
| `findRenderMethod` | `(vc, predicate) => T \| null` | Escape hatch: arbitrary predicate for non-template render methods. |
| `findRenderMethods` | `(vc, predicate) => T[]` | Same, all matches. |
| `getRenderMethods` | `(vc) => RenderMethod[]` | Raw access. Unwraps `CertifiedBoostCredential`, normalizes object↔array. No validation. |
| `buildRenderData` | `(vc, renderProperty?) => Record<string, unknown>` | Portable Mustache context (adds `vc` / `credential` / `credentialSubjects` aliases). Optional RFC 6901 overlay. |

### Type guards (composable selection)

| Guard | Narrows to |
|---|---|
| `isTemplateRenderMethod(rm)` | `TemplateRenderMethod` (Zod-validated shape) |
| `isSvgMustacheRenderMethod(rm)` | `TemplateRenderMethod` with `renderSuite === 'svg-mustache'` |

### Constants

- `DEFAULT_TEMPLATE_ID` — URL of the default hosted LearnCard template. Pass as `templateId` to opt in.
- `RENDER_METHOD_CONTEXT` — JSON-LD context URL injected by `attachRenderMethod`. See the [draft context warning](#draft-context-warning).

### Throws

- `attachRenderMethod` / `buildTemplateRenderMethod` throw if:
  - `templateId` is provided but is not an `http://` or `https://` URL.
  - `templateValue` is provided but is empty or whitespace-only.
  - `buildTemplateRenderMethod` is called without either field set.

### `AttachRenderMethodConfig`

`templateId` and `templateValue` are mutually exclusive — provide one or the other. The discriminated union enforces this at compile time.

| Field | Type | Description |
|-------|------|-------------|
| `templateId` | `string` | HTTPS URL of a hosted SVG Mustache template. Only `http://` and `https://` schemes are accepted. |
| `templateValue` | `string` | Inline SVG Mustache content (embedded as a URL-encoded `data:image/svg+xml,` URI). Must be non-empty. |
| `renderProperty` | `string[]?` | JSON Pointer paths (RFC 6901) scoping which VC fields are exposed to the template. |

## Opt-in semantics

`attachRenderMethod` is **opt-in**. Calling it without a config returns the VC unchanged, which means callers must explicitly choose to attach a render method:

```ts
// No-op — returns vc unchanged
lc.invoke.attachRenderMethod(vc);

// Attaches the default template
lc.invoke.attachRenderMethod(vc, { templateId: DEFAULT_TEMPLATE_ID });

// Attaches a custom hosted template
lc.invoke.attachRenderMethod(vc, { templateId: 'https://example.com/badge.svg' });

// Attaches an inline template (URL-encoded into a data: URI)
lc.invoke.attachRenderMethod(vc, { templateValue: '<svg>...</svg>' });
```

This contract intentionally avoids polluting every issued credential's `@context` with the draft render-method context URL. See the [draft context warning](#draft-context-warning).

## Quick start

### Use the default LearnCard template

```ts
import { DEFAULT_TEMPLATE_ID } from '@learncard/render-method-plugin';

const vcWithRender = lc.invoke.attachRenderMethod(unsignedVc, {
    templateId: DEFAULT_TEMPLATE_ID,
});
const signedVc = await lc.invoke.issueCredential(vcWithRender);
```

### Use a custom hosted template

```ts
const vcWithRender = lc.invoke.attachRenderMethod(unsignedVc, {
    templateId: 'https://templates.example.com/badge.svg',
    renderProperty: ['/credentialSubject/name', '/credentialSubject/description'],
});
const signedVc = await lc.invoke.issueCredential(vcWithRender);
```

### Use an inline template

```ts
const svgTemplate =
    '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';

const vcWithRender = lc.invoke.attachRenderMethod(unsignedVc, {
    templateValue: svgTemplate,
});
const signedVc = await lc.invoke.issueCredential(vcWithRender);
```

### Build a render method descriptor independently

```ts
const renderMethod = lc.invoke.buildTemplateRenderMethod({
    templateId: 'https://templates.example.com/badge.svg',
});
// renderMethod.type === 'TemplateRenderMethod'
// renderMethod.renderSuite === 'svg-mustache'
```

## Feature-flag interaction

In `apps/learn-card-app`, the `useRenderMethodEnabled` hook gates the **display** path (the `RenderMethodDisplay` component, the `BoostDisplayStyleSelector`, the `getSvgMustacheRenderMethod` lookup). It does **not** gate the write path — whether to attach a render method to a credential is a per-callsite decision and follows the opt-in semantics above.

In other words: enabling the LaunchDarkly flag turns on rendering for credentials that already have a `renderMethod`, but it does not retroactively change which credentials carry one.

## Draft context warning

`RENDER_METHOD_CONTEXT` currently points to a community-group draft hosted on Digital Bazaar's GitHub Pages:

```
https://digitalbazaar.github.io/vc-render-method-context/contexts/v2rc2.jsonld
```

The `v2rc2` suffix means "v2, release candidate 2". This is **not** a finalized W3C TR. Risks of issuing VCs that reference this URL in their `@context`:

- The URL could move, be renamed, or 404 — JSON-LD context resolution would fail at verification time.
- Term definitions could change between rc2 and a final spec, breaking interpretation.
- The context is not statically cached by DidKit — verification incurs a network fetch.

Mitigation plan (not yet implemented):

- Bundle the context locally, mirroring the pattern in `packages/learn-card-contexts/`.
- Migrate to the stable W3C TR context URL when the spec finalizes.

Tracking: <https://www.w3.org/TR/vc-render-method/>

The opt-in semantics above are the primary mitigation for now — credentials that don't need a render method don't get this context URL.

## Extending: supporting a new render suite

The read-side API is intentionally generic so new render suites can be added by callers without a plugin release. For `TemplateRenderMethod`-shaped suites, you don't write any predicate code:

```ts
// Filter by a single suite
const found = lc.invoke.findTemplateRenderMethod(vc, 'html-mustache');

// Capability negotiation — first match across the suites your renderer supports
const renderable = lc.invoke.findTemplateRenderMethod(vc, [
    'svg-mustache',
    'html-mustache',
]);

// All matches (e.g., when offering the user a choice)
const allHtml = lc.invoke.findTemplateRenderMethods(vc, 'html-mustache');
```

For non-template render methods (e.g., a future `WebRenderingTemplate2022` with a different shape), use the predicate-based `findRenderMethod` escape hatch with your own type guard.

The plugin handles **selection** and **data shaping** uniformly across suites. The **actual rendering** (Mustache hydration + sanitization) stays in the app/UI layer because sanitization policy (DOMPurify for SVG, different rules for HTML, etc.) is renderer-specific.

## Architectural boundary

- **In the plugin** (this package): data domain — attach renderMethod to VCs, find renderMethod entries, shape Mustache contexts. Pure, isomorphic, CLI-safe.
- **In the app**: render domain — Mustache hydration into a target format, DOMPurify sanitization, DOM insertion. Browser-specific.

The seam is "data that describes how to render" (plugin) vs. "execute the render and put pixels on screen" (app).

## Notes

- Only `svg-mustache` is supported as a render suite at this time. The renderer in `apps/learn-card-app/src/helpers/renderMethod.helpers.ts` performs DOMPurify sanitization on the hydrated SVG before insertion.
- See `src/types.ts` for types, `src/plugin.ts` for the write side, `src/read.ts` for the read side.
- See `src/test/plugin.test.ts` for the full behavior contract.
