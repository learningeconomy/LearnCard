# SDK Build Strategy: Fixing the 19 MB Main Bundle

**Date:** 2026-02-12
**Context:** The learn-card-app ships a 19.3 MB `index.js` (5.5 MB gzip). Investigation reveals this is caused by cascading pre-bundling in the internal SDK packages, not by third-party dependencies.

---

## The Problem

Every `@learncard/*` plugin uses esbuild with `bundle: true`. This means each plugin's build **inlines all of its workspace dependencies** into a single fat file. When a higher-level package depends on a lower one, the entire dependency tree is re-bundled.

### The Cascade

```
Layer 1: Leaf plugins (e.g., @learncard/crypto-plugin)
  → Bundles: @learncard/core, @learncard/types
  → Result: 52 KB (small, fine)

Layer 2: Mid-level plugins (e.g., @learncard/didkey-plugin)
  → Bundles: @learncard/didkit-plugin + @learncard/core + @learncard/types
  → Result: 9.1 MB (re-bundles everything from Layer 1)

Layer 3: @learncard/init
  → Bundles: ALL 17 plugins + their transitive deps
  → Result: 8.4 MB ESM file

Layer 4: @learncard/lca-api-plugin
  → Bundles: @learncard/init + @learncard/lca-api-client + crypto utils
  → Result: 9.3 MB ESM file (contains a FULL COPY of Layer 3)
```

When Vite bundles the app, it imports both `@learncard/init` (8.4 MB) and `@learncard/lca-api-plugin` (9.3 MB). Since both are pre-bundled opaque blobs, **Vite cannot deduplicate shared code** between them. The same functions from `@learncard/core`, `@learncard/types`, `@learncard/didkit-plugin`, etc. ship twice.

### Plugin Dist Sizes (JS only)

| Plugin | Workspace Deps | Dist Size | Notes |
|--------|---------------|-----------|-------|
| `@learncard/crypto-plugin` | 1 | 52 KB | Leaf — small |
| `@learncard/did-web-plugin` | 2 | 52 KB | Leaf — small |
| `@learncard/didkit-plugin` | 2 | 41 KB JS + 9.3 MB WASM | JS is fine, WASM is separate |
| `@learncard/vc-plugin` | 3 | 252 KB | |
| `@learncard/vpqr-plugin` | 2 | 1.4 MB | |
| `@learncard/claimable-boosts-plugin` | 2 | 3.7 MB | Starting to re-bundle heavily |
| `@learncard/vc-api-plugin` | 2 | 4.2 MB | |
| `@learncard/simple-signing-plugin` | 1 | 4.4 MB | |
| `@learncard/learn-card-plugin` | 3 | 4.7 MB | |
| `@learncard/ethereum-plugin` | 1 | 8.1 MB | |
| `@learncard/didkey-plugin` | 3 | 9.1 MB | |
| `@learncard/learn-cloud-plugin` | 6 | 13 MB | |
| `@learncard/ceramic-plugin` | 3 | 18 MB | |
| `@learncard/network-plugin` | 7 | 20 MB | |
| `@learncard/idx-plugin` | 3 | 25 MB | |
| **`@learncard/init`** | **19** | **8.4 MB** | Contains all plugins |
| **`@learncard/lca-api-plugin`** | **5** | **9.3 MB** | Re-bundles `init` |

---

## Why It's Built This Way

The `bundle: true` approach was likely chosen for **simplicity and portability**: each published npm package is self-contained, requiring no peer dependency resolution. An `npm install @learncard/init` gives you one file that "just works."

This works fine for standalone usage (Node.js scripts, small apps using one or two plugins). But it **breaks down catastrophically in a monorepo or any app that uses multiple packages**, because:

1. **No deduplication** — shared code is physically duplicated in each bundle
2. **No tree-shaking** — unused exports can't be eliminated from a pre-bundled blob
3. **No `sideEffects: false`** — bundlers can't eliminate unused re-exports

---

## Proposed Approaches

### Option A: Externalize Workspace Deps (Recommended)

Change each plugin's `build.mjs` to externalize workspace dependencies instead of bundling them:

```javascript
// In build.mjs for each plugin:
const buildOptions = {
    target: 'es2020',
    sourcemap: true,
    external: [
        // Existing externals
        'isomorphic-fetch', 'isomorphic-webcrypto',
        // ADD: All workspace packages
        '@learncard/core',
        '@learncard/types',
        '@learncard/helpers',
        '@learncard/didkit-plugin',
        // ... etc
    ],
};
```

Alternatively, use the existing (but unused!) `nodeResolveExternal` plugin in `learn-card-init/scripts/build.mjs`, which already has the right logic — it just was never added to the plugins arrays:

