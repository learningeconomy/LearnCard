---
id: network-type-flow
title: Network type flow
sidebar_label: Network type flow
sidebar_position: 1
---

# Network type flow and adding routes

This guide traces how types defined in `@learncard/types` move through the network services into the final `LearnCard` used in end‑to‑end tests. It also shows how to expose a new route on the `LearnCard` object.

## Type definitions

Network request and response shapes live in `@learncard/types`. For example, profile data is described with Zod validators that are exported for reuse across the stack【F:packages/learn-card-types/src/lcn.ts†L1-L78】.

## Brain service

The Brain service composes these validators into a tRPC `AppRouter` that defines all server routes【F:services/learn-card-network/brain-service/src/app.ts†L1-L56】. Individual routes import the shared validators to enforce input and output types. A profile creation example is shown below【F:services/learn-card-network/brain-service/src/routes/profiles.ts†L84-L126】.

## Brain client

`@learncard/network-brain-client` imports the `AppRouter` type and uses it to create a fully typed tRPC client. The client handles challenge/response authentication and exposes strongly typed methods for every route【F:packages/learn-card-network/brain-client/src/index.ts†L1-L60】.

## Network plugin

The LearnCard Network plugin creates a Brain client and exposes it through plugin methods. When added to a wallet, these methods become available via `learnCard.invoke.*`. The plugin also exports the raw client for advanced use【F:packages/plugins/learn-card-network/src/plugin.ts†L1-L52】【F:packages/plugins/learn-card-network/src/plugin.ts†L1068-L1075】.

## Initialization

`@learncard/init` assembles a standard plugin stack and finally adds the Network plugin so that network routes are available on any initialized wallet【F:packages/learn-card-init/src/initializers/networkLearnCardFromSeed.ts†L1-L83】.

## End‑to‑end tests

End‑to‑end tests create a network‑enabled wallet with `initLearnCard` and call plugin methods such as `createProfile` to exercise the entire stack【F:tests/e2e/tests/init.spec.ts†L1-L25】.

## Plugin system

Plugins are merged into the LearnCard via `addPlugin`, which rebuilds the wallet with the new plugin list【F:packages/learn-card-core/src/wallet/base/wallet.ts†L50-L60】. Plugin methods are bound onto the `invoke` helper so they are accessible from the final `learnCard` instance【F:packages/learn-card-core/src/wallet/base/wallet.ts†L780-L807】.

## Adding a new network route

1. **Define types** in `packages/learn-card-types/src/lcn.ts`.
2. **Implement the server route** in `services/learn-card-network/brain-service/src/routes` using those validators and ensure it is added to the `AppRouter`.
3. **Rebuild the Brain client** – it consumes the exported `AppRouter` so the new route is typed automatically.
4. **Expose the route in the Network plugin** by adding a method that calls the new client procedure.
5. **Initialize** with `initLearnCard` (the Network plugin is included by default) and call the new method via `learnCard.invoke`.
6. **Test** the new route in `tests/e2e` using the top‑level script: `pnpm test:e2e`.

These steps ensure types flow consistently from definition to testing and help avoid stale builds by relying on Nx‑managed scripts.
