# @welibraryos/lca-api-client

## 1.1.32

### Patch Changes

-   [#1394](https://github.com/learningeconomy/LearnCard/pull/1394) [`147d2a5fda49ba33f20077400ac3aae633bddb05`](https://github.com/learningeconomy/LearnCard/commit/147d2a5fda49ba33f20077400ac3aae633bddb05) Thanks [@goblincore](https://github.com/goblincore)! - perf: eagerly prefetch DID-Auth challenges with single-flight refills so client setup overlaps network latency without duplicate pools when the first request races construction.

## 1.1.31

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.26

## 1.1.30

### Patch Changes

-   [`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Republish package metadata with concrete internal dependency versions instead of workspace protocol ranges.

-   Updated dependencies [[`9b1f8352946f78f382f85d95c5e983d86449ea68`](https://github.com/learningeconomy/LearnCard/commit/9b1f8352946f78f382f85d95c5e983d86449ea68)]:
    -   @learncard/simple-signing-service@1.2.25

## 1.1.29

### Patch Changes

-   [#1303](https://github.com/learningeconomy/LearnCard/pull/1303) [`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Switch workspace development to Bun source-mode resolution while preserving package build outputs for npm publishing.

-   [#1335](https://github.com/learningeconomy/LearnCard/pull/1335) [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930) Thanks [@goblincore](https://github.com/goblincore)! - fix(packaging): ship ESM-clean named exports from the tRPC client packages and route `@learncard/init`'s Node ESM entry at the real ESM bundle

    The four generated tRPC client packages (`lca-api-client`, `simple-signing-client`,
    `network-brain-client`, `learn-cloud-client`) previously exposed only a CJS
    `main` (a `NODE_ENV`-switching `mixedEntrypoint`) with no `exports` map. Under
    Node's native ESM loader this bound to the CJS entry, whose named exports
    (`getClient`, `getApiTokenClient`) the CommonJS lexer could not see through the
    `module.exports = require(...)` indirection — so `import { getClient } from ...`
    threw "getClient not found". Each package now declares `"type": "module"`, emits
    its CJS bundles with a `.cjs` extension, and publishes a dual `exports` map
    (`import` → real ESM build, `require` → CJS entry) mirroring `@learncard/types`
    and `@learncard/helpers`. Each also gains the `files: ["dist"]` field it was
    previously missing (with `dist` gitignored, `pnpm pack` shipped zero build
    artifacts — now caught by `scripts/validate-packages.mjs`, which also gates the
    three network clients going forward).

    With the leaf clients resolving cleanly as ESM, `@learncard/init` no longer needs
    the `createRequire(import.meta.url)` shim (`node-esm.mjs`) that routed Node ESM
    consumers back through the CJS bundle — a shape that crashed when bundled
    (`esbuild --platform=node` compiles `import.meta` away → `createRequire(undefined)`).
    `init`'s `node.import` condition now points directly at `init.esm.js`, which loads
    natively under Node ESM and bundles cleanly under esbuild/Vite. The didkit backend
    is unchanged: it is still selected at call-time via the `didkit: 'node'` argument
    (lazy `import('@learncard/didkit-plugin-node')`), independent of the entry module
    format. This repairs the esbuild bundler job of the daily published-packages
    smoketest and clears the clients' "known broken" advisory list.

-   Updated dependencies [[`69ef21bda3e003e83f4d842c52e037acf528af09`](https://github.com/learningeconomy/LearnCard/commit/69ef21bda3e003e83f4d842c52e037acf528af09)]:
    -   @learncard/simple-signing-service@1.2.24

## 1.1.28

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.23

## 1.1.27

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.22

## 1.1.26

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.21

## 1.1.25

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.20

## 1.1.24

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.19

## 1.1.23

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.18

## 1.1.22

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.17

## 1.1.21

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.16

## 1.1.20

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.15

## 1.1.19

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.14

## 1.1.18

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.13

## 1.1.17

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.12

## 1.1.16

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.11

## 1.1.15

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.10

## 1.1.14

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.9

## 1.1.13

### Patch Changes

-   Updated dependencies [[`bb2996d35d13c52c2a3c983b1b521338678bd68d`](https://github.com/learningeconomy/LearnCard/commit/bb2996d35d13c52c2a3c983b1b521338678bd68d)]:
    -   @learncard/simple-signing-service@1.2.8

## 1.1.12

### Patch Changes

-   Updated dependencies [[`bd25921c5a9c06bab25092ebe9485aa2be452d19`](https://github.com/learningeconomy/LearnCard/commit/bd25921c5a9c06bab25092ebe9485aa2be452d19)]:
    -   @learncard/simple-signing-service@1.2.7

## 1.1.11

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.6

## 1.1.10

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.5

## 1.1.9

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.4

## 1.1.8

### Patch Changes

-   Updated dependencies [[`50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe`](https://github.com/learningeconomy/LearnCard/commit/50e72d3dd3abc9a8d4309ce1b3c1637f1baf6dbe)]:
    -   @learncard/simple-signing-service@1.2.3

## 1.1.7

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.2

## 1.1.6

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.2.1

## 1.1.5

### Patch Changes

-   Updated dependencies [[`7e30fc7116411ba19a4889cfbf9fc71dd725c309`](https://github.com/learningeconomy/LearnCard/commit/7e30fc7116411ba19a4889cfbf9fc71dd725c309)]:
    -   @learncard/simple-signing-service@1.2.0

## 1.1.4

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.1.4

## 1.1.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.1.3

## 1.1.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.1.2

## 1.1.1

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.1.1

## 1.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`bun run test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/simple-signing-service@1.1.0

## 1.0.37

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.37

## 1.0.36

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.36

## 1.0.35

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.35

## 1.0.34

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.34

## 1.0.33

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.33

## 1.0.32

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.32

## 1.0.31

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.31

## 1.0.30

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.30

## 1.0.29

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.29

## 1.0.28

### Patch Changes

-   Updated dependencies [[`f61e75a7a1de5913e4a7a2b381aa9815e726cec3`](https://github.com/learningeconomy/LearnCard/commit/f61e75a7a1de5913e4a7a2b381aa9815e726cec3), [`3627c858a339630e4cf033b64cb04564ff78040c`](https://github.com/learningeconomy/LearnCard/commit/3627c858a339630e4cf033b64cb04564ff78040c)]:
    -   @learncard/simple-signing-service@1.0.28

## 1.0.27

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.27

## 1.0.26

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.26

## 1.0.25

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.25

## 1.0.24

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.24

## 1.0.23

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.23

## 1.0.22

### Patch Changes

-   [#765](https://github.com/learningeconomy/LearnCard/pull/765) [`41a24971a8e9a916736c82e44b5b41f1da1f1a67`](https://github.com/learningeconomy/LearnCard/commit/41a24971a8e9a916736c82e44b5b41f1da1f1a67) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow using bundler moduleResolution

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.22

## 1.0.21

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.21

## 1.0.20

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.20

## 1.0.19

### Patch Changes

-   Updated dependencies [[`3922c670b598a19ec33084ae4cadbdcf89177f64`](https://github.com/learningeconomy/LearnCard/commit/3922c670b598a19ec33084ae4cadbdcf89177f64)]:
    -   @learncard/simple-signing-service@1.0.19

## 1.0.18

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.18

## 1.0.17

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.17

## 1.0.16

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.16

## 1.0.15

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.15

## 1.0.14

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.14

## 1.0.13

### Patch Changes

-   Updated dependencies [[`1ed5313935264890917c6ddf19249ada91d1e524`](https://github.com/learningeconomy/LearnCard/commit/1ed5313935264890917c6ddf19249ada91d1e524)]:
    -   @learncard/simple-signing-service@1.0.13

## 1.0.12

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.12

## 1.0.11

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.11

## 1.0.10

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.10

## 1.0.9

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.9

## 1.0.8

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.8

## 1.0.7

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.7

## 1.0.6

### Patch Changes

-   [`cbc84cc27d1eaf8b6830f06d86d354cb78d8d548`](https://github.com/learningeconomy/LearnCard/commit/cbc84cc27d1eaf8b6830f06d86d354cb78d8d548) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Remove NX caching in CI to ensure latest builds

-   Updated dependencies [[`cbc84cc27d1eaf8b6830f06d86d354cb78d8d548`](https://github.com/learningeconomy/LearnCard/commit/cbc84cc27d1eaf8b6830f06d86d354cb78d8d548)]:
    -   @learncard/simple-signing-service@1.0.6

## 1.0.5

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.5

## 1.0.4

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.4

## 1.0.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.3

## 1.0.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.2

## 1.0.1

### Patch Changes

-   Updated dependencies []:
    -   @learncard/simple-signing-service@1.0.1
