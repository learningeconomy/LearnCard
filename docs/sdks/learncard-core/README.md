---
description: Initialization, configuration, and troubleshooting for the LearnCard Wallet SDK.
---

# LearnCard Wallet SDK

The **LearnCard Wallet SDK**, installed as `@learncard/init`, runs in Node.js and browsers to create identities, issue and verify credentials, and connect to LearnCloud. `initLearnCard` returns the same LearnCard object used in the [Quickstart](../../quick-start/your-first-integration.md), with plugins supplying methods and standard control planes for identity, storage, and retrieval.

## Install the SDK

Install using the package manager of your choice:

{% tabs %}
{% tab title="Bun" %}

```bash
bun add @learncard/init
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @learncard/init
```

{% endtab %}

{% tab title="npm" %}

```bash
npm i @learncard/init
```

{% endtab %}
{% endtabs %}

## `initLearnCard` options

These options select and configure the built-in plugin stacks; they are not all available in every initialization mode. See [Initialization & Authentication](authentication.md) for complete examples.

| Option                | Accepted value                                                                                  | Default / behavior when omitted                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `seed`                | String containing a 32-byte private seed encoded as 64 hexadecimal characters                   | No generated seed; without a seed or another mode selector, returns a verification-only instance. Keep the seed private. |
| `network`             | `true` or a network tRPC URL string                                                             | No network plugin; `true` selects `https://network.learncard.com/trpc`. Use with `seed` or `apiKey`.                     |
| `didWeb`              | `did:web` identifier string, with `seed`                                                        | No DID Web plugin; seed-based initialization uses `did:key`. Publish the corresponding DID document separately.          |
| `cloud`               | Object with `url`, `unencryptedFields`, `unencryptedCustomFields`, `automaticallyAssociateDids` | Seed-based defaults: URL `https://cloud.learncard.com/trpc`, both field arrays `[]`, automatic DID association `true`.   |
| `didkit`              | WASM `InitInput`, a promise of it, or `'node'`                                                  | Uses the version-locked public WASM URL below; `'node'` selects the native Node plugin.                                  |
| `allowRemoteContexts` | Boolean                                                                                         | `false`; enable only when credentials need trusted JSON-LD contexts outside the bundled set.                             |
| `custom`              | `true`                                                                                          | Omitted: use a built-in stack. `true`: start with no plugins and add them explicitly.                                    |

## Hosting the DIDKit WASM

The default WASM loader fetches a binary matched to its JavaScript glue from this public endpoint:

```text
https://assets.learncard.ai/didkit/sha256-a058bcc6f5e9f037c26e1b29d81dfc8ac94c8e4593ce39fa78f3c2f810796c2e/didkit_wasm_bg.wasm
```

To host it yourself, serve `@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm` from your installed package as a static asset with `Content-Type: application/wasm`. Keep the binary and package version together; do not substitute a binary from another release. With Vite, import the asset URL and pass it to `initLearnCard`:

```typescript
import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

const learnCard = await initLearnCard({ didkit }); // Verification-only instance
```

For a signing instance, add your securely loaded `seed` to the same options object. Other bundlers can emit the file as a URL asset, or you can pass the URL of your static copy directly as `didkit`. In Node.js, use `didkit: 'node'` when the native plugin is available, or pass the matching WASM bytes; `?url` is bundler syntax, not a Node.js import.

## Troubleshooting

| Symptom                               | Likely cause                                                            | Fix                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| WASM loading failure                  | Missing or mismatched binary, or a browser asset import used in Node.js | In a bundler, emit and serve the matching WASM URL; in Node.js, use the native plugin or matching binary bytes (see above).        |
| Module resolution / ESM errors        | Missing packages, incompatible versions, or a module format mismatch    | Install `@learncard/init`, align LearnCard package versions, and use ESM imports in an ESM project (`.mjs` or `"type": "module"`). |
| “Plugin not found” / method undefined | The selected stack lacks the plugin or its dependencies                 | Use the appropriate initialization mode; await `addPlugin`, keep its returned instance, and load dependencies first.               |
| `undefined JSON-LD term` when issuing | A credential property is not defined by its `@context`                  | Add the context defining the term or remove the property; allow trusted remote contexts only when they are not bundled.            |
| DID resolution failure for `did:web`  | The DID document is missing, unreachable, or has incorrect keys         | Serve the correct `did.json` over HTTPS at the DID's domain/path, with verification methods matching the signing key.              |

## Where to next

- [Initialization & Authentication](authentication.md)
- [Methods (Usage Examples)](construction.md)
- [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md)
- [Plugin API](writing-plugins.md)
- [Changelog](migration-guide.md)
