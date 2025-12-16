---
description: The simplest plugin
---

# Build a Plugin

## Quick Start

### Boilerplate

Start with a basic TypeScript node package boilerplate. If you've never done that before, we recommend using [aqu](https://www.npmjs.com/package/aqu?activeTab=readme):&#x20;

{% hint style="info" %}
If you don't have aqu installed, you can install it globally with `npm i -g aqu.`
{% endhint %}

{% tabs %}
{% tab title="pnpm" %}
<pre class="language-bash"><code class="lang-bash"><strong>pnpm dlx aqu create simple-plugin
</strong>
? Pick package manager: pnpm
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
If you'd like to publish your plugin to npm for others to use, please see our documentation on [publishing plugins](the-simplest-plugin.md#publish-your-plugin-to-npm)
{% endhint %}

### Install @learncard/core

Using your preferred package manager, install `@learncard/core`

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm i @learncard/core
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @learncard/core
```
{% endtab %}

{% tab title="npm" %}
```bash
npm i @learncard/core
```
{% endtab %}
{% endtabs %}

### Create the Types

To ease plugin development, it's best to start by defining the interface for your plugin. This can be done quite easily using [the `Plugin` type](../../sdks/learncard-core/writing-plugins.md#the-plugin-type):

{% code title="src/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type MyPluginMethods = {
    getFavoriteNumber: () => number;
};

export type MyPluginType = Plugin<'MyPluginName', any, MyPluginMethods>;
```
{% endcode %}

The preceding file defines a plugin named `MyPluginName` that exposes one method: `getFavoriteNumber`

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

It's important to write tests for your plugins, so others can rely on them :thumbsup:

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm i --save-dev jest @types/jest
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
import { initLearnCard } from '@learncard/core';
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

If all looks good, you should be able to `pnpm test` and successfully pass the test:

<img src="../../.gitbook/assets/Screen Shot 2022-11-11 at 4.19.56 PM.png" alt="" data-size="original">

**That's it—you've got a simple plugin! 🎉**

Now you can add it to a LearnCard object:

```typescript
const learnCard = await initLearnCard();
const learnCardWithMyPlugin = await learnCard.addPlugin(MyPlugin);

console.log(learnCard.invoke.getFavoriteNumber()); // 4
```

### Publish Your Plugin to NPM

If you don't have anything secret contained in your plugin, you are encouraged to publish it as a package to NPM and share it with the world 🏆.

Let's walk through how to do that together:

## Make an npm account

If you haven't yet, [follow these short steps to create an npm account](https://docs.npmjs.com/creating-a-new-npm-user-account). You will need to come up with a username, email, and password!

## Create the package boilerplate

As noted in our docs on [The Simplest Plugin](the-simplest-plugin.md#boilerplate), if you've never set up a TS/node package before, we greatly recommend using [aqu](https://www.npmjs.com/package/aqu)!

{% tabs %}
{% tab title="pnpm" %}
<pre class="language-bash"><code class="lang-bash"><strong>yarn dlx aqu create learn-card-example-plugin
</strong>
? Pick package manager: yarn
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
pnpm dlx aqu create learn-card-example-plugin

? Pick package manager: pnpm
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

If you've selected an open source license (such as MIT or ISC), please make a Github Repo containing the code to your plugin! If you've never done this before, we recommend using the [Github CLI](https://cli.github.com/).

First, create a [Github Account](https://github.com/join), then install and login with the CLI. This is usually done with the following command:

```bash
gh auth login
```

After getting all setup, initialize and create the repo with the following commands:

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

After getting a repo up, it's a good idea to add the URL (shown above as `{REPOSITORY_URL}`) to the `package.json`!

{% code title="package.json" %}
```json
  "repository": {
    "type": "git",
    "url": {REPOSITORY_URL}
  },
```
{% endcode %}

## Release the Package

With everything set up, you may run the release command!

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm release
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

If you didn't use aqu to create your package, you may need to use the `publish` command directly:

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm publish
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

Congratulations! 🥳 Your plugin is officially published and others may use it by installing it from npm!

### Next Steps

For more info on adding plugins to a LearnCard:

{% content-ref url="../../core-concepts/architecture-and-principles/plugins.md" %}
[plugins.md](../../core-concepts/architecture-and-principles/plugins.md)
{% endcontent-ref %}

For more info on constructing the LearnCard object:

{% content-ref url="../../sdks/learncard-core/construction.md" %}
[construction.md](../../sdks/learncard-core/construction.md)
{% endcontent-ref %}
