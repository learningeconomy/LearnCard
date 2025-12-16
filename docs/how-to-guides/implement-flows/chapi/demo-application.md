---
description: Let's Build a CHAPI Wallet App together!
---

# 🖥️ Demo Application

Hey there! 👋 Let's build a CHAPI Wallet App together with LearnCard!

## Pre-Reqs

### pnpm

For this example, we will be using [pnpm](https://pnpm.io/) as a package manager, so let's make sure we have it installed!

```bash
npm i -g pnpm
```

### Astro

[Astro](https://astro.build/) is a wonderful new Javascript framework that we will be using to build this app. If you haven't heard of or used Astro before, have no fear! It is _very_ similar to React, and allows you to import and use React components when necessary, so if you've used React before, you should feel very comfortable using Astro!

### Vite

Under the hood, Astro is using [Vite](https://vitejs.dev/) to bundle and serve files. If you haven't heard of Vite before, I highly recommend checking it out, and definitely consider using it any time you need to make a new website as a replacement for Webpack! We will only need to do a tiny bit of Vite configuration, so have no fear, Vite is only here to make our development process faster!

### ESBuild

Under the hood, Vite is using [ESBuild](https://esbuild.github.io/) to transpile files. This means that ESBuild is ultimately responsible for stripping out TypeScript types, and for converting common js and esm modules back and forth. We won't need to much configuration with ESBuild at all for this site, however, it is definitely important to be aware that it exists under the hood if you find yourself running into issues!

## Boilerplate

### Astro

We will use [Astro](https://astro.build/) to create this app, so let's go ahead and begin!

```bash
pnpm create astro chapi-example
> Include sample files (recommended)
> Do you plan to write TypeScript? > Yes
> How strict should TypeScript be? > Strict (recommended)
> Install dependencies? (recommended) > Yes
> Initialize a new git repository? (optional) > Yes
```

### React and Tailwind

Great! Now let's `cd chapi-example` and start setting up some boilerplate. To start, let's add support for React and Tailwind

```bash
cd chapi-example
pnpm exec astro add react
> Continue? yes
> Continue? yes
> Continue? yes
pnpm exec astro add tailwind
> Continue? yes
> Continue? yes
> Continue? yes
```

### Aliases

We are going to be importing from a few common directories. To make this easier to do, let's set up some quick TS aliases! Open up the `tsconfig.json` file and add the following:

<pre class="language-json" data-title="tsconfig.json" data-line-numbers><code class="lang-json">{
    "extends": "astro/tsconfigs/strictest",
<strong>    "compilerOptions": {
</strong><strong>        "jsx": "react",
</strong><strong>        "baseUrl": ".",
</strong><strong>        "paths": {
</strong><strong>            "@components/*": ["./src/components/*"],
</strong><strong>            "@helpers/*": ["./src/helpers/*"],
</strong><strong>            "@layouts/*": ["./src/layouts/*"]
</strong><strong>        }
</strong><strong>    }
</strong>}
</code></pre>

### HTTPS in Dev

CHAPI requires us to serve even our dev server over HTTPS, so let's set that up now!

{% hint style="info" %}
**Hint:** This plugin will cause an Insecure warning to appear when visiting our site! This is nothing to worry about, and you may simple click "Proceed anyway" and safely ignore that warning.
{% endhint %}

```bash
pnpm i -D @vitejs/plugin-basic-ssl
```

<pre class="language-javascript" data-title="astro.config.mjs" data-line-numbers><code class="lang-javascript">import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

<strong>import basicSsl from '@vitejs/plugin-basic-ssl';
</strong>
// https://astro.build/config
export default defineConfig({
<strong>  vite: {
</strong><strong>    plugins: [basicSsl()],
</strong><strong>  },
</strong>  integrations: [react(), tailwind()],
});
</code></pre>

### Polyfills

[Vite](https://vitejs.dev/) (the bundler that Astro uses under the hood!) has a hard time running `@learncard/core` out of the box due to some deep dependencies relying on the node.js standard library. Fortunately, it is fairly straightforward to polyfill! Let's add that now

```bash
pnpm i -D @esbuild-plugins/node-globals-polyfill node-stdlib-browser
```

{% code title="astro.config.mjs" lineNumbers="true" %}
```javascript
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

import basicSsl from "@vitejs/plugin-basic-ssl";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import stdlibbrowser from "node-stdlib-browser";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [basicSsl()],
    optimizeDeps: {
      esbuildOptions: {
        define: { global: "globalThis" },
        plugins: [NodeGlobalsPolyfillPlugin({ process: true, buffer: true })],
      },
    },
    resolve: { alias: stdlibbrowser },
  },
  integrations: [react(), tailwind()],
});
```
{% endcode %}

Great! With all that boilerplate out of the way, we can now _finally_ begin the real dev work!

## Landing Page

Let's pop open a terminal and fire up the dev server!

```bash
pnpm dev
```

Then, open up a browser and go to `https://localhost:3000` (take great care to make sure you're using https and _not_ http!) You should see a screen like this:

{% hint style="info" %}
**Hint:** If you get a warning about the site being insecure, that is okay! You may just click "proceed anyway" and continue your local development.
{% endhint %}

<figure><img src="../../../.gitbook/assets/image (21).png" alt=""><figcaption></figcaption></figure>

Let's remove all this default content and get a basic skeleton app for a simple wallet.&#x20;

<pre class="language-tsx" data-title="src/pages/index.astro" data-line-numbers><code class="lang-tsx">---
import Layout from "@layouts/Layout.astro";
---

&#x3C;Layout title="Welcome to Astro.">
<strong>  &#x3C;section id="modal-container">&#x3C;/section>
</strong>
  &#x3C;main class="w-full h-full flex flex-col justify-center items-center p-4">
    &#x3C;header>
      &#x3C;h1>LearnCard CHAPI Example&#x3C;/h1>
    &#x3C;/header>

    &#x3C;h3 id="loading-wallet">Loading wallet...&#x3C;/h3>
  &#x3C;/main>
&#x3C;/Layout>
</code></pre>

Change background color in the `Layout.astro` file to white so you can read the dark text.

{% code title="src/layouts/Layout.astro" %}
```tsx
...
html {
    font-family: system-ui, sans-serif;
    background: white;
    background-size: 224px;
}
...
```
{% endcode %}

The site should now look like this:

<figure><img src="../../../.gitbook/assets/image (23).png" alt=""><figcaption></figcaption></figure>

It's not much, but it's a start! Let's stop that loading text from lying to us and actually add in a wallet! For the purposes of this demo app, let's hardcode the seed `'1234'`. In a real app, you would never want to hardcode the seed used for the wallet, preferring instead to use a truly random source to generate a seed, then securely storing it, but for now, we will be fine simply hardcoding `'1234'`.

To begin, let's install `@learncard/init`, `@learncard/types`, and `@learncard/chapi-plugin`

```bash
pnpm i @learncard/init @learncard/types @learncard/chapi-plugin
```

Then, we'll instantiate a wallet, and update the UI to reflect that our loading is finished.

<pre class="language-tsx" data-title="src/pages/index.astro" data-line-numbers><code class="lang-tsx">---
import Layout from "@layouts/Layout.astro";
---

&#x3C;Layout title="LearnCard CHAPI Example">
  &#x3C;section id="modal-container">&#x3C;/section>

  &#x3C;main class="w-full h-full flex flex-col justify-center items-center p-4">
    &#x3C;header>
      &#x3C;h1>LearnCard CHAPI Example&#x3C;/h1>
    &#x3C;/header>

    &#x3C;h3 id="loading-wallet">Loading wallet...&#x3C;/h3>
  &#x3C;/main>
&#x3C;/Layout>

<strong>&#x3C;script>
</strong><strong>  import { initLearnCard } from "@learncard/init";
</strong><strong>
</strong><strong>  const learnCard = await initLearnCard({ seed: "1234" });
</strong><strong>
</strong><strong>  const loadingWallet = document.getElementById(
</strong><strong>    "loading-wallet"
</strong><strong>  ) as HTMLElement;
</strong><strong>
</strong><strong>  loadingWallet.innerText = "Wallet loaded!";
</strong><strong>&#x3C;/script>
</strong></code></pre>

This will update our UI to reveal that a wallet has been loaded! Great!

<figure><img src="../../../.gitbook/assets/image (25).png" alt=""><figcaption></figcaption></figure>

Once we've got CHAPI set up and we're able to store credentials in our wallet, we'll come back to this page and display the credentials we've stored, but for now, we can call it a day on this Landing Page! Phew! 😅

## CHAPI

In order to set up CHAPI, we'll need to do a few things:

* Install/run the web-credential-polyfill
* Run the `installHandler` method
* Host a public manifest.json file
* Host a public wallet service worker
* Host a storage endpoint for users to visit when storing a credential via CHAPI

Let's run through those now!

### Install/run the web-credential-polyfill

This is implicitly done for us when calling `initLearnCard`, so we're already done here!

### Run the installHandler method

Our first real step! To do this, simply call the `installChapiHandler` method on the wallet object!

{% code title="src/pages/index.astro" %}
```typescript
  const wallet = await initLearnCard({ seed: "1234" });

  await wallet.invoke.installChapiHandler();
```
{% endcode %}

### Host a public manifest.json file

This part is a bit tricky. What we need to do is decide on a route to use as a service worker, and then encode that inside of our manifest.json file. Let's use `/wallet-worker`:

{% code title="public/manifest.json" lineNumbers="true" %}
```json
{
  "name": "LearnCard Demo CHAPI Wallet",
  "short_name": "LearnCard Demo CHAPI Wallet",
  "credential_handler": {
    "url": "/wallet-worker",
    "enabledTypes": ["VerifiablePresentation"]
  }
}
```
{% endcode %}

### Host a public wallet service worker

This is where the really interesting bit happens! This service worker will actually be a full route that uses LearnCard to call some special methods. The actual content displayed on this route doesn't matter very much. However, we will need to make an important decision here: What should the user see when being asked to store a credential? In this case, we will redirect them to another route that we will create at `/store.`

{% code title="src/pages/wallet-worker.astro" lineNumbers="true" %}
```tsx
---
import Layout from "@layouts/Layout.astro";
---

<Layout title="wallet-worker">
  <h1>LearnCard CHAPI Example Wallet Worker</h1>

  <h3>You probably shouldn't see this page...</h3>
</Layout>

<script>
  import { initLearnCard } from "@learncard/init";

  const learnCard = await initLearnCard();

  learnCard.invoke.activateChapiHandler({
    store: async () => {
      return { type: "redirect", url: `${window.location.origin}/store` };
    },
  });
</script>
```
{% endcode %}

If you try to visit this page manually, there's not much to see, and you may notice that errors appear in your browser's console. However, when reaching this page via CHAPI, something very important happens:

```typescript
learnCard.invoke.activateChapiHandler({
  store: async () => {
    return { type: "redirect", url: `${window.location.origin}/store` };
  },
});
```

This small snippet of code tells CHAPI that we'd like to display the `/store` page when a site requests to store a credential with our software. Let's make that `/store` page now!

### Host a storage endpoint for users to visit when storing a credential via CHAPI

We've finally reached our first page that will have enough javascript to justify using React! Let's setup a basic astro page that renders a React component:

{% code title="src/pages/store.astro" lineNumbers="true" %}
```tsx
---
import Layout from '@layouts/Layout.astro';
import CredentialStorage from '@components/CredentialStorage';
---

<Layout title="Store a Credential">
    <CredentialStorage client:only="react" />
</Layout>
```
{% endcode %}

Now, let's build out the `CredentialStorage` component! Let's start with a basic React component:

{% code title="src/components/CredentialStorage.tsx" lineNumbers="true" %}
```tsx
import React from "react";

const CredentialStorage: React.FC = () => {
  return <div></div>;
};

export default CredentialStorage;
```
{% endcode %}

Now, let's figure out how to retrieve and display the requested credential!

#### Retrieving the Credential

In order to retrieve the credential, we can use the `receiveChapiEvent` method on a LearnCard wallet. This method is asynchronous, so we'll need to use state and an effect for this to work:

<pre class="language-tsx" data-title="src/components/CredentialStorage.tsx" data-line-numbers><code class="lang-tsx"><strong>import React, { useState, useEffect } from "react";
</strong><strong>import { initLearnCard } from "@learncard/init";
</strong>import type { CredentialStoreEvent } from "@learncard/chapi-plugin";

const CredentialStorage: React.FC = () => {
<strong>  const [event, setEvent] = useState&#x3C;CredentialStoreEvent>();
</strong><strong>
</strong>  useEffect(() => {
    const fetchData = async () => {
      const learnCard = await initLearnCard();

      const _event = await learnCard.invoke.receiveChapiEvent();

      if ("credential" in _event) setEvent(_event);
    };
    fetchData();
  }, []);
<strong>  
</strong><strong>  if (!event) return &#x3C;h1>Loading...&#x3C;/h1>;
</strong>
  return &#x3C;div>&#x3C;/div>;
};

export default CredentialStorage;
</code></pre>

Because `learnCard.invoke.receiveChapiEvent` can technically be run on both a `store` and `get` page, we need to make TypeScript happy by checking that this is actually a `store` event. This is done by the `if ("credential" in _event")` check.

#### Displaying the Credential

In order to display the credential, we will use the `VCCard` component from `@learncard/react`. Before we can do that, however, we will need to first extract the credential from the raw event we received from CHAPI. To do this, we will create a helper that grabs a Verifiable Credential from a Verifiable Presentation:

{% code title="src/helpers/credential.helpers.ts" lineNumbers="true" %}
```typescript
import type { VP, VC } from "@learncard/types";

export const getCredentialFromVp = (vp: VP): VC => {
  const vcField = vp.verifiableCredential;

  return Array.isArray(vcField) ? vcField[0] : vcField;
};
```
{% endcode %}

By making use of this helper, we can now extract the credential and display it to the user.

```bash
pnpm i @learncard/react
```

<pre class="language-tsx" data-title="src/components/CredentialStorage.tsx" data-line-numbers><code class="lang-tsx">import React, { useState, useEffect } from "react";
import { initLearnCard } from "@learncard/init";
import type { CredentialStoreEvent } from "@learncard/chapi-plugin";
<strong>import { VCCard } from "@learncard/react";
</strong><strong>
</strong><strong>import "@learncard/react/dist/main.css";
</strong><strong>
</strong><strong>import { getCredentialFromVp } from "@helpers/credential.helpers";
</strong>
const CredentialStorage: React.FC = () => {
  const [event, setEvent] = useState&#x3C;CredentialStoreEvent>();

  useEffect(() => {
    const fetchData = async () => {
      const learnCard = await initLearnCard();

      const _event = await learnCard.invoke.receiveChapiEvent();

      if ("credential" in _event) setEvent(_event);
    };
    fetchData();
  }, []);

  if (!event) return &#x3C;h1>Loading...&#x3C;/h1>;

  const presentation = event?.credential?.data;
<strong>
</strong><strong>  const credential = presentation &#x26;&#x26; getCredentialFromVp(presentation);
</strong><strong>
</strong><strong>  return (
</strong><strong>    &#x3C;div className="w-full h-full flex flex-col justify-center items-center gap-4 p-4">
</strong><strong>      &#x3C;VCCard credential={credential} />
</strong><strong>    &#x3C;/div>
</strong><strong>  );
</strong>};

export default CredentialStorage;
</code></pre>

#### Storing the Credential

The final step for this page is to allow the user to either add an id and store this credential, or to reject this credential without storing it. Let's add that now!

{% code title="src/components/CredentialStorage.tsx" lineNumbers="true" %}
```tsx
import React, { useState, useEffect } from "react";
import { initLearnCard } from "@learncard/init";
import type { CredentialStoreEvent } from "@learncard/chapi-plugin";
import { VCCard } from "@learncard/react";

import "@learncard/react/dist/main.css";

import { getCredentialFromVp } from "@helpers/credential.helpers";

const CredentialStorage: React.FC = () => {
  const [event, setEvent] = useState<CredentialStoreEvent>();
  const [id, setId] = useState("Test");

  useEffect(() => {
    const fetchData = async () => {
      const learnCard = await initLearnCard();

      const _event = await learnCard.invoke.receiveChapiEvent();

      if ("credential" in _event) setEvent(_event);
    };
    fetchData();
  }, []);

  if (!event) return <h1>Loading...</h1>;

  const accept = async () => {
    const learnCard = await initLearnCard({ seed: "1234" });

    const uri = await learnCard.store.LearnCloud.upload(credential);

    await learnCard.index.LearnCloud.add({ id, uri });

    event.respondWith(
      Promise.resolve({
        dataType: "VerifiablePresentation",
        data: presentation,
      })
    );
  };

  const reject = () => event.respondWith(Promise.resolve(null));

  const presentation = event?.credential?.data;

  const credential = presentation && getCredentialFromVp(presentation);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="w-full h-full flex flex-col justify-center items-center gap-4 p-4"
    >
      <VCCard credential={credential} />

      <fieldset>
        <label className="flex gap-2">
          Title:
          <input
            type="text"
            onChange={(e) => setId(e.target.value)}
            value={id}
          />
        </label>
      </fieldset>

      <fieldset className="flex gap-4">
        <button
          type="button"
          className="bg-green-200 rounded border px-4 py-2"
          onClick={accept}
        >
          Accept
        </button>
        <button
          type="button"
          className="bg-red-200 rounded border px-4 py-2"
          onClick={reject}
        >
          Reject
        </button>
      </fieldset>
    </form>
  );
};

export default CredentialStorage;
```
{% endcode %}

Phew! That was a lot of code! But now let's test it out! Head on over to [https://playground.chapi.io/issuer](https://playground.chapi.io/issuer) and try issuing yourself a credential! You should ultimately land on a page like this:

<figure><img src="../../../.gitbook/assets/image (8).png" alt=""><figcaption><p>CredentialStorage in action!</p></figcaption></figure>

<figure><img src="../../../.gitbook/assets/image (13).png" alt=""><figcaption><p>Backside of VC Card</p></figcaption></figure>

## Managing Credentials

Great! We've now set up a full CHAPI flow for storing credentials into a wallet! But what good is it to store credentials that you can't see? Let's head back to our Landing Page and add some Credential Management.

### CredentialListItem

We will want to display our credentials in an unordered list, so let's start with what a given list item will look like! To make things simple, we'll just display its title and add a delete button to allow the user to remove the credential from their wallet.

{% code title="src/components/CredentialListItem.tsx" lineNumbers="true" %}
```tsx
import React from "react";
import { initLearnCard } from "@learncard/init";
import type { CredentialRecord } from "@learncard/types";

export type CredentialListItemProps = {
  credential: CredentialRecord;
};

const CredentialListItem: React.FC<CredentialListItemProps> = ({
  credential: idxCredential,
}) => {
  const deleteCredential = async () => {
    const learnCard = await initLearnCard({ seed: "1234" });

    if (confirm("Are you sure you want to delete this credential?")) {
      await learnCard.index.IDX.remove(idxCredential.id);
      window.location.reload();
    }
  };

  return (
    <li className="rounded flex items-center overflow-hidden">
      <button type="button" className="w-full h-full bg-blue-100 py-2">
        {idxCredential.id}
      </button>

      <button
        type="button"
        onClick={deleteCredential}
        className="h-full bg-red-500 text-white border-l border-gray-300 p-2"
      >
        Delete
      </button>
    </li>
  );
};

export default CredentialListItem;
```
{% endcode %}

### Credentials

In order to actually render those List Items, we'll need to grab our credentials from the Wallet! Let's make a `Credentials` component to do this:

{% code title="src/components/Credentials.tsx" lineNumbers="true" %}
```tsx
import React, { useState, useEffect } from "react";
import { initLearnCard, type LearnCardFromSeed } from "@learncard/init";
import type { CredentialRecord } from "@learncard/types";
import CredentialListItem from "@components/CredentialListItem";

import { VCDisplayCard } from "@learncard/react";

const Credentials: React.FC = () => {
  const [credentialsList, setCredentialsList] = useState<CredentialRecord[]>();
  const [learnCard, setLearnCard] =
    useState<LearnCardFromSeed["returnValue"]>();

  useEffect(() => {
    initLearnCard({ seed: "1234" }).then(setLearnCard);
  }, []);

  useEffect(() => {
    if (learnCard) learnCard.index.LearnCloud.get().then(setCredentialsList);
  }, [learnCard]);

  if (!learnCard || !credentialsList) return <></>;

  const credentials =
    credentialsList.length === 0 ? (
      <>
        Looks like you don't have any credentials! Visit
        https://playground.chapi.io/issuer to add one!
      </>
    ) : (
      credentialsList.map((credential) => (
        <CredentialListItem key={credential.title} credential={credential} />
      ))
    );

  return (
    <section className="max-w-5xl w-5/6 border rounded p-4 bg-gray-100">
      <header className="flex gap-2 justify-center items-center border-b pb-2 mb-2">
        <h2>Credentials</h2>
        <span className="text-gray-600 text-sm">(Click to view)</span>
      </header>
      <ul className="flex flex-col gap-2">{credentials}</ul>
    </section>
  );
};

export default Credentials;
```
{% endcode %}

Now let's actually render this on the index page!

{% code title="src/pages/index.astro" lineNumbers="true" %}
```tsx
---
import Layout from "@layouts/Layout.astro";
import Credentials from "@components/Credentials";
---

<Layout title="LearnCard CHAPI Example">
  <section id="modal-container"></section>

  <main class="w-full h-full flex flex-col justify-center items-center p-4">
    <header>
      <h1>LearnCard CHAPI Example</h1>
    </header>

    <h3 id="loading-wallet">Loading wallet...</h3>

    <Credentials client:only="react" />
  </main>
</Layout>

<script>
  import { initLearnCard } from "@learncard/init";

  const wallet = await initLearnCard({ seed: "1234" });

  await wallet.invoke.installChapiHandler();

  const loadingWallet = document.getElementById(
    "loading-wallet"
  ) as HTMLElement;

  loadingWallet.innerText = "Wallet loaded!";
</script>
```
{% endcode %}
