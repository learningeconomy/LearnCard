# Bundle Size Optimization Summary

> Last updated: February 18, 2026
> Build tool: Vite 4.3 + esbuild/Rollup

This document summarizes two phases of bundle optimization applied to `learn-card-app`, along with the current verified state. See [SDK_BUILD_STRATEGY.md](./SDK_BUILD_STRATEGY.md) and [BUNDLE_SIZE_AUDIT.md](./BUNDLE_SIZE_AUDIT.md) for full implementation details.

---

## Overall Progress

| Phase | Main Chunk | Gzip | Notes |
|-------|-----------|------|-------|
| Before any optimization | ~19,300 KB | ~5,500 KB | Cascading SDK pre-bundling |
| After Phase 1 (SDK Build Strategy) | ~11,800 KB | ~3,500 KB | Eliminated duplicate workspace deps |
| After Phase 2 (Bundle Audit) | ~8,945 KB | ~2,324 KB | Lazy loading + asset optimization |
| **Current (verified Feb 18, 2026)** | **8,945 KB** | **2,324 KB** | Confirmed via fresh `pnpm build` |

Total savings to the main chunk: **~10,355 KB (−54%)** from the original 19.3 MB.

---

## The Root Problem

Every `@learncard/*` plugin was built with esbuild's `bundle: true`, which **inlined all workspace dependencies** into each plugin's dist file. This caused cascading duplication:

```
@learncard/crypto-plugin     →  52 KB   (leaf, fine)
@learncard/didkey-plugin     →  9.1 MB  (re-bundles crypto + core + types)
@learncard/init              →  8.4 MB  (bundles all 17 plugins)
@learncard/lca-api-plugin    →  9.3 MB  (re-bundles ALL of init again)
```

When Vite built the app, it imported both `@learncard/init` (8.4 MB) and `@learncard/lca-api-plugin` (9.3 MB). Since both were opaque pre-bundled blobs, Vite could not deduplicate the shared code between them — the same functions shipped twice. The result: a **19.3 MB main bundle**.

---

## Phase 1: SDK Build Strategy (−~7,500 KB)

**Document:** [SDK_BUILD_STRATEGY.md](./SDK_BUILD_STRATEGY.md)
**Date:** February 12, 2026

### What Was Done

Implemented **Option A** from the strategy doc: changed plugin `build.mjs` scripts to externalize workspace dependencies rather than bundling them in, then moved workspace deps from `dependencies` to `peerDependencies` in each plugin's `package.json`.

The key mechanism was wiring up the already-written (but unused) `nodeResolveExternal` plugin in `learn-card-init/scripts/build.mjs`, which marks all non-`node_modules` resolutions as external imports rather than inlining them:

```javascript
// Before: plugins: []
// After:  plugins: [nodeResolveExternal]
```

This was applied across all ~26 plugin `build.mjs` scripts in the repo.

### Result

With workspace deps externalized, Vite could resolve each `@learncard/*` import to its own small module and deduplicate shared code automatically. The duplicated 9.3 MB copy of the entire SDK inside `@learncard/lca-api-plugin` was eliminated.

**~19,300 KB → ~11,800 KB** (−~7,500 KB, −39%)

### Why Not More?

The strategy doc projected ~3–5 MB after this fix. The actual result of ~12 MB suggests that even after deduplication, the LearnCard SDK's own code (DIDKit, crypto primitives, VC logic) plus third-party dependencies (ethers, viem, zod, etc.) still constitute a large, eagerly-loaded payload. Phase 2 addressed this.

---

## Phase 2: Additional Optimizations (−~2,860 KB from main)

**Document:** [BUNDLE_SIZE_AUDIT.md](./BUNDLE_SIZE_AUDIT.md)
**Date:** February 13, 2026

After Phase 1, the remaining 11.8 MB main chunk was profiled with `ANALYZE=true pnpm build`. Several large, eagerly-loaded dependencies were identified and moved out of the critical path.

### Optimizations Applied

