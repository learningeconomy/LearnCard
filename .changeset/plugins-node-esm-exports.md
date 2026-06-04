---
"@learncard/ceramic-plugin": patch
"@learncard/chapi-plugin": patch
"@learncard/crypto-plugin": patch
"@learncard/did-web-plugin": patch
"@learncard/didkey-plugin": patch
"@learncard/didkit-plugin": patch
"@learncard/dynamic-loader-plugin": patch
"@learncard/encryption-plugin": patch
"@learncard/expiration-plugin": patch
"@learncard/helpers": patch
"@learncard/idx-plugin": patch
"@learncard/lca-api-plugin": patch
"@learncard/learn-card-plugin": patch
"@learncard/network-plugin": patch
"@learncard/learn-cloud-plugin": patch
"@learncard/ler-rs-plugin": patch
"@learncard/linked-claims-plugin": patch
"@learncard/open-badge-v2-plugin": patch
"@learncard/openid4vc-plugin": patch
"@learncard/sd-jwt-vc-plugin": patch
"@learncard/types": patch
"@learncard/vc-api-plugin": patch
"@learncard/vc-templates-plugin": patch
"@learncard/vc-plugin": patch
"@learncard/vpqr-plugin": patch
---

Fix Node ESM consumers (e.g. `@learncard/init`'s published ESM bundle) being unable to resolve named exports from these plugins.

These packages previously declared only `main` (CJS shim) and `module` (ESM bundle) without an `exports` map. Node ESM does not honor the `module` field, so it fell back to the CJS shim — a conditional `module.exports = require(...)` re-export that `cjs-module-lexer` cannot statically analyze, causing `SyntaxError: Named export 'X' not found` for every downstream ESM consumer.

Each affected plugin now:
- declares `"type": "module"`,
- ships its CJS shim as `dist/index.cjs` (renamed from `.js`) and bundle outputs as `.cjs`,
- exposes a proper `exports` map with `import` → ESM bundle, `require` → CJS shim, and `types` → `.d.ts`.

No runtime behavior changes for existing consumers; bundlers that read `module` continue to work, and CJS `require()` callers continue to load the same shim under a new extension.

This change is verified by two new CI surfaces:

- `pnpm validate-packages` runs `publint` + `@arethetypeswrong/cli` against every published `@learncard/*` package's built `dist/`. Catches missing `exports` maps, dangling file paths, condition ordering bugs, ESM-file-as-CJS extension mistakes, and the `workspace:*` protocol-leakage incident class statically, before publish.
- `.github/workflows/smoketest-npm-packages.yml` now also probes every published plugin's ESM + CJS export surface directly (not just `@learncard/init` transitively) and bundles a trivial consumer with esbuild to catch bundler-resolution-only regressions.

Follow-up work tracked as advisory failures in both surfaces (not gating CI until fixed): `@learncard/ceramic-plugin`, `@learncard/didkey-plugin`, `@learncard/helpers`, `@learncard/idx-plugin`, `@learncard/lca-api-plugin`, `@learncard/learn-cloud-plugin`, `@learncard/network-plugin`, `@learncard/simple-signing-plugin` each have pre-existing publish-time bugs (CJS-only transitive deps imported via named ESM, dynamic `require()` in ESM bundles, or unmigrated upstream packages).
