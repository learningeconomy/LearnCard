---
description: The simplest plugin
---

# Build a Plugin

## Quick Start

### Boilerplate

Start with a basic TypeScript node package boilerplate. We recommend using [aqu](https://www.npmjs.com/package/aqu?activeTab=readme):&#x20;

{% hint style="info" %}
Install aqu globally with `npm i -g aqu`.
{% endhint %}

{% tabs %}
{% tab title="Bun" %}

<pre class="language-bash"><code class="lang-bash"><strong>bunx aqu create simple-plugin
</strong>
? Pick package manager: bun
? Specify package description: ()
? Package author:
? Git repository (only for package.json information):
? Pick license: MIT
<strong>? Pick template: typescript
</strong>
cd simple-plugin
</code></pre>

{% endtab %}

{% tab title="yarn" %}

<pre class="language-bash"><code class="lang-bash"><strong>yarn dlx aqu create simple-plugin
</strong>
? Pick package manager: yarn
? Specify package description: ()
? Package author:
? Git repository (only for package.json information):
? Pick license: MIT
<strong>? Pick template: typescript
</strong>
cd simple-plugin
</code></pre>

{% endtab %}

{% tab title="npm" %}

<pre class="language-bash"><code class="lang-bash"><strong>npx aqu create simple-plugin
</strong>
? Pick package manager: npm
? Specify package description: ()
? Package author:
? Git repository (only for package.json information):
? Pick license: MIT
<strong>? Pick template: typescript
</strong>
cd simple-plugin
</code></pre>

{% endtab %}
{% endtabs %}

{% hint style="info" %}
To publish your plugin to npm, see [publishing plugins](the-simplest-plugin.md#publish-your-plugin-to-npm).
{% endhint %}

### Install Dependencies

Install `@learncard/core` (for the `Plugin` type) and `@learncard/init` (for initializing LearnCard):

{% tabs %}
{% tab title="Bun" %}

```bash
bun add @learncard/core @learncard/init
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @learncard/core @learncard/init
```

{% endtab %}

{% tab title="npm" %}

```bash
npm i @learncard/core @learncard/init
```

{% endtab %}
{% endtabs %}

### Create the Types

Define the interface for your plugin using [the `Plugin` type](../../sdks/learncard-core/writing-plugins.md#the-plugin-type):

{% code title="src/types.ts" lineNumbers="true" %}

```typescript
import { Plugin } from '@learncard/core';

export type MyPluginMethods = {
    getFavoriteNumber: () => number;
};

export type MyPluginType = Plugin<'MyPluginName', any, MyPluginMethods>;
```

{% endcode %}

This defines a plugin named `MyPluginName` that exposes one method: `getFavoriteNumber`.

### The six control planes

Plugins can also expose functionality through LearnCard's six standard [control planes](../../core-concepts/architecture-and-principles/control-planes.md):

| Plane     | Purpose                       |
| :-------- | :---------------------------- |
| `read`    | Retrieve credentials and data |
| `store`   | Store and upload credentials  |
| `index`   | Query indexed data            |
| `cache`   | Temporary storage             |
| `id`      | Identity (DIDs, keypairs)     |
| `context` | Resolve context documents     |

If your plugin relies on other plugins, you can specify `DependentControlPlanes` and `DependentMethods` in the `Plugin` type to ensure they are available at initialization.

### Create the Plugin

{% code title="src/index.ts" lineNumbers="true" %}

```typescript
import { MyPluginType } from './types';

export const MyPlugin: MyPluginType = {
    name: 'MyPluginName',
    methods: { getFavoriteNumber: () => 4 },
};
```

{% endcode %}

### Create a Test for Your Plugin

Write tests for your plugins:

{% tabs %}
{% tab title="Bun" %}

```bash
bun add --dev jest @types/jest
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add jest @types/jest --dev
```

{% endtab %}

{% tab title="npm" %}

```bash
npm i --save-dev jest @types/jest
```

{% endtab %}
{% endtabs %}

Then, write your test:

{% code title="test/index.test.ts" lineNumbers="true" %}

```typescript
import { initLearnCard } from '@learncard/init';
import { MyPlugin } from '../src/index';

describe('MyPlugin', () => {
    it('should return my favorite number', async () => {
        const learnCard = await initLearnCard();
        const learnCardWithMyPlugin = await learnCard.addPlugin(MyPlugin);

        const favoriteNumber = learnCardWithMyPlugin.invoke.getFavoriteNumber();

        expect(favoriteNumber).toBe(4);
    });
});
```

{% endcode %}

Run `bun test` to verify:

<img src="../../.gitbook/assets/Screen Shot 2022-11-11 at 4.19.56 PM.png" alt="" data-size="original">

**You've got a simple plugin!**

Now you can add it to a LearnCard object:

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard();
const learnCardWithMyPlugin = await learnCard.addPlugin(MyPlugin);

console.log(learnCardWithMyPlugin.invoke.getFavoriteNumber()); // 4
```

### Publish Your Plugin to NPM

Publish your plugin as a package to NPM.

## Make an npm account

[Create an npm account](https://docs.npmjs.com/creating-a-new-npm-user-account).

## Create the package boilerplate

Use [aqu](https://www.npmjs.com/package/aqu) to create the package boilerplate:

{% tabs %}
{% tab title="Bun" %}

<pre class="language-bash"><code class="lang-bash"><strong>bunx aqu create learn-card-example-plugin
:</strong>
? Pick package manager: bun
? Specify package description: () # Describe your plugin!
? Package author: # Who are you?
? Git repository (only for package.json information): 
? Pick license: MIT # See https://choosealicense.com/
<strong>? Pick template: typescript
</strong>
cd learn-card-example-plugin
</code></pre>

{% endtab %}

{% tab title="yarn" %}

```bash
yarn dlx aqu create learn-card-example-plugin

? Pick package manager: yarn
? Specify package description: () # Describe your plugin!
? Package author: # Who are you?
? Git repository (only for package.json information):
? Pick license: MIT # See https://choosealicense.com/
? Pick template: typescript

cd learn-card-example-plugin
```

{% endtab %}

{% tab title="npm" %}

```bash
npx aqu create learn-card-example-plugin

? Pick package manager: npm
? Specify package description: () # Describe your plugin!
? Package author: # Who are you?
? Git repository (only for package.json information):
? Pick license: MIT # See https://choosealicense.com/
? Pick template: typescript

cd learn-card-example-plugin
```

{% endtab %}
{% endtabs %}

## Create a Github Repo

Create a Github Repo containing the code to your plugin. We recommend using the [Github CLI](https://cli.github.com/).

Create a [Github Account](https://github.com/join), then install and login with the CLI:

```bash
gh auth login
```

Initialize and create the repo:

```bash
git init

echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore

git add .
git commit -m "Initial Commit"

gh repo create
? What would you like to do? Push an existing local repository to GitHub
? Path to local repository .
? Repository name learn-card-example-plugin
? Description Example LearnCard Plugin!
? Visibility Public
✓ Created repository {REPOSITORY_NAME} on GitHub
? Add a remote? Yes
? What should the new remote be called? origin
✓ Added remote {REPOSITORY_URL}
? Would you like to push commits from the current branch to "origin"? Yes
✓ Pushed commits to {REPOSITORY_URL}
```

Add the URL (shown above as `{REPOSITORY_URL}`) to `package.json`:

{% code title="package.json" %}

```json
  "repository": {
    "type": "git",
    "url": {REPOSITORY_URL}
  },
```

{% endcode %}

## Release the Package

Run the release command:

{% tabs %}
{% tab title="Bun" %}

```bash
bun run release
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn release
```

{% endtab %}

{% tab title="npm" %}

```bash
npm run release
```

{% endtab %}
{% endtabs %}

If you didn't use aqu, use the `publish` command directly:

{% tabs %}
{% tab title="Bun" %}

```bash
bun publish
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn publish
```

{% endtab %}

{% tab title="npm" %}

```bash
npm publish
```

{% endtab %}
{% endtabs %}

Your plugin is published and available on npm.

### Next Steps

For more info on adding plugins to a LearnCard:

{% content-ref url="../../core-concepts/architecture-and-principles/plugins.md" %}
[plugins.md](../../core-concepts/architecture-and-principles/plugins.md)
{% endcontent-ref %}

For more info on constructing the LearnCard object:

{% content-ref url="../../sdks/learncard-core/construction.md" %}
[construction.md](../../sdks/learncard-core/construction.md)
{% endcontent-ref %}