| Optimization | Main Chunk Savings | Total JS Savings | Technique |
|---|---|---|---|
| Shiki fine-grained import | ~3,000 KB | **−6,575 KB** | Replaced 100+ language grammars with 25 specific ones, loaded on-demand |
| Web3Auth dynamic import | **−4,579 KB** | −4,579 KB | Dynamic `import()` in `useWeb3Auth.ts` |
| Lottie WebP re-encoding | N/A (assets) | **−2,513 KB** | Re-encoded 39 PNGs as WebP; moved to `public/` |
| Katex dynamic import | **−710 KB** | −710 KB | `LazyMarkdownRenderer.tsx` with `React.lazy()` + `Suspense` |
| Ethereum/MetaMask lazy load | **−654 KB** | −654 KB | Dynamic `import()` in 4 `@learncard/init` initializer files |
| Emoji picker lazy load | **−947 KB** | −947 KB | `React.lazy()` on `FamilyEmojiPicker` |
| Lodash → lodash-es | ~tree-shaken | ~tree-shaken | Migrated 22 import sites to ESM for Rollup tree-shaking |
| Rimraf → `fs.rm` | N/A (build scripts) | N/A | Fixed incompatible rimraf versions in 31 build scripts |

**~11,800 KB → ~8,945 KB** (−~2,860 KB, −24%)

---

## Current State (Verified Feb 18, 2026)

Fresh build run: `NODE_OPTIONS="--max-old-space-size=16608" pnpm build`

### Initial (Eagerly Loaded) Chunks

| Chunk | Size | Gzip |
|-------|------|------|
| `index.js` (main bundle) | **8,945 KB** | **2,324 KB** |
| `vendor-ionic` | 817 KB | 177 KB |
| `vendor-react` | 169 KB | 55 KB |
| `vendor-firebase` | 237 KB | 47 KB |
| **Total initial JS** | **~10,168 KB** | **~2,603 KB** |

### Largest Lazy-Loaded Chunks

| Chunk | Size | Gzip | When Loaded |
|-------|------|------|-------------|
| `vendor-web3auth` | 4,579 KB | 1,250 KB | Web3/wallet features |
| `vendor-ionic` | 817 KB | 177 KB | UI framework |
| `DeveloperPortalRoutes` | 701 KB | 151 KB | Developer portal pages |
| `ethereum-plugin.esm` | 583 KB | 190 KB | LearnCard Ethereum init |
| `MarkdownRenderer` | 562 KB | 171 KB | AI chat code highlighting |
| `BrowseFrameworkPage` | 560 KB | 137 KB | Skill frameworks page |
| `cpp` (grammar) | 638 KB | 47 KB | Code block rendering |
| `wasm` (grammar) | 622 KB | 230 KB | Code block rendering |
| `DevCli` | 420 KB | 95 KB | Developer CLI |
| `jspdf` | 413 KB | 135 KB | PDF export |

### Main Chunk Composition

| Category | Approx. Size | % |
|---|---:|---|
| LearnCard SDK plugins | ~3,850 KB | 43% |
| App source code | ~2,000 KB | 21% |
| Third-party libs (ethers, viem, zod, etc.) | ~2,500 KB | 26% |
| Other | ~600 KB | 10% |

---

## Remaining Opportunities

| Optimization | Est. Savings | Effort | Notes |
|---|---|---|---|
| Lazy-load MetaMask/Ethereum stack | ~3,000 KB | Medium | Only needed for wallet connect features |
| Consolidate `ethers` + `viem` | ~700 KB | Medium | Two Ethereum libraries with overlapping scope |
| Lazy-load `filestack-js` | ~480 KB | Medium | ~50 import sites need updating |
| Remove `@emoji-mart/data` | ~549 KB | Low | May be already tree-shaken given emoji picker is lazy |
| LearnCard SDK plugin lazy-loading | ~4,000+ KB | High | Architectural: load plugins on-demand per feature |
| Move crypto/DID ops server-side | Significant | Very High | Would eliminate most of the remaining SDK weight |

---

## How to Regenerate Bundle Analysis

```bash
# From apps/learn-card-app
ANALYZE=true pnpm build
# Opens build/stats.html — interactive treemap of all chunks
```
