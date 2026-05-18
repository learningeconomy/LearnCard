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

| Method | Signature | Description |
|---|---|---|
| `attachRenderMethod` | `(vc: UnsignedVC, config?: AttachRenderMethodConfig) => UnsignedVC` | Attaches a `TemplateRenderMethod` to the VC and injects the JSON-LD context. **Opt-in:** returns the VC unchanged when `config` is omitted. Merges with any existing `renderMethod` entries. |
| `buildTemplateRenderMethod` | `(config: AttachRenderMethodConfig) => TemplateRenderMethod` | Builds a `TemplateRenderMethod` descriptor without mutating a VC. |

Constants:

- `DEFAULT_TEMPLATE_ID` — URL of the default hosted LearnCard template. Pass this as `templateId` to opt in to the default.
- `RENDER_METHOD_CONTEXT` — JSON-LD context URL injected by `attachRenderMethod`. See the [draft context warning](#draft-context-warning) below.

Both methods throw if:
- `templateId` is provided but is not an `http://` or `https://` URL.
- `templateValue` is provided but is empty or whitespace-only.
- Neither `templateId` nor `templateValue` is set (for `buildTemplateRenderMethod` only).

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

## Notes

- Only `svg-mustache` is supported as a render suite at this time. The renderer in `apps/learn-card-app/src/helpers/renderMethod.helpers.ts` performs DOMPurify sanitization on the hydrated SVG before insertion.
- See `src/types.ts` for types and `src/plugin.ts` for implementation.
- See `src/test/plugin.test.ts` for the full behavior contract.
