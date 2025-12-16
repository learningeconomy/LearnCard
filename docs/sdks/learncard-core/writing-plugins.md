# Plugin API Reference

### [Plugins](writing-plugins.md#plugin-framework)

The plugin system allows for extending the functionality of LearnCard Core. Plugins can implement control planes and add custom methods to a LearnCard instance.

Plugins are defined using the `Plugin` type, which takes three type parameters:

1. **Name**: A string literal representing the plugin name
2. **Planes**: The control planes the plugin implements
3. **Methods**: Custom methods the plugin provides

For example, a plugin implementing the Read and Store planes would be typed like:

```typescript
Plugin<'MyPlugin', 'read' | 'store', {}>
```

A plugin providing a custom method would be typed like:

```typescript
Plugin<'MyPlugin', any, { customMethod: (param: string) => Promise<string> }>
```

Plugins can be added to a LearnCard instance using the `addPlugin` method:

```typescript
const enhancedLearnCard = await learnCard.addPlugin(myPlugin);
```

### Providers

Plugins are provided by community and core contributors. Given the plugin’s nature, they may also host and maintain infrastructure necessary to sustain its call patterns. For example, an IPFS storage provider might also provide a pinning service, a DID document provider might host document endpoints, etc.

These details are to be provided along with the plugin.

## How to Create a Plugin

If you're looking for a guide on creating a plugin, check-out the [Build a Plugin ](../../how-to-guides/deploy-infrastructure/the-simplest-plugin.md)guide:

{% content-ref url="../../how-to-guides/deploy-infrastructure/the-simplest-plugin.md" %}
[the-simplest-plugin.md](../../how-to-guides/deploy-infrastructure/the-simplest-plugin.md)
{% endcontent-ref %}

## The Plugin Type

If you're creating a plugin, it is _highly_ recommended you use TypeScript and take advantage of the `Plugin` type.

### How to use the `Plugin` Type

#### Complex Example Plugin

