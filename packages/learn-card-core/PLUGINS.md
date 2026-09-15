# Build a Plugin

Plugins extend LearnCard with custom functionality. A plugin is an object that conforms to the `Plugin` type, exposing methods or control planes.

**~10 minutes · Needs:** Bun and TypeScript

## Set up a package

Start with a TypeScript package containing a `src` directory. Install the core types and initializer:

```bash
bun add @learncard/core @learncard/init
```

Alternatively, use `npm install @learncard/core @learncard/init` or `yarn add @learncard/core @learncard/init` in your existing TypeScript project.

## Create the types

In `src/types.ts`, define the methods using the [Plugin type](../../docs/sdks/learncard-core/writing-plugins.md#the-plugin-type):

```typescript
import type { Plugin } from '@learncard/core';

export type MyPluginMethods = {
    getFavoriteNumber: () => number;
};

export type MyPluginType = Plugin<'MyPluginName', never, MyPluginMethods>;
```

This defines a plugin named `MyPluginName` with one method, `getFavoriteNumber`, and no control planes.

## The six control planes

Plugins can also implement LearnCard's standard [control planes](../../docs/core-concepts/architecture-and-principles/control-planes.md):

| Plane     | Purpose                       |
| --------- | ----------------------------- |
| `read`    | Retrieve credentials and data |
| `store`   | Store and upload credentials  |
| `index`   | Query indexed data            |
| `cache`   | Temporary storage             |
| `id`      | Identity (DIDs, keypairs)     |
| `context` | Resolve context documents     |

If your plugin relies on other plugins, declare `DependentControlPlanes` and `DependentMethods` in its `Plugin` type, and add those dependencies first.

## Create the plugin

In `src/index.ts`:

```typescript
import type { MyPluginType } from './types';

export const MyPlugin: MyPluginType = {
    name: 'MyPluginName',
    methods: { getFavoriteNumber: () => 4 },
};
```

## Test your plugin

In `test/index.test.ts`, use Bun's built-in test runner:

```typescript
import { describe, expect, it } from 'bun:test';
import { initLearnCard } from '@learncard/init';
import { MyPlugin } from '../src/index';

describe('MyPlugin', () => {
    it('returns my favorite number', async () => {
        const base = await initLearnCard({ custom: true });
        const withMyPlugin = await base.addPlugin(MyPlugin);

        expect(withMyPlugin.invoke.getFavoriteNumber()).toBe(4);
    });
});
```

Run `bun test`. The assertion should pass with the value `4`.

`addPlugin` is asynchronous and returns a new, typed LearnCard instance. Keep that returned instance to access the added methods; the original instance does not gain them.

## Next steps

- [Plugin API](../../docs/sdks/learncard-core/writing-plugins.md) covers dependencies and lifecycle.
- [Wallet SDK reference](../../docs/sdks/learncard-core/README.md) covers the built-in initialization stacks.
- Browse [official plugin implementations](../plugins/) for examples of methods and control planes.
