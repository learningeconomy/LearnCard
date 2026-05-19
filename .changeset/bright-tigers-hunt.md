---
"learn-card-app": patch
"@learncard/credential-library": patch
"learn-card-base": patch
"@learncard/cli": patch
"@learncard/types": patch
"@learncard/render-method-plugin": patch
---

feat: [LC-1812][LC-1855] - Add Render Method Plugin + Render Method Toggle

Adds `@learncard/render-method-plugin` for attaching and reading W3C `renderMethod` entries on Verifiable Credentials. The plugin is registered as part of the default LearnCard wallet stack.

**Write side** (`wallet.invoke`): `attachRenderMethod`, `buildTemplateRenderMethod`.

**Read side** (`wallet.invoke` and direct imports):
- String-based sugar (most common case): `findTemplateRenderMethod(vc, suite | suites[])`, `findTemplateRenderMethods(vc, suite | suites[])`.
- Backward-compatible alias: `getSvgMustacheRenderMethod`.
- Predicate-based escape hatch: `findRenderMethod`, `findRenderMethods`.
- Raw access: `getRenderMethods` (unwraps `CertifiedBoostCredential`, normalizes object↔array).
- Data shaping: `buildRenderData(vc, renderProperty?)` (Mustache context with `vc` / `credential` / `credentialSubjects` aliases, RFC 6901 overlay).
- Exported type guards: `isTemplateRenderMethod`, `isSvgMustacheRenderMethod`.

The pure data-shaping helpers (Mustache context, JSON Pointer overlay, boost unwrapping) moved out of `apps/learn-card-app/src/helpers/renderMethod.helpers.ts` into the plugin; the app now only owns the SVG-specific render pipeline (Mustache hydration + DOMPurify sanitization + React display).

**`@learncard/types`**: `TemplateRenderMethodValidator` widened — `renderSuite` and `outputPreference.mediaType` are now `z.string()` (were `z.literal('svg-mustache')` and `z.literal('image/svg+xml')`). The literals couldn't express the W3C spec's openness to other suites/types and made the plugin's "future-extensible" read API contradictory. Backward-compatible: all existing literal values still validate.

Behavior:

- `attachRenderMethod` is **opt-in**: calling it without a config returns the VC unchanged. Pass `{ templateId: DEFAULT_TEMPLATE_ID }` or a custom `{ templateId | templateValue }` to actually attach a render method. This avoids polluting every issued credential's `@context` with the render-method JSON-LD context URL.
- `templateId` must be an `http://` or `https://` URL. Empty values, `javascript:`, `file:`, `data:` and other schemes are rejected at the plugin boundary.
- `templateValue` is URL-encoded into a `data:image/svg+xml,` URI. Empty or whitespace-only values are rejected.
- The `useRenderMethodEnabled` LaunchDarkly flag gates display only (the `RenderMethodDisplay` component, the `BoostDisplayStyleSelector`, the `getSvgMustacheRenderMethod` lookup). It does not gate the write path.

Known risk:

- The JSON-LD context URL (`https://digitalbazaar.github.io/vc-render-method-context/contexts/v2rc2.jsonld`) is a community-group draft, not a finalized W3C TR. VCs issued with this context depend on the URL remaining stable. Follow-up work will bundle the context locally and migrate to the W3C TR URL when published.

Types:

- `@learncard/types` adds `TemplateRenderMethod`, `RenderMethod`, and a top-level `renderMethod` field on `UnsignedVC`.
- `learn-card-base` extends `BespokeLearnCard` to include `RenderMethodPlugin`, making `wallet.invoke.attachRenderMethod` and `wallet.invoke.buildTemplateRenderMethod` type-safe across the codebase.
