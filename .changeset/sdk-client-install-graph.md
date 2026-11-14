---
'@learncard/types': patch
'@learncard/network-brain-client': minor
'@learncard/learn-cloud-client': minor
'@learncard/learn-cloud-plugin': minor
'@learncard/core': major
'@learncard/crypto-plugin': major
'@learncard/lca-api-plugin': major
'@learncard/init': major
'@learncard/react': major
'@learncard/holder-continuity': major
'@learncard/create-http-bridge': major
'@learncard/network-brain-service': patch
'@learncard/learn-cloud-service': patch
---

Stop installing the backend services and React Native tooling with the SDK.

-   `@learncard/network-brain-client` and `@learncard/learn-cloud-client` no longer depend on `@learncard/network-brain-service` / `@learncard/learn-cloud-service`. Their published entry points use built JavaScript and bundled declarations under both default and development conditions. The brain client bundles its helper runtime dependencies in ESM and CommonJS. The declarations contain the router types they need, so consumers type-check without the server packages. `@learncard/learn-cloud-client` also exports `Filter`, which `@learncard/learn-cloud-plugin` now imports from there.
-   `@learncard/core`, `@learncard/crypto-plugin` and `@learncard/lca-api-plugin` no longer depend on `isomorphic-webcrypto`, which pulled in Expo and React Native through its optional dependencies. They use the platform's `globalThis.crypto` (Node.js 20+, every current browser). **Breaking for environments without WebCrypto** (React Native, Node.js 18 and older): they must now load a WebCrypto polyfill before initializing LearnCard; `learnCard.invoke.crypto()` throws a clear error if it is missing.
-   `@learncard/types` declares the `zod-openapi` type augmentation imported by its published development sources, so client types also resolve with the development condition enabled.
-   The service packages publish only `dist`, `README.md` and `CHANGELOG.md`.

The WebCrypto requirement is a major release for `core`, `crypto-plugin`, and the public entry points that initialize LearnCard: `init`, `lca-api-plugin`, `react`, `holder-continuity`, and `create-http-bridge`. Changesets otherwise propagates internal dependency updates as patches; explicit majors prevent existing compatible ranges from silently losing the polyfill. The CLI already requires Node.js 20+, and packages that only reference core/plugin types do not acquire a new runtime requirement.
