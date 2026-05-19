# Render Method Designer (Dev Tool)

A wallet-aware Vite + React + Tailwind dev tool for the [`@learncard/render-method-designer`](../../packages/render-method-designer/README.md) component. Lets you author an SVG-Mustache template against real credential fixtures and round-trip it through the [`@learncard/render-method-plugin`](../../packages/plugins/render-method/README.md).

Mirrors [`examples/credential-viewer/`](../credential-viewer/README.md) — same Vite config, same workspace-alias HMR pattern, same wallet bootstrap.

## Running

```bash
cd examples/render-method-designer
pnpm dev
```

The dev server runs on `http://localhost:5174`. Vite aliases resolve the three workspace packages (`@learncard/render-method-designer`, `@learncard/render-method-plugin`, `@learncard/credential-library`) directly to their `src/index.ts` so edits hot-reload without a rebuild.

## Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Connect wallet                                               │
│    Hex seed → initLearnCard → wallet.id.did()                   │
├─────────────────────────────────────────────────────────────────┤
│ 2. Author template                                              │
│    @learncard/render-method-designer pane:                      │
│    • CodeMirror XML editor on the left                          │
│    • Live SVG preview on the right (Mustache + DOMPurify)        │
│    • Variable picker walks the selected sample VC               │
│    • Click "Save" → template is staged in App state             │
├─────────────────────────────────────────────────────────────────┤
│ 3. Pick a pipeline target fixture                               │
│    Bottom bar dropdown. Defaults to the same fixture used in    │
│    the preview pane but lets you decouple authoring from        │
│    issuance (useful when validating templates against           │
│    credentials with different shapes).                          │
├─────────────────────────────────────────────────────────────────┤
│ 4. Run pipeline                                                 │
│    • prepareFixture(fixture, { issuerDid })                     │
│    • wallet.invoke.attachRenderMethod(unsigned, { templateValue }) │
│    • wallet.invoke.issueCredential(...) → signed VC             │
│    • wallet.invoke.findTemplateRenderMethod(signed, 'svg-mustache') │
│    • Decode the data: URI, compare to input, render via the     │
│      designer's own renderSvgMustache pipeline.                 │
│    Stats: renderSuite, mediaType, decoded length, round-trip    │
│    match. Plus the final rendered SVG.                          │
└─────────────────────────────────────────────────────────────────┘
```

## What it proves

- The designer's output is a valid `templateValue` for `attachRenderMethod`.
- The plugin's encoding (currently `encodeURIComponent`-based) round-trips losslessly.
- The plugin's read-side `findTemplateRenderMethod` finds the entry on a signed VC.
- The Mustache + DOMPurify pipeline in the designer matches what the app renders.

## Tech

- **React 18** + TypeScript + Vite
- **Tailwind** for the chrome (generic tokens — this is a dev tool, not user-facing UI)
- **`@learncard/credential-library`** for sample fixtures
- **`@learncard/init`** for wallet bootstrap (seed-based)
- **`@learncard/render-method-designer`** — the component under development
- **`@learncard/render-method-plugin`** — the data-side under test

## Privacy note

The seed input is stored in `localStorage` keyed by `render-method-designer:seed` for convenience across reloads. Use throwaway seeds. The tool is not intended for production credential issuance.
