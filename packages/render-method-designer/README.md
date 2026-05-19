# @learncard/render-method-designer

A code-optional, reusable React UI for authoring [W3C `renderMethod`](https://www.w3.org/TR/vc-render-method/) credential templates. Drives [`@learncard/render-method-plugin`](../plugins/render-method/README.md).

- **Visual mode (default)** — pick a starter, click any element on the canvas to select, edit properties from a side panel, bind credential fields, restyle via a theme palette.
- **Code mode** — full CodeMirror SVG-Mustache editor with sample-VC live preview and variable picker. Same component, toggle in the corner.

Output of both modes is the SVG-Mustache `templateValue` you pass to `lc.invoke.attachRenderMethod(vc, { templateValue })`.

## Install

```bash
pnpm add @learncard/render-method-designer
```

Built with the monorepo. Inside the workspace, add `"@learncard/render-method-designer": "workspace:*"`.

## Quick start

```tsx
import { RenderMethodDesigner } from '@learncard/render-method-designer';
import { vcV2RenderMethodExample } from '@learncard/credential-library';

export const Editor = () => (
    <RenderMethodDesigner
        sampleVCs={[
            {
                id: vcV2RenderMethodExample.id,
                name: vcV2RenderMethodExample.name,
                credential: vcV2RenderMethodExample.credential,
            },
        ]}
        onSave={async ({ svgMustache, template }) => {
            // svgMustache → wallet.invoke.attachRenderMethod(vc, { templateValue: svgMustache })
            // template    → persist the IR so you can re-open the visual editor next session
        }}
    />
);
```

## Component API

```ts
interface RenderMethodDesignerProps {
    initialTemplate?: CredentialTemplate;   // IR for visual mode (defaults to first STARTER)
    initialMode?: 'visual' | 'code';        // default 'visual'
    allowModeSwitch?: boolean;              // default true
    initialCodeTemplate?: string;           // SVG-Mustache string for code mode
    renderSuite?: string;                   // default 'svg-mustache'
    adapters?: SuiteAdapter[];              // register additional / override built-in suites
    sampleVCs?: SampleVC[];                 // sample credentials for live preview
    onSave?: (out: { svgMustache: string; template?: CredentialTemplate }) => void | Promise<void>;
    onCancel?: () => void;
    className?: string;
}
```

`onSave` always receives `svgMustache`. It receives `template` only when saved from Visual mode (the IR is the canonical source for re-editing).

## Visual mode

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [name]  [Change template]  [Sample ▾]  [↶ ↷]              [Cancel] [Save]  │
├──────────────────┬─────────────────────────────────┬────────────────────────┤
│  Layers          │                                 │  Properties            │
│  • Top band      │                                 │  Selected element      │
│  • Title text    │           Canvas                │  • Content (bind)      │
│  • Subtitle     │     (interactive SVG)             │  • Position            │
│  • Avatar        │                                 │  • Typography          │
│  • Issuer row    │   click any element to select   │  • Color (theme)       │
│  ...             │                                 │  Visibility            │
│                  │                                 │  ──────────────────    │
│                  │                                 │  Theme ▾               │
└──────────────────┴─────────────────────────────────┴────────────────────────┘
```

- **Canvas** renders the IR directly as React-SVG. Click any element to select; drag to move; eight handles on the selection box resize the element. Snap-to-grid (4px default, configurable via `gridStep` and `snapToGrid` props on `Canvas`). All drag-and-resize interactions collapse to a single undo step.
- **Layers** mirrors the IR tree, with drag-to-reorder via `@dnd-kit/sortable`. ⧉ duplicates; ✕ deletes. The library at the top of the panel adds new primitives (Text / Rect / Image / Field Row / Divider) at the canvas center.
- **Properties** dispatches by element type: Text, Rect, Image, Field-Row, Divider. Each surfaces a binding picker driven by the active sample VC.
- **Theme** exposes the 8-color palette + heading/body fonts. Theme tokens are referenced as `$primary` etc. on the IR; the emitter resolves them at save time.

## Code mode

The code-first editor: CodeMirror XML + Mustache, sample-VC live preview, variable picker, validation toolbar. Use when the visual editor can't represent something you need (custom paths, masks, complex filters).

## SVG import

Click **Change template → Import SVG** to bring in an existing design. The parser handles a substantial IR-compatible subset, including Figma's specific export patterns:

| Supported | Behavior |
|---|---|
| `<rect>` | → `RectElement` (with stroke/rounded corners/shadow) |
| `<text>` | → `TextElement`. If the content is exactly `{{path}}`, becomes a binding. |
| `<image>` | → `ImageElement` (URL source; clip-path detection for rounded/circle) |
| `<line>` (horizontal) | → `DividerElement` |
| `<path>` | → `PathElement` with cached natural-bbox (logos, badges, decorations) |
| `<linearGradient>` | Applied when referenced via `url(#id)` on fills |
| `<clipPath>` | Applied when referenced from `<image>`, including `<rect transform="translate(…)">` children |
| `<pattern>` + `<use>` + `<image>` (Figma image-fill chain) | Resolved into an `ImageElement` at the host rect's geometry |
| `<filter>` (Figma drop-shadow chain) | Reduced to `ShadowEffect` and applied to the leaf element of the filter group |
| `<g transform="translate(x,y) scale(s)">` | Baked into child coordinates |

Dropped with warnings (and the import dialog shows a list of what was lost):

- `<polygon>`, `<circle>` (other than in clip-paths), `<ellipse>`
- `<mask>` — Figma uses these for inset-border effects; use a stroked rect instead
- `rotate()`, `skew()`, `matrix()` transforms
- Non-drop-shadow `<filter>` chains (inner-shadow, blur, color-matrix as standalone)
- `<foreignObject>`, animations, scripts

Use the **"Embed as background"** option in the import dialog for SVG you can't parse at all — the original is preserved as a `data:image/svg+xml` URI inside a single `ImageElement`, and you build on top.

### Figma export checklist

For best results when exporting SVG from Figma:

1. **Disable "Outline text"** in the SVG export dialog. With outline-text on, Figma renders every text glyph as a `<path>` — the import sees graphics, not editable text, and you lose the ability to add Mustache bindings. With outline-text off, text comes through as `<text>` elements that can carry `{{credentialSubject.name}}` etc.
2. **Add Mustache placeholders directly in Figma text fields.** Write `{{credentialSubject.name}}` as the recipient text in your Figma file; the importer auto-detects this and creates a binding.
3. **Use rects instead of masks for inset borders.** Figma's mask-based "inset stroke" rendering can't be parsed back to an IR primitive. A regular `<rect stroke="…" />` with appropriate stroke-width is simpler and imports cleanly.
4. **Pre-flatten rotated groups.** Group rotations aren't baked — use Figma's "Flatten selection" before exporting any rotated element.
5. **Keep SVGs under 5MB.** Embedded raster images bloat the data URI; downscale photos to ≤1024×1024 before embedding in Figma.

A correctly exported Figma SVG should round-trip with **rects, paths, image-fills, drop-shadows, and editable text bindings all preserved.**

## Starter templates

Five ship in the box:

| ID | Name | Use case |
|---|---|---|
| `classic` | Classic Card | Centered avatar, gradient header, IDs and badges |
| `modern` | Modern Bold | Full-bleed dark gradient, eyebrow text, premium credentials |
| `minimal` | Minimal | Clean bordered monochrome, institutional/formal credentials |
| `class-formal` | Class — Formal | Portrait certificate with seal, ceremonial copy, verified footer. Academic course credentials. |
| `emblem-badge` | Emblem Badge | Square 12-pointed badge with drop shadow + bound inner image. Achievements + recognition. |

The last two are **re-authored natively** from designer-output Figma references (see `examples/render-method-designer/sample-svgs/`). The Figma badge outline `<path>` is preserved verbatim for visual fidelity; everything else (theme colors, text bindings, drop shadow, inner image) is editable. This re-authoring pattern is the recommended workflow for shipping new starter templates: take a Figma design as visual reference, decompose into IR primitives by hand, ship as a JSON template — *not* by importing the raw export.

Add your own gallery entries via `extraTemplates` on `VisualEditor` or compose your own picker around the IR.

## IR (Intermediate Representation)

The IR is the canonical source of truth. The visual editor mutates the IR; the emitter (`emitSvgMustache`) converts the IR to SVG-Mustache on save. SVG-Mustache is **not** parsed back into IR — consumers persist the IR alongside the rendered template if they want round-trip visual editing.

Element types in Phase 2: `rect`, `text`, `image`, `field-row`, `divider`. All support theme-token references (`$primary`), credential bindings (`{{path}}` with fallback), and visibility predicates (`whenPresent: path` hides the element when the bound field is missing).

See `src/ir/types.ts` for the full IR shape, `src/ir/schema.ts` for the Zod validators, and `src/ir/emit.ts` for the emitter.

## Formatted bindings

Mustache is intentionally logic-less, so `{{validFrom}}` renders the raw ISO string `2024-07-01T00:00:00Z`. The designer detects ISO dates and long identifiers (DIDs / URNs / URLs) in the sample VC automatically; when you select one in the binding picker, a **Format** dropdown appears with locale-aware options:

| Field type | Format options |
|---|---|
| ISO 8601 date | `long` ("July 1, 2024"), `medium` ("Jul 1, 2024"), `short` ("07/01/2024"), `iso`, `year`, `month`, `day`, `weekday`, `relative` ("5 months ago"), `time`, `datetime` |
| Long identifier (DID / URN / URL) | `short` ("did:key:z6Mki…tBz"), `long` (raw) |

The emitter generates a 3-tier Mustache fallback so templates render correctly even on renderers without the convention:

```
{{#formattedValues.validFrom.long}}<text …>{{formattedValues.validFrom.long}}</text>{{/…}}
{{^formattedValues.validFrom.long}}
    {{#validFrom}}<text …>{{validFrom}}</text>{{/validFrom}}
{{/…}}
```

A LearnCard wallet (with the `formattedValues` convention) renders "July 1, 2024". A wallet that doesn't know the convention falls through to the raw ISO. See [`@learncard/render-method-plugin` README](../plugins/render-method/README.md#the-formattedvalues-convention) for the full contract.

## Architecture

```
                       ┌──────────────────────────────┐
   visual editor ──→   │     IR (CredentialTemplate)   │
                       │     • theme  • elements       │
                       └────────────┬──────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                            ▼
    Canvas (interactive)                      emit.ts (SVG-Mustache)
    direct React-SVG render                   → onSave({ svgMustache })
    sample data interpolated                  → attachRenderMethod
    click-to-select                           templateValue
```

Two pipelines, one IR — **shared theme resolvers and element types** keep them in sync. The Canvas optimizes for interactivity; emit.ts optimizes for correctness + Mustache compatibility.

## Extending with a new render suite

```ts
import { RenderMethodDesigner, type SuiteAdapter } from '@learncard/render-method-designer';

const htmlMustacheAdapter: SuiteAdapter = {
    suite: 'html-mustache',
    mediaType: 'text/html',
    label: 'HTML (Mustache)',
    render: (template, data) => myHtmlRenderer(template, data),
    starterTemplate: '<div>{{credentialSubject.name}}</div>',
};

<RenderMethodDesigner renderSuite="html-mustache" adapters={[htmlMustacheAdapter]} />
```

For visual-mode support of new suites you'll also need a suite-aware emitter; Phase 2 ships an SVG-only emitter.

## Roadmap

**Phase 2**:
- ✅ IR + Zod schema + emitter
- ✅ Visual editor: Canvas, LayersList, PropertiesPanel, ThemePanel
- ✅ Binding picker driven by sample VCs
- ✅ 3 starter templates (Classic / Modern / Minimal)
- ✅ Visual ↔ Code mode toggle
- ✅ Undo / redo

**Phase 3**:
- ✅ Canvas drag-to-move (pointer-based, click-vs-drag threshold, one undo step per drag)
- ✅ 8-handle resize + snap-to-grid (configurable step, defaults to 4px)
- ✅ Element library (click-to-add Text/Rect/Image/Field Row/Divider at canvas center)
- ✅ Drag-reorder layers via `@dnd-kit/sortable`
- ✅ SVG import (basic subset + warning list + embed-as-background fallback)

**Phase 4 (this release)**:
- ✅ `PathElement` first-class support (parsed from Figma exports, rendered + emitted with proportional resize)
- ✅ Image-via-pattern parser chain (Figma's canonical image-fill indirection resolves to `ImageElement`)
- ✅ Drop-shadow effect (`ShadowEffect` on rect/image/path, parsed from Figma drop-shadow filter chains, emitted as canonical filter, CSS-`filter` in canvas)
- ✅ `<g transform="translate/scale">` baking into child coordinates
- ✅ Two new starter templates (`class-formal`, `emblem-badge`) re-authored natively from Figma references
- ✅ Figma export workflow documented (see "Figma export checklist" above)

**Phase 5 (later, optional)**:
- Multi-select + alignment tools
- Block grammar for slot-typed composition
- Custom asset upload (logos, signatures)
- Non-uniform path resize (requires path-data matrix transformation)
- `<mask>` detection for common Figma inset-border patterns
- Rotate / matrix transforms baked via matrix multiplication
- Real font-metrics-aware text wrapping

## Boundary

The designer owns the render and template-authoring pipeline. The plugin (`@learncard/render-method-plugin`) owns the data domain — attach to VC, find on VC, shape Mustache context. The two are intentionally separable: the designer can preview without a wallet; the plugin can run in Node without DOMPurify or React.
