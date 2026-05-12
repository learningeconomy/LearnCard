# @learncard/render-method-plugin

Attach W3C `renderMethod` entries to Verifiable Credentials using SVG Mustache templates.

## Install

This plugin is part of the LearnCard monorepo and is built with the workspace.

## Requirements

Add this plugin to an existing LearnCard instance:

```ts
import { getRenderMethodPlugin } from '@learncard/render-method-plugin';

const lc = await baseLc.addPlugin(getRenderMethodPlugin(baseLc));
```

## API

- `attachRenderMethod(vc: UnsignedVC, config?: AttachRenderMethodConfig): UnsignedVC` — adds a `renderMethod` entry to the VC and injects the render context if not already present. Merges with any existing `renderMethod` entries.
- `buildTemplateRenderMethod(config?: AttachRenderMethodConfig): TemplateRenderMethod` — constructs a `TemplateRenderMethod` object without mutating a VC.

Both methods fall back to the default hosted template (`https://templates.learncard.com/svg/card/card-1.0.0.svg`) when no config is provided.

### `AttachRenderMethodConfig`

`templateId` and `templateValue` are mutually exclusive — provide one or the other.

| Field | Type | Description |
|-------|------|-------------|
| `templateId` | `string` | URL of a hosted SVG Mustache template |
| `templateValue` | `string` | Inline SVG Mustache content (embedded as a `data:image/svg+xml` URI) |
| `renderProperty` | `string[]?` | JSON Pointer paths (RFC 6901) scoping which VC fields are exposed to the template |

## Quick start

### Using a hosted template

```ts
const vcWithRender = lc.invoke.attachRenderMethod(unsignedVc, {
    templateId: 'https://templates.example.com/badge.svg',
    renderProperty: ['/credentialSubject/name', '/credentialSubject/description'],
});

const signedVc = await lc.invoke.issueCredential(vcWithRender);
```

### Using an inline template

```ts
const svgTemplate = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>';

const vcWithRender = lc.invoke.attachRenderMethod(unsignedVc, {
    templateValue: svgTemplate,
});

const signedVc = await lc.invoke.issueCredential(vcWithRender);
```

### Building a render method descriptor independently

```ts
const renderMethod = lc.invoke.buildTemplateRenderMethod({
    templateId: 'https://templates.example.com/badge.svg',
});
// renderMethod.type === 'TemplateRenderMethod'
// renderMethod.renderSuite === 'svg-mustache'
```

## Notes

- The plugin is stateless and has no required dependent methods or control planes.
- Only `svg-mustache` is supported as a render suite at this time.
- See `src/types.ts` for types and `src/plugin.ts` for implementation details.