The `Plugin` type is a [generic](https://www.typescriptlang.org/docs/handbook/2/generics.html) type, taking in up to five total generic parameters. A Plugin using all five parameters would look like this:

{% code title="Complex Plugin" %}
```typescript
import { Plugin } from '@learncard/core';

type Methods = { foo: () => 'bar' }';
type DependentMethods = { bar: () => 'baz' };

type ComplexPlugin = Plugin<'Complex', 'store', Methods, 'id', DependentMethods>;
```
{% endcode %}

This type describes a plugin named `'Complex'` that implements the [Store](../../core-concepts/architecture-and-principles/control-planes.md#store-control-plane) [Control Plane](../../core-concepts/architecture-and-principles/control-planes.md), as well as the method `foo`. This plugin is also [dependent](writing-plugins.md#depending-on-plugins) on plugins that implement the [ID](../../core-concepts/architecture-and-principles/control-planes.md#id-control-plane) Control Plane, as well as the method _bar_.

Let's break down what each of these arguments are doing one at a time.

#### Arg 1: Name

```typescript
//                          VVVVVVVVV
type ComplexPlugin = Plugin<'Complex', 'store', Methods, 'id', DependentMethods>;
//                          ^^^^^^^^^
```

This argument simply names a plugin. It is a required string, and is used by some Control Planes.

Specifying a name will force objects that have been set to this type to use that name!

#### Arg 2: Planes Implemented

```typescript
//                                     VVVVVVV
type ComplexPlugin = Plugin<'Complex', 'store', Methods, 'id', DependentMethods>;
//                                     ^^^^^^^
```

This argument specifies which [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md) the plugin implements. It can be:

* `any` or `never`, which specifies that this plugin does not implement any Control Planes
* A single string (such as used in the example above), which specifies that this plugin implements a single Control Plane
* A [union](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-types) of strings (e.g. `'store' | 'read'`), which specifies that this plugin implements multiple Control Planes

This argument defaults to `any`, specifying that this plugin does not implement any Control Planes.

Specifying one or more Control Planes implemented will force objects that have been set to this type to implement those planes!

#### Arg 3: Methods Implemented

```typescript
//                                              VVVVVVV
type ComplexPlugin = Plugin<'Complex', 'store', Methods, 'id', DependentMethods>;
//                                              ^^^^^^^
```

This argument specifies which [methods](writing-plugins.md#implementing-methods) the plugin implements. It is an object whose values are functions.

This argument defaults to `Record<never, never>`, specifying that this plugin does not implement any methods.

Specifying methods implemented will force objects that have been set to this type to implement those methods!

#### Arg 4: Dependent Planes

```typescript
//                                                       VVVV
type ComplexPlugin = Plugin<'Complex', 'store', Methods, 'id', DependentMethods>;
//                                                       ^^^^
```

This argument specifies which [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md) the plugin depends on. It can be:

* `any` or `never`, which specifies that this plugin does not depend on any Control Planes
* A single string (such as used in the example above), which specifies that this plugin depends on a single Control Plane
* A [union](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-types) of strings (e.g. `'store' | 'read'`), which specifies that this plugin depends on multiple Control Planes

This argument defaults to `never`, specifying that this plugin does not depend on any Control Planes.

Specifying one or more Dependent Control Planes will add those planes to the [implicit LearnCard](writing-plugins.md#the-implicit-learncard-object) passed into each plugin method!

{% hint style="warning" %}
Specifying Dependent Planes here will _not_ force LearnCards to implement those planes when adding this plugin! Please see [Depending on Plugins](writing-plugins.md#depending-on-plugins) for more information.
{% endhint %}

#### Arg 5: Dependent Methods

```typescript
//                                                             VVVVVVVVVVVVVVVV
type ComplexPlugin = Plugin<'Complex', 'store', Methods, 'id', DependentMethods>;
//                                                             ^^^^^^^^^^^^^^^^
```

This argument specifies which [methods](writing-plugins.md#depending-on-methods) the plugin depends on. It is an object whose values are functions.

This argument defaults to `Record<never, never>`, specifying that this plugin does not depend on any methods.

Specifying dependent methods will add those methods to the [implicit LearnCard](writing-plugins.md#the-implicit-learncard-object) passed into each plugin method!

{% hint style="warning" %}
Specifying Dependent Methods here will _not_ force `LearnCards` to implement those methods when adding this plugin! Please see [Depending on Plugins](writing-plugins.md#depending-on-plugins) for more information.
{% endhint %}

## The LearnCard Type

To add better type safety to a project using LearnCards, it is _highly_ recommended you use TypeScript and take advantage of the `LearnCard` type.

### How to use the `LearnCard` type

#### Option 1: Specify a list of plugins

If you know the exact order and number of plugins you have, you can use the `LearnCard` type to specify a `LearnCard` with those plugins like so:

```typescript
import { LearnCard } from '@learncard/core';
import { PluginA, PluginB, PluginC } from './plugins';

type CustomLearnCard = LearnCard<[PluginA, PluginB, PluginC]>;
```

With this code, `CustomLearnCard` will automatically infer all methods and planes implemented by `PluginA`, `PluginB`, and `PluginC`!

#### Option 2: Specify implemented planes and/or methods

If you don't know the exact order and number of plugins you have, but you know that you would like to specify a `LearnCard` that implements certain planes or methods, you can do that like this:

```typescript
import { LearnCard } from '@learncard/core';

type ImplementsIdPlane = LearnCard<any, 'id'>;
type ImplementsFoo = LearnCard<any, any, { foo: () => 'bar'; }>;
type ImplementsBoth = LearnCard<any, 'id', { foo: () => 'bar': }>;
```

With this code, `ImplementsIdPlane` will accept any `LearnCard` that has plugins that implement the [ID](../../core-concepts/architecture-and-principles/control-planes.md#id-control-plane) [Control Plane](../../core-concepts/architecture-and-principles/control-planes.md), `ImplementsFoo` will accept any `LearnCard` that implements a method named `foo` that returns `'bar'`, and `ImplementsBoth` will accept any `LearnCard` that implements both.



## Implementing Control Planes

In order to promote convergence across Plugin APIs to support common functionality over complex workflows, plugins may choose to implement [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md). Because each plane is slightly different, _how_ they are actually implemented will also be slightly different. For the most part, there are some standard conventions that plugins must follow when implementing methods for a plane.

To demonstrate this, let's build a plugin that implements the [Read](../../core-concepts/architecture-and-principles/control-planes.md#read-control-plane) and [Store](../../core-concepts/architecture-and-principles/control-planes.md#store-control-plane) planes using [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

### Types

Let's start with the types! We will use [the `Plugin` type](writing-plugins.md#the-plugin-type) to define a Plugin that implements the Read and Store planes like so:

{% code title="src/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type LocalStoragePlugin = Plugin<'LocalStorage', 'read' | 'store'>;
```
{% endcode %}

### Implementation

#### Skeleton

Before actually implementing the localStorage functionality, let's build out the skeleton of what our implementation will look like:

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { LocalStoragePlugin } from './types';

export const getLocalStoragePlugin = (): LocalStoragePlugin => {
    return {
        name: 'LocalStorage',
<strong>        read: { get: () => {} },
</strong><strong>        store: { upload: () => {} },
</strong>        methods: {},
    };
};
</code></pre>

Because we specified that this plugin is implementing the `read` and `store` planes, we _must_ include those keys in the returned `Plugin` object. The Read Plane requires we implement a `get` method, and the Store Plane requires we implement at least an `upload` method, so these methods have been stubbed out.

### Implementing the Store Plane

#### URI Scheme

Let's start by implementing the Store Plane! The [Store Plane docs](../../core-concepts/architecture-and-principles/control-planes.md#store-control-plane) mention that the `upload` method should return a [`URI`](../../core-concepts/credentials-and-data/uris.md), so we will now devise a URI scheme. It looks like this:

```typescript
`lc:localStorage:${id}`
```

Where `id` is the identifier used as a key in `localStorage`.

#### UUID

To easily create unique identifiers, we will use the [`uuid`](https://www.npmjs.com/package/uuid) npm package. Creating an ID using that package looks like this:

```typescript
import { v4 as uuidv4 } from 'uuid';
uuidv4(); // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
```

#### Putting it all together

With our URI scheme defined and ID generation in place, let's implement our Store Plane!

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { v4 as uuidv4 } from 'uuid';

import { LocalStoragePlugin } from './types';

export const getLocalStoragePlugin = (): LocalStoragePlugin => {
    return {
        name: 'LocalStorage',
        read: { get: () => {} },
<strong>        store: { 
</strong><strong>            upload: async (_learnCard, vc) => {
</strong><strong>                const id = uuidv4();
</strong><strong>                
</strong><strong>                localStorage.setItem(id, JSON.stringify(vc));
</strong><strong>                
</strong><strong>                return `lc:localStorage:${id}`;
</strong><strong>            } 
</strong><strong>        },
</strong>        methods: {},
    };
};
</code></pre>

{% hint style="info" %}
Wondering what that unused `_learnCard` variable is about? It's [the implicit LearnCard](writing-plugins.md#the-implicit-learncard-object)! Check out what it is and how to use it [here](writing-plugins.md#the-implicit-learncard-object)!
{% endhint %}

With this code in place, the Store Plane has successfully been implemented! Verifiable Credentials can now be stored by a LearnCard using this plugin with the following code:

```typescript
const uri = await learnCard.store.LocalStorage.upload(vc);
```

Now the we can _store_ credentials in localStorage, let's implement _getting_ them out!

### Implementing the Read Plane

To implement the Read Plane, we simply need to verify that the incoming `URI` is one that matches our scheme, and if so, read the value stored in localStorage! This can be done with the following code:

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { v4 as uuidv4 } from 'uuid';

import { LocalStoragePlugin } from './types';

export const getLocalStoragePlugin = (): LocalStoragePlugin => {
    return {
        name: 'LocalStorage',
<strong>        read: { 
</strong><strong>            get: async (_learnCard, uri) => {
</strong><strong>                const sections = uri.split(':');
</strong><strong>                
</strong><strong>                if (sections.length !== 3 || !uri.startsWith('lc:localStorage')) {
</strong><strong>                    return undefined; // Let another plugin resolve this URI!
</strong><strong>                }
</strong><strong>                
</strong><strong>                const storedValue = localStorage.getItem(sections[2]);
</strong><strong>                
</strong><strong>                return storedValue ? JSON.parse(storedValue) : undefined;
</strong><strong>            } 
</strong><strong>        },
</strong>        store: { 
            upload: async (_learnCard, vc) => {
                const id = uuidv4();
                
                localStorage.setItem(id, JSON.stringify(vc));
                
                return `lc:localStorage:${id}`;
            } 
        },
        methods: {},
    };
};
</code></pre>

With this in place, the Read and Store planes have been implemented and LearnCards may use our plugin to store and retrieve credentials from localStorage with the following code:

```typescript
const uri = await learnCard.store.LocalStorage.upload(vc);

// ...Later

const vc = await learnCard.read.get(uri);
```

## Implementing Methods

Sometimes plugins need to expose some bespoke logic that doesn't fit neatly into one of the [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md). Plugin methods allow plugins to expose this logic directly on the resulting LearnCard object.

We have already seen this in action in [The Simplest Plugin](../../how-to-guides/deploy-infrastructure/the-simplest-plugin.md), but let's go into a bit more depth about what's happening here by making a quick plugin that implements a basic counter.

## Types

Before implementing methods on a Plugin object, it's best to get the types in order. In general, starting with the types can be easier to think through, and once they're in place, they can guide the implementation. To add types for methods, we use the third generic argument of [the `Plugin` type](writing-plugins.md#the-plugin-type).

{% code title="src/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type CounterPluginMethods = {
    getCounterValue: () => number;
    incrementCounter: () => void;
    resetCounter: () => void;
};

export type CounterPlugin = Plugin<'Counter', any, CounterPluginMethods>;
```
{% endcode %}

The types above have defined a Plugin with three methods: `get`, `increment`, and `reset`, which will provide basic counter controls.

## Implementation

### Skeleton

With the above types in place, we can build out a skeleton plugin before actually implementing anything:

{% code title="src/index.ts" lineNumbers="true" %}
```typescript
import { CounterPlugin } from './types';

export const getCounterPlugin = (): CounterPlugin => {
    return {
        name: 'Counter',
        methods: {
            getCounterValue: () => {},
            incrementCounter: () => {},
            resetCounter: () => {},
        },
    };
};
```
{% endcode %}

{% hint style="info" %}
We need to wrap the plugin in a `getCounterPlugin` function to be able to store the counter state later
{% endhint %}

### Implementing the Methods

With our boilerplate out of the way, implementing the Counter plugin will be a cakewalk! 🍰&#x20;

We will use the lexical scope of the `getCounterPlugin` function to store out counter state, and manipulate it via the exposed methods.

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { CounterPlugin } from './types';

export const getCounterPlugin = (): CounterPlugin => {
<strong>    let value = 0;
</strong><strong>    
</strong>    return {
        name: 'Counter',
        methods: {
<strong>            getCounterValue: () => value,
</strong><strong>            incrementCounter: () => {
</strong><strong>                value += 1;
</strong><strong>            },
</strong><strong>            resetCounter: () => {
</strong><strong>                value = 0;
</strong><strong>            },
</strong>        },
    };
};
</code></pre>

Our plugin is now complete, and we have successfully implemented bespoke method. Easy as 🍰.&#x20;

Our plugin can be added to and used in a LearnCard like so:

```typescript
const counterLearnCard = await learnCard.addPlugin(getCounterPlugin());

counterLearnCard.invoke.getCounterValue(); // 0

counterLearnCard.invoke.incrementCounter();
counterLearnCard.invoke.getCounterValue(); // 1

counterLearnCard.invoke.incrementCounter();
counterLearnCard.invoke.incrementCounter();
counterLearnCard.invoke.getCounterValue(); // 3

counterLearnCard.invoke.resetCounter();
counterLearnCard.invoke.getCounterValue(); // 0
```

## The Implicit LearnCard Object

### What is it?

When implementing [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md) or [Methods](writing-plugins.md#implementing-methods), you may have noticed [an unused `_learnCard` parameter get added.](writing-plugins.md#the-implicit-learncard-object) This is what we call the _Implicit LearnCard_, and it can be very helpful!

### What does it do?

The Implicit LearnCard allows your Plugin's methods to access an up-to-date version of the LearnCard that it has been added to. This means that you can have access to a full LearnCard without having to wrap your Plugin in a function!

### Why would you use it?

There are a few use-cases for using the Implicit LearnCard, such as:

* Calling a method that is implemented in the same plugin
* Ensuring the most up-to-date method is called

Let's implement a quick plugin that generates names to demonstrate this. The plugin will expose three methods: `generateFirstName`, `generateLastName`, and `generateFullName`. The types for this plugin look like this (using [the `Plugin` type](writing-plugins.md#the-plugin-type)):

{% code title="src/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type NamePluginMethods = {
    generateFirstName: () => string;
    generateLastName: () => string;
    generateFullName: () => string;
};

export type NamePluginType = Plugin<'Name', any, NamePluginMethods>;
```
{% endcode %}

The implementation for this plugin can have `generateFullName` easily call `generateFirstName` and `generateLastName` without having to define them outside of the function thanks to the Implicit LearnCard:

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { NamePluginType } from './types';

export const NamePlugin: NamePluginType = {
    name: 'Name',
    methods: {
        generateFirstName: () => 'First', // Not very useful....
        generateLastName: () => 'Last',   // Imagine a huge list of names being chosen at random
<strong>        generateFullName: learnCard => 
</strong><strong>            `${learnCard.invoke.generateFirstName()} ${learnCard.invoke.generateLastName()}`
</strong>    }
};
</code></pre>

While this example may be a bit contrived, it _does_ demonstrate a few important benefits of the Implicit LearnCard:

* We were able to reuse plugin methods without defining them outside the plugin
* Other plugins are now able to override the functionality of `generateFirstName` and `generateLastName` and `generateFullName` will _automatically_ call the overriden methods!
  * This allows plugins to easily define interfaces for _sub-plugins_ or plugin extensions.
  * This also gives plugins the ability to monkey-patch pieces of another plugin, enhancing or changing that earlier plugin's functionality

### When would you not use it?

#### Privacy

The Implicit LearnCard can be _very_ handy for plugin extensibility and composition. However, there are times you _don't_ want a plugin to be able to be monkey-patched or extended. In such a case, it is a better idea _not_ to use the Implicit LearnCard, and just define the re-usable functions outside the plugin:

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { NamePluginType } from './types';

export const getNamePlugin = (): NamePluginType => {
<strong>    const generateFirstName = () => 'First';
</strong><strong>    const generateLastName = () => 'Last';
</strong>    
    return {
        name: 'Name',
        methods: {
            generateFirstName, // Not very useful....
            generateLastName,   // Imagine a huge list of names being chosen at random
<strong>            generateFullName: learnCard => 
</strong><strong>                `${generateFirstName()} ${generateLastName()}`
</strong>        }
    };
};
</code></pre>

#### Plugin Extensions

Another reason not to use the Implicit LearnCard is when you _specifically_ want an old version of a method you are overriding. To demonstrate this, let's build a quick [Verification Extension](../official-plugins/vc/#verification-extension)

### Types

Building a Verification Extension is super easy with the `VerifyExtension` type coming from the [VC Plugin](../official-plugins/vc/):&#x20;

{% code title="src/types.ts" lineNumbers="true" %}
```typescript
import { Plugin, VerifyExtension } from '@learncard/core';

export type ExtensionPlugin = Plugin<'Extension', any, VerifyExtension>;
```
{% endcode %}

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { LearnCard, VerifyExtension } from '@learncard/core';
import { ExtensionPlugin } from './types';

export const getExtensionPlugin = (
    learnCard: LearnCard&#x3C;any, any, VerifyExtension>
): ExtensionPlugin => ({
    name: 'Extension',
    methods: {
        verifyCredential: async (_learnCard, credential) => {
<strong>            const verificationCheck = await learnCard.invoke.verifyCredential(credential);
</strong>            
            verificationCheck.checks.push('Extension! 😄');
            
            return verificationCheck;
        }
    }
})
</code></pre>

{% hint style="info" %}
See [Depending on Plugins](writing-plugins.md#depending-on-plugins) for more information about how we are depending on a LearnCard with the `verifyCredential` method here.
{% endhint %}

The `VerifyExtension` type defines one method: `verifyCredential` that takes in a Verifiable Credential and returns a `VerificationCheck` object. To add our extension, we depend on a LearnCard that already has the `verifyCredential` function (using the same `VerifyExtension` type!), then call the _old_ `verifyCredential` function at the top of our _new_ `verifyCredential` function.

This pattern allows any number of plugins to add extra verification logic to the `verifyCredential` function easily!

## Depending On Plugins

While it is useful for [The Simplest Plugin](../../how-to-guides/deploy-infrastructure/the-simplest-plugin.md) to add its own isolated logic to a LearnCard, part of the beauty of LearnCard plugins is to _depend_ on other plugins 💪&#x20;

Plugin dependence comes in two flavors:&#x20;

* Depending on a [Control Plane](../../core-concepts/architecture-and-principles/control-planes.md)&#x20;
* Depending on one or more [methods](writing-plugins.md#depending-on-methods).

### Boilerplate Plugins

To demonstrate this, let's create a simple base plugin, as well as two plugins that we will depend on: one for Control Planes, and one for methods.

#### Base Plugin

{% code title="src/dependence/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type DependencePluginType = Plugin<'Dependence', any, { bar: () => 'baz' }>;
```
{% endcode %}

{% code title="src/dependence/index.ts" lineNumbers="true" %}
```typescript
import { DependencePluginType } from './types';

export const DependencePlugin: DependencePluginType = {
    name: 'Dependence',
    methods: { bar: () => 'baz' },
};
```
{% endcode %}

#### Control Plane Plugin

{% code title="src/controlplane/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type ControlPlanePluginType = Plugin<'Control Plane', 'id'>;
```
{% endcode %}

{% code title="src/controlplane/index.ts" lineNumbers="true" %}
```typescript
import { ControlPlanePluginType } from './types';

export const ControlPlanePlugin: ControlPlanePluginType = {
    name: 'Control Plane',
    id: {
        did: () => { throw new Error('TODO'); },
        keypair: () => { throw new Error('TODO'); },
    },
    methods: {},
}
```
{% endcode %}

#### Methods Plugin

{% code title="src/methods/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type MethodsPluginMethods = {
    foo: () => 'bar';
};

export type MethodsPluginType = Plugin<'Methods', any, MethodsPluginMethods>;
```
{% endcode %}

{% code title="src/methods/index.ts" lineNumbers="true" %}
```typescript
import { MethodsPluginType } from './types';

export const MethodsPlugin: MethodsPluginType = {
    name: 'Methods',
    methods: { foo: () => 'bar' },
}
```
{% endcode %}

### Dependence Convention

As a convention, plugins will often be wrapped inside of a constructor function that requires a [LearnCard](writing-plugins.md#the-learncard-type) of a certain type be passed in.

Let's update our base plugin to see what that looks like:

<pre class="language-typescript" data-title="src/dependence/types.ts" data-line-numbers><code class="lang-typescript">import { Plugin } from '@learncard/core';

<strong>export type DependencePlugin = Plugin&#x3C;'Dependence', any, { bar: () => 'baz' }>;
</strong></code></pre>

<pre class="language-typescript" data-title="src/dependence/index.ts" data-line-numbers><code class="lang-typescript"><strong>import { LearnCard } from '@learncard/core';
</strong>import { DependencePlugin } from './types';

<strong>export const getDependencePlugin: (learnCard: LearnCard&#x3C;any>): DependencePluginType => ({
</strong>    name: 'Dependence',
    methods: { bar: () => 'baz' },
<strong>});
</strong></code></pre>

With this change, LearnCards that would like to add our plugin will now look slightly different:

```typescript
// Old
const withPlugin = await learnCard.addPlugin(DependencePlugin);

// New
const withPlugin = await learnCard.addPlugin(getDependencePlugin(learnCard));
```

### Adding dependency requirements

#### Depending on Planes

Now that we're requiring a LearnCard be passed in, we are able to add requirements to the dependent LearnCard! Let's take a look at what that looks like by attempting to take a dependency on the [Control Plane Plugin](writing-plugins.md#control-plane).

{% hint style="info" %}
**Note**: The LearnCard SDK does _not_ support depending on literal plugins. It only supports depending on what plugins _implement_. In practice, this makes plugins much more flexible and easy to work with, allowing dependent plugins to be hot-swapped easily as long as they implement the same dependent methods/planes.
{% endhint %}

<pre class="language-typescript" data-title="src/dependence/index.ts" data-line-numbers><code class="lang-typescript">import { LearnCard } from '@learncard/core';
import { DependencePlugin } from './types';

<strong>export const getDependencePlugin: (learnCard: LearnCard&#x3C;any, 'id'>): DependencePluginType => {
</strong><strong>    console.log('Successfully depended on a Control Plane!', learnCard.id.did());
</strong>    
    return {
        name: 'Dependence',
        methods: { bar: () => 'baz' },
    };
};
</code></pre>

The operative change is right here on line 4:

```typescript
//                                                           VVVV
export const getDependencePlugin: (learnCard: LearnCard<any, 'id'>): DependencePluginType => {
//                                                           ^^^^
```

This change allows us to call `learnCard.id.did` on line 5, and requires consumers of this plugin to pass in a LearnCard that [implements](writing-plugins.md#implementing-control-planes) the [ID](../../core-concepts/architecture-and-principles/control-planes.md#id-control-plane) plane when adding this plugin. For example, all of the following code will throw errors:

{% tabs %}
{% tab title="Passing in an empty wallet" %}
```typescript
import { initLearnCard } from '@learncard/core';

const learnCard = await initLearnCard({ custom: true });

const errors = await learnCard.addPlugin(getDependencePlugin(learnCard));
// TS Error: Property 'id' is missing
```
{% endtab %}

{% tab title="Passing in an incorrect wallet" %}
```typescript
import { initLearnCard } from '@learncard/core';

const learnCard = await initLearnCard();

const errors = await learnCard.addPlugin(getDependencePlugin(learnCard));
// TS Error: Property 'id' is missing
```
{% endtab %}

{% tab title="Incorrect plugin config" %}
<pre class="language-typescript"><code class="lang-typescript">// --snip--
<strong>export const getDependencePlugin: (learnCard: LearnCard&#x3C;any>): DependencePluginType => {
</strong>    console.log(learnCard.id.did());
    // TS Error: Property 'id' does not exist
</code></pre>
{% endtab %}
{% endtabs %}

#### Depending on Methods

Depending on a specific method (or methods) rather than a Control Plane looks very similar. To demonstrate this, let's stop depending on the ID Plane for a moment, and instead just depend on the `foo` method from the [Methods Plugin](writing-plugins.md#methods).

<pre class="language-typescript" data-title="src/dependence/index.ts" data-line-numbers><code class="lang-typescript">import { LearnCard } from '@learncard/core';
import { DependencePlugin } from './types';

<strong>export const getDependencePlugin: (learnCard: LearnCard&#x3C;any, any, { foo: () => 'bar' }>): DependencePluginType => {
</strong><strong>    console.log('Successfully depended on a Method!', learnCard.invoke.foo());
</strong>    
    return {
        name: 'Dependence',
        methods: { bar: () => 'baz' },
    };
};
</code></pre>

The operative change is, once again, on line 4:

```typescript
//                                                                VVVVVVVVVVVVVVVVVVVV
export const getDependencePlugin: (learnCard: LearnCard<any, any, { foo: () => 'bar' }>): DependencePluginType => {
//                                                                ^^^^^^^^^^^^^^^^^^^^
```

With this change in place, just like when we depended on a Control Plane, we are now able to call `learnCard.invoke.foo` on line 5. We also now require consumers of this plugin to pass in a LearnCard with a plugin that [implements](writing-plugins.md#implementing-methods) the `foo` method. For example, all of the following code will throw errors:

{% tabs %}
{% tab title="Passing in an empty wallet" %}
```typescript
import { initLearnCard } from '@learncard/core';

const learnCard = await initLearnCard({ custom: true });

const errors = await learnCard.addPlugin(getDependencePlugin(learnCard));
// TS Error: Property 'foo' is missing
```
{% endtab %}

{% tab title="Passing in an incorrect wallet" %}
```typescript
import { initLearnCard } from '@learncard/core';

const learnCard = await initLearnCard();

const errors = await learnCard.addPlugin(getDependencePlugin(learnCard));
// TS Error: Property 'foo' is missing
```
{% endtab %}

{% tab title="Incorrect plugin config" %}
<pre class="language-typescript"><code class="lang-typescript">// --snip--
<strong>export const getDependencePlugin: (learnCard: LearnCard&#x3C;any>): DependencePluginType => {
</strong>    console.log(learnCard.invoke.foo());
    // TS Error: Property 'foo' does not exist
</code></pre>
{% endtab %}
{% endtabs %}

### Adding Type Safety to The Implicit LearnCard

Thus far, when adding dependency requirements, we have _only_ added type safety to the argument of our constructor function. This works quite well, but does _not_ provide type safety to the [Implicit LearnCard](writing-plugins.md#the-implicit-learncard-object) passed into every method. To add this type safety, we use the fourth and fifth generic arguments of [the `Plugin` type](writing-plugins.md#the-plugin-type)

Let's demonstrate this by first depending on both the [Control Plane Plugin](writing-plugins.md#control-plane-plugin) _and_ the [Methods Plugin](writing-plugins.md#methods-plugin), then adding some logic that uses the Implicit LearnCard to take advantage of that dependency:

<pre class="language-typescript" data-title="src/dependence/index.ts" data-line-numbers><code class="lang-typescript">import { LearnCard } from '@learncard/core';
import { DependencePlugin } from './types';

<strong>export const getDependencePlugin: (learnCard: LearnCard&#x3C;any, 'id', { foo: () => 'bar' }>): DependencePluginType => {
</strong>    return {
        name: 'Dependence',
        methods: { 
<strong>            bar: _learnCard => {
</strong><strong>                 // these two calls with throw TS errors!
</strong><strong>                 console.log('Did is:', _learnCard.id.did());
</strong><strong>                 console.log('Foo is:', _learnCard.invoke.foo());
</strong><strong>            
</strong><strong>                return 'baz';
</strong><strong>            } 
</strong>        },
    };
};
</code></pre>

Because we haven't added our dependencies to the `DependencePlugin` type itself, TS has no way of knowing that the Implicit LearnCard implements the ID Plane and the `foo` method! We can easily fix this by updating the `DependencePlugin` type:

<pre class="language-typescript" data-title="src/dependence/types.ts" data-line-numbers><code class="lang-typescript">import { Plugin } from '@learncard/core';

//                                                                             VVVVVVVVVVVVVVVVVVVVVVVVVV
<strong>export type DependencePlugin = Plugin&#x3C;'Dependence', any, { bar: () => 'baz' }, 'id', { foo: () => 'bar' }>;
</strong>//                                                                             ^^^^^^^^^^^^^^^^^^^^^^^^^^
</code></pre>

With these in place, TS will know to add the ID Plane and the `foo` method to the Implicit LearnCard, and the above errors will go away!

## Private Fields

Sometimes it is important for a Plugin to keep private state/data. This can be done using the lexical scope of the constructor function described in [Depending on Plugins](writing-plugins.md#depending-on-plugins)!

To demonstrate this, let's build a quick secret message plugin that gates a string behind a password. This plugin will use a constructor function that takes in a message and a password, exposing a `getMessage` method that will return the message if the correct password is passed in and `changePassword`/`changeMessage` methods that allow updating the password/message.

{% code title="src/types.ts" lineNumbers="true" %}
```typescript
import { Plugin } from '@learncard/core';

export type SecretMessagePluginMethods = {
    getMessage: (password: string) => string;
    changePassword: (oldPassword: string, newPassword: string) => boolean;
    changeMessage: (message: string, password: string) => boolean;
};

export type SecretMessagePlugin = Plugin<'Secret Message', any, SecretMessagePluginMethods>;
```
{% endcode %}

<pre class="language-typescript" data-title="src/index.ts" data-line-numbers><code class="lang-typescript">import { SecretMessagePlugin } from './types';

export const getSecretMessagePlugin = (message: string, password: string): SecretMessagePlugin => {
<strong>    let currentMessage = message;
</strong><strong>    let currentPassword = password;
</strong>    
    return {
        name: 'Secret Message',
        methods: {
            getMessage: (_learnCard, _password) => {
<strong>                if (_password !== currentPassword) throw new Error('Wrong password!');
</strong>                
<strong>                return currentMessage;
</strong>            },
            changePassword: (_learnCard, oldPassword, newPassword) => {
<strong>                if (oldPassword !== currentPassword) throw new Error('Wrong password!');
</strong>                
<strong>                currentPassword = newPassword;
</strong>                
                return true;
            },
            changeMessage: (_learnCard, newMessage, _password) => {
<strong>                if (_password !== currentPassword) throw new Error('Wrong password!');
</strong>                
<strong>                currentMessage = newMessage;
</strong>                
                return true;
            },
        },
    };
};
</code></pre>

This plugin can be used like so:

```typescript
const secretMessageLearnCard = await learnCard.addPlugin(getSecretMessagePlugin('nice', 'pw'));

secretMessageLearnCard.invoke.getMessage(); // Error: Wrong password!
secretMessageLearnCard.invoke.getMessage('pw') // 'nice'

secretMessageLearnCard.invoke.changePassword('pw', 'test') // true
secretMessageLearnCard.invoke.getMessage('pw') // Error: Wrong password!
secretMessageLearnCard.invoke.getMessage('test') // 'nice'

secretMessageLearnCard.invoke.changeMessage('Neat!', 'test') // true
secretMessageLearnCard.invoke.getMessage('test') // 'Neat!'
```
