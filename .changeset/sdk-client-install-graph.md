---
'@learncard/network-brain-client': minor
'@learncard/learn-cloud-client': minor
'@learncard/learn-cloud-plugin': minor
'@learncard/core': minor
'@learncard/crypto-plugin': minor
'@learncard/lca-api-plugin': minor
'@learncard/network-brain-service': patch
'@learncard/learn-cloud-service': patch
---

Stop installing the backend services and React Native tooling with the SDK.

-   `@learncard/network-brain-client` and `@learncard/learn-cloud-client` no longer depend on `@learncard/network-brain-service` / `@learncard/learn-cloud-service`. Their published type declarations now contain the router types they need, so consumers type-check without the server packages. `@learncard/learn-cloud-client` also exports `Filter`, which `@learncard/learn-cloud-plugin` now imports from there.
-   `@learncard/core`, `@learncard/crypto-plugin` and `@learncard/lca-api-plugin` no longer depend on `isomorphic-webcrypto`, which pulled in Expo and React Native through its optional dependencies. They use the platform's `globalThis.crypto` (Node.js 20+, every current browser). Environments without WebCrypto, such as React Native, must load a polyfill before initializing LearnCard; `learnCard.invoke.crypto()` throws a clear error if it is missing.
-   The service packages publish only `dist`, `README.md` and `CHANGELOG.md`.
