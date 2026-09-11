# Plugins

Plugins compose the LearnCard SDK — each one adds functionality through Control Planes (standard interfaces like `read`, `store`, and `index`) or methods exposed via `invoke`. [`initLearnCard`](../../core-concepts/architecture-and-principles/plugins.md) loads the standard stack automatically, so most integrations never add a plugin by hand.

## Included by default

Loaded automatically by `initLearnCard({ seed })` — no separate install, no manual `addPlugin` call.

| Plugin                          | Package                            | What it adds                                                                                                                                                                               |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LearnCard (Universal Wallet)    | `@learncard/learn-card-plugin`     | Wraps `verifyCredential` with a friendlier, more opinionated output.                                                                                                                       |
| Crypto                          | `@learncard/crypto-plugin`         | Isomorphic WebCrypto object usable in both the browser and Node.                                                                                                                           |
| DIDKit                          | `@learncard/didkit-plugin`         | DID/VC/VP primitives (key generation, signing, verification, DID resolution) via Spruce's DIDKit, compiled to WASM. See [DIDKit (Node)](didkit-node.md) for the native, server-side build. |
| [DIDKit (Node)](didkit-node.md) | `@learncard/didkit-plugin-node`    | Native N-API build of DIDKit — ~18x faster cold start than WASM. Optional dependency of `@learncard/init`; opt in with `didkit: 'node'`.                                                   |
| DID Key                         | `@learncard/didkey-plugin`         | Derives `did:key` DIDs and keypairs from a 32-byte seed; implements the ID Control Plane.                                                                                                  |
| VC                              | `@learncard/vc-plugin`             | Signs/verifies credentials and presentations; exposes the `VerifyExtension` type so sub-plugins can add their own verification checks.                                                     |
| Expiration                      | `@learncard/expiration-plugin`     | VC sub-plugin (built on `VerifyExtension`) that adds an expiration check to `verifyCredential`.                                                                                            |
| [VC-Templates](vc-templates.md) | `@learncard/vc-templates-plugin`   | Pre-built templates (`basic`, `achievement`, boosts, ...) for `newCredential()`.                                                                                                           |
| [LearnCloud](learncloud.md)     | `@learncard/learn-cloud-plugin`    | Encrypted cloud storage for credentials via the LearnCloud API (`read`/`store`/`index` planes).                                                                                            |
| [Ethereum](ethereum.md)         | `@learncard/ethereum-plugin`       | Balance and transfer operations for the wallet's Ethereum address.                                                                                                                         |
| [VPQR](vpqr.md)                 | `@learncard/vpqr-plugin`           | Compresses Verifiable Presentations into QR codes (CBOR-LD) and back.                                                                                                                      |
| CHAPI                           | `@learncard/chapi-plugin`          | Send/receive credentials and presentations via the Credential Handler API.                                                                                                                 |
| Dynamic Loader                  | `@learncard/dynamic-loader-plugin` | Resolves unrecognized JSON-LD contexts over HTTP at runtime. Discouraged outside test/playground use (security risk) — enable with `allowRemoteContexts: true`.                            |

## Network

Loaded automatically when you pass `network: true` (in addition to the default stack above).

| Plugin                                    | Package                     | What it adds                                                                                                                                                                                                                        |
| ----------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LearnCard Network](learncard-network.md) | `@learncard/network-plugin` | Profiles, connections, credentials, presentations, boosts, and skill search via LearnCloud Network.                                                                                                                                 |
| VC-API                                    | `@learncard/vc-api-plugin`  | Signs/verifies against a VC-API endpoint (e.g. LearnCard Bridge), with automatic Issuer DID discovery. Bundled with `@learncard/init`, but loads via the separate `initLearnCard({ vcApi: ... })` entry point, not `network: true`. |

## Install separately

Not bundled with `@learncard/init` — `bun add` the package and `addPlugin` it yourself.

| Plugin                                  | Package                              | What it adds                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Claimable Boosts](claimable-boosts.md) | `@learncard/claimable-boosts-plugin` | Generates claimable links/QR codes so credentials can be issued before the recipient's DID is known. Pairs with the LCA API plugin.                                              |
| LCA API                                 | `@learncard/lca-api-plugin`          | LearnCard-managed Signing Authorities and other LearnCard App services. `initLCALearnCard()` (same package) builds a full network wallet with this plugin pre-added in one call. |
| [Ceramic](ceramic.md)                   | `@learncard/ceramic-plugin`          | Stores/reads credentials on Ceramic, with optional JWE encryption.                                                                                                               |
| IDX                                     | `@learncard/idx-plugin`              | Manages a `CredentialRecord` list on IDX/Ceramic; implements the Index Control Plane.                                                                                            |

## Write your own

See [Build a Plugin](https://github.com/learningeconomy/LearnCard/blob/main/packages/learn-card-core/PLUGINS.md) for a step-by-step guide to writing your own plugin.
