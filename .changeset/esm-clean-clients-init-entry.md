---
'@learncard/lca-api-client': patch
'@learncard/simple-signing-client': patch
'@learncard/network-brain-client': patch
'@learncard/learn-cloud-client': patch
'@learncard/init': patch
---

fix(packaging): ship ESM-clean named exports from the tRPC client packages and route `@learncard/init`'s Node ESM entry at the real ESM bundle

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
