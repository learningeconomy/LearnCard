# LearnCard App — Bundle Size Audit & Optimization

> Last updated: February 13, 2025  
> Build tool: Vite 4.3 + esbuild/Rollup

## Summary

We reduced the **initial JS payload** from **~12 MB → ~9.6 MB** and eliminated **~10 MB of total JS** from the build through a combination of lazy loading, asset optimization, and dependency cleanup.

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Main chunk (`index.js`) | 11,806 KB | 8,945 KB | **−2,861 KB (−24.2%)** |
| Total initial JS (main + vendor-react + vendor-ionic + vendor-firebase) | ~12,228 KB | ~10,168 KB | **−2,060 KB** |
| Largest lazy chunk (web3auth) | 4,579 KB | 4,579 KB | *(already lazy)* |
| Lottie JSON assets | 2,959 KB (bundled) | 446 KB (static) | **−2,513 KB (−84.9%)** |
| Shiki language grammars | 7,675 KB (100+ langs) | ~1,100 KB (25 langs, lazy) | **−6,575 KB (−85.7%)** |
| Ethereum/MetaMask stack | bundled in main | 583 KB (lazy) | **−654 KB from main** |

---

## Optimizations Applied

### 1. Shiki Fine-Grained Bundle (−6,575 KB)

**Problem:** `react-shiki` imports the full `shiki` bundle, which includes 100+ programming language grammars (7.7 MB). We only use syntax highlighting in the AI chat feature.

**Fix:** Replaced `react-shiki` with a custom `CodeHighlighter.tsx` using `shiki/core` that only imports ~25 languages we actually need, loaded on-demand via dynamic `import()`.

**Result:** Eliminated ~80 unused language grammar chunks (emacs-lisp 780 KB, wolfram 262 KB, vue-vine 190 KB, angular-ts 184 KB, etc.). Remaining language grammars are lazy-loaded individual chunks of 10-180 KB each.

### 2. Lottie WebP Re-encoding (−2,513 KB)

**Problem:** 6 Lottie JSON files contained 39 embedded base64 PNG images (98-99% of each file's size). They were statically imported, inlining 2,959 KB of JSON into the main JS bundle.

**Fix:** Re-encoded all 39 PNGs as WebP (quality 80) using `sharp`. Moved files from `src/assets/lotties/` → `public/lotties/` and updated 16 components to use the `path` prop (fetched on-demand via network request).

| File | Before | After |
|------|--------|-------|
| cuteopulpo.json | 776 KB | 80 KB |
| purpghost.json | 515 KB | 102 KB |
| factory.json | 487 KB | 75 KB |
| lizardflame.json | 461 KB | 87 KB |
| reaperghost.json | 403 KB | 50 KB |
| hourglass.json | 317 KB | 52 KB |

### 3. Katex Dynamic Import (−710 KB)

**Problem:** `katex` (~4 MB with CSS, fonts etc.) was eagerly loaded in the main bundle, used only in the AI chat markdown renderer.

**Fix:** Created `LazyMarkdownRenderer.tsx` using `React.lazy()` + `Suspense` to code-split katex, rehype-katex, remark-math, and the code highlighter into a lazy chunk.

### 4. Lodash → lodash-es (tree-shaking enabled)

**Problem:** `lodash` (547 KB, CommonJS) cannot be tree-shaken by Vite/Rollup, so the entire library was bundled even though only `cloneDeep`, `capitalize`, `isEqual`, and `omit` are used.

**Fix:** Migrated all 22 import sites from `lodash` to `lodash-es` (ESM), enabling Vite to tree-shake unused functions.

### 5. Emoji Picker Lazy Loading

**Problem:** `emoji-picker-react` (398 KB) + `@emoji-mart/data` (549 KB) were eagerly loaded but used only in the Family CMS emoji picker modal.

**Fix:** Lazy-loaded `FamilyEmojiPicker` component with `React.lazy()`.

### 6. Ethereum/MetaMask Lazy Loading (−654 KB from main)

**Problem:** `@learncard/ethereum-plugin` (and its transitive deps: `ethers`, `viem`, `@metamask/sdk`, `@metamask/delegation-abis`, `@noble/curves`) was statically imported in all 4 `learn-card-init` initializer files, bundling ~3 MB of Ethereum stack into the main chunk.

**Fix:** Converted static `import { getEthereumPlugin }` to dynamic `const { getEthereumPlugin } = await import('@learncard/ethereum-plugin')` in all 4 initializer files. Since the functions are already `async`, this is a drop-in change with zero API impact.

**Result:** New lazy chunk `ethereum-plugin.esm.js` (583 KB). `index.js` reduced by 654 KB.

### 7. Web3Auth Dynamic Import

**Problem:** `@web3auth/*` packages (4,579 KB) were eagerly loaded in the main bundle.

**Fix:** Dynamic import in `useWeb3Auth.ts` — now a separate lazy chunk.

### 8. Rimraf → `fs.rm` Migration

**Problem:** `rimraf@3` and `rimraf@6` coexisted in the lockfile, causing build failures due to incompatible APIs.

**Fix:** Replaced `rimraf` with Node.js native `fs.rm(path, { recursive: true, force: true })` in all 31 build scripts.

---

## Current Bundle Composition

### Main Chunk (index.js): 8,945 KB

| Category | KB | % |
|----------|---:|--:|
| LearnCard SDK plugins | ~3,850 | 43% |
| App source code | ~2,000 | 21% |
| node_modules (ethers, viem, zod, etc.) | ~2,500 | 26% |
| Other | ~600 | 6% |

### Lazy-Loaded Chunks

| Chunk | KB | Trigger |
|-------|---:|---------|
| vendor-web3auth | 4,579 | Wallet/Web3 features |
| vendor-ionic | 817 | UI framework (needed per page) |
| DeveloperPortalRoutes | 701 | Developer portal pages |
| ethereum-plugin.esm | 583 | LearnCard init (Ethereum features) |
| MarkdownRenderer | 562 | AI chat code highlighting |
| DeveloperPortalRoutes | 701 | Developer portal pages |
| BrowseFrameworkPage | 560 | Skill frameworks page |
| cpp grammar (largest lang) | 638 | Code block rendering |
| DevCli | 420 | Developer CLI tools |
| jspdf | 413 | PDF generation |
| vendor-lottie | 322 | Animation rendering |
| vendor-firebase | 237 | Firebase auth/analytics |
| html2canvas | 201 | Screenshot capture |

---

## Remaining Opportunities

| Optimization | Est. Savings | Effort |
|-------------|-------------|--------|
| Lazy-load `filestack-js` | ~480 KB | Med — 50+ files |
| Consolidate `ethers` + `viem` | ~700 KB | Med — two Ethereum libraries doing similar work |
| Lazy-load MetaMask/Ethereum stack | ~3,000 KB | Med — only needed for wallet features |
| Remove `@emoji-mart/data` | ~549 KB | Low — may already be tree-shaken if emoji picker is lazy |
| LearnCard SDK plugin lazy-loading | ~4,000+ KB | High — architectural change to load plugins on-demand |
| Server-side credential operations | Significant | Very High — move crypto/DID ops to API |
