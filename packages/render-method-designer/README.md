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

- **Canvas** renders the IR directly as React-SVG (no Mustache parse on each keystroke). Click an element to select; transform handles will land in Phase 3.
- **Layers** mirrors the IR tree. ↑/↓ buttons reorder z-index; ⧉ duplicates; ✕ deletes. Drag-to-reorder lands in Phase 3.
- **Properties** dispatches by element type: Text, Rect, Image, Field-Row, Divider. Each surfaces a binding picker driven by the active sample VC.
- **Theme** exposes the 8-color palette + heading/body fonts. Theme tokens are referenced as `$primary` etc. on the IR; the emitter resolves them at save time.

## Code mode

The code-first editor: CodeMirror XML + Mustache, sample-VC live preview, variable picker, validation toolbar. Use when the visual editor can't represent something you need (custom paths, masks, complex filters).

## Starter templates

Three ship in the box:

| ID | Name | Use case |
|---|---|---|
| `classic` | Classic Card | Centered avatar, gradient header, IDs and badges |
| `modern` | Modern Bold | Full-bleed dark gradient, eyebrow text, premium credentials |
| `minimal` | Minimal | Clean bordered monochrome, institutional/formal credentials |

Add your own gallery entries via `extraTemplates` on `VisualEditor` or compose your own picker around the IR.

## IR (Intermediate Representation)

The IR is the canonical source of truth. The visual editor mutates the IR; the emitter (`emitSvgMustache`) converts the IR to SVG-Mustache on save. SVG-Mustache is **not** parsed back into IR — consumers persist the IR alongside the rendered template if they want round-trip visual editing.

Element types in Phase 2: `rect`, `text`, `image`, `field-row`, `divider`. All support theme-token references (`$primary`), credential bindings (`{{path}}` with fallback), and visibility predicates (`whenPresent: path` hides the element when the bound field is missing).

See `src/ir/types.ts` for the full IR shape, `src/ir/schema.ts` for the Zod validators, and `src/ir/emit.ts` for the emitter.

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

**Phase 2 (this release)**:
- ✅ IR + Zod schema + emitter
- ✅ Visual editor: Canvas, LayersList, PropertiesPanel, ThemePanel
- ✅ Binding picker driven by sample VCs
- ✅ 3 starter templates (Classic / Modern / Minimal)
- ✅ Visual ↔ Code mode toggle
- ✅ Undo / redo

**Phase 3 (planned)**:
- Drag-and-drop element placement on canvas
- Resize handles + snap-to-grid
- Element library (add new elements without leaving the canvas)
- Drag-reorder layers
- Block grammar for slot-typed composition
- Custom asset upload (logos, signatures)
- Expanded starter gallery (commissioned design pass)

**Phase 4 (later, optional)**:
- Free positioning, multi-select, alignment tools
- Arbitrary SVG import with explicit lossy-conversion warning
- Real font-metrics-aware text wrapping

## Boundary

The designer owns the render and template-authoring pipeline. The plugin (`@learncard/render-method-plugin`) owns the data domain — attach to VC, find on VC, shape Mustache context. The two are intentionally separable: the designer can preview without a wallet; the plugin can run in Node without DOMPurify or React.
