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

- `attachRenderMethod(vc: UnsignedVC, config: AttachRenderMethodConfig): UnsignedVC` — adds a `renderMethod` entry to the VC and injects the render context if not already present.
- `buildTemplateRenderMethod(config: AttachRenderMethodConfig): TemplateRenderMethod` — constructs a `TemplateRenderMethod` object without mutating a VC.

### `AttachRenderMethodConfig`

| Field | Type | Description |
|-------|------|-------------|
| `templateId` | `string` | URL of the hosted SVG Mustache template |
| `digestMultibase` | `string?` | SHA-256 multibase digest for integrity verification |
| `renderProperty` | `string[]?` | JSON Pointer paths (RFC 6901) limiting which VC fields are exposed to the template |

## Quick start

```ts
import { getRenderMethodPlugin } from '@learncard/render-method-plugin';

const lc = await baseLc.addPlugin(getRenderMethodPlugin(baseLc));

const unsignedVc = lc.invoke.getTestVc();

const vcWithRender = lc.invoke.attachRenderMethod(unsignedVc, {
    templateId: 'https://templates.example.com/badge.svg',
    digestMultibase: 'zQmHash...',
    renderProperty: ['/name', '/description'],
});

const signedVc = await lc.invoke.issueCredential(vcWithRender);
```

## Notes

- The plugin is stateless and has no required dependent methods or control planes.
- See `src/types.ts` for types and `src/plugin.ts` for implementation details.