```javascript
// learn-card-init already has this defined but doesn't use it:
const nodeResolveExternal = NodeResolvePlugin({
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.cjs', '.mjs'],
    onResolved: resolved => {
        if (resolved.includes('node_modules')) {
            return { external: true };
        }
        return resolved;
    },
});

// Fix: Actually add it to the configurations
plugins: [nodeResolveExternal], // currently: plugins: []
```

**Impact on npm consumers:**
- Users who install packages independently via npm would need to also install peer dependencies
- Change `dependencies` to `peerDependencies` in each plugin's `package.json`
- Add `peerDependenciesMeta` to mark them as optional where appropriate
- The `dist/*.esm.js` files would become tiny (just the plugin's own code), with import statements pointing to the peer deps

**Impact on the app:**
- Vite would resolve each `@learncard/*` import to its own small module
- Shared deps (core, types, didkit, etc.) would be resolved **once** and deduped automatically
- Expected savings: **~9-12 MB** (from ~19.3 MB to ~7-10 MB), since the duplicated SDK code would be eliminated
- Further gains from tree-shaking unused exports

**Risk:** Medium — requires testing that all published packages still work correctly when installed via npm. The monorepo app would work immediately since pnpm workspace handles resolution.

---

### Option B: Resolve From Source in the App (Monorepo-Only Fix)

Instead of changing how packages are built, tell Vite to resolve workspace packages directly from their TypeScript source instead of their pre-bundled `dist/` files:

```typescript
// vite.config.ts
resolve: {
    alias: {
        '@learncard/init': path.resolve(__dirname, '../../packages/learn-card-init/src/index.ts'),
        '@learncard/core': path.resolve(__dirname, '../../packages/learn-card-core/src/index.ts'),
        // ... etc for each workspace package
    },
},
```

**Pros:**
- No changes to the SDK build scripts
- Vite handles deduplication and tree-shaking at the source level
- Would immediately reduce the main chunk significantly

**Cons:**
- Only fixes the monorepo app, not external consumers
- Build times increase (Vite now compiles all plugin source from scratch)
- May hit TypeScript config issues (different tsconfig between packages)
- Fragile — must keep aliases in sync with monorepo structure

---

### Option C: Hybrid (Best of Both)

1. **Short term:** Use Option B (source aliases) in the app's `vite.config.ts` to immediately fix the bundle size
2. **Medium term:** Implement Option A (externalize workspace deps) across all plugins, then remove the aliases

This gives immediate relief while properly fixing the root cause over time.

---

## My Recommendation

**Option A (externalize workspace deps)** is the right long-term fix. Here's why:

1. **It fixes the problem everywhere** — not just this app, but any future app, the scouts app, and external npm consumers who use multiple packages
2. **It's how every major SDK monorepo works** — packages like `@tanstack/react-query`, `@sentry/react`, `@ionic/react` all externalize their own sub-packages and list them as peer deps
3. **The hard part is already done** — `learn-card-init` already has the `nodeResolveExternal` plugin written and ready, it just needs to be wired up
4. **The risk is manageable** — the monorepo's pnpm workspace resolves deps automatically, so the change is transparent there. For npm consumers, a major version bump with updated peer dep documentation would be appropriate.

### Implementation Order

1. Start with leaf plugins (crypto, did-web, dynamic-loader, etc.) — low risk, proves the approach
2. Move to mid-level plugins (didkey, vc, ethereum, etc.)
3. Update `learn-card-init` — the biggest single win
4. Update `lca-api-plugin` — eliminates the duplication
5. Add `"sideEffects": false` to all plugin `package.json` files for tree-shaking
6. Test: rebuild the app and verify bundle size reduction

### Expected Result

| Metric | Before | After (estimated) |
|--------|--------|-------------------|
| `index.js` | 19.3 MB | ~3-5 MB |
| `index.js` (gzip) | 5.5 MB | ~1-1.5 MB |
| Total vendor chunks | ~6 MB | ~6 MB (unchanged) |
| Build time | 3.5 min | Similar or slightly faster |

---

## Appendix: Files That Need Changes

Every plugin with a `scripts/build.mjs` file needs its `external` list updated. There are approximately **24 plugins** plus `learn-card-init` and `lca-api-plugin` (26 total build scripts).

The change per file is mechanical:
1. Add workspace package names to `external` array
2. Or: use the `nodeResolveExternal` plugin (mark all `node_modules` as external)
3. Move workspace deps from `dependencies` to `peerDependencies` in `package.json`
4. Add `"sideEffects": false` to `package.json`

Most plugins follow the exact same `build.mjs` template, making this a largely automated change.
