---
"learn-card-app": patch
"@learncard/credential-library": patch
"learn-card-base": patch
"@learncard/cli": patch
"@learncard/types": patch
"@learncard/render-method-plugin": patch
---

feat: [LC-1812][LC-1855] - Add Render Method Plugin + Render Method Toggle

Adds `@learncard/render-method-plugin` for attaching W3C `renderMethod` entries to Verifiable Credentials using SVG Mustache templates. The plugin is registered as part of the default LearnCard wallet stack and exposes `attachRenderMethod` and `buildTemplateRenderMethod` via `wallet.invoke`.

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
