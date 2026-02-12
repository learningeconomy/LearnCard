# Bundle Size Audit & Reduction Plan — learn-card-app

**Date:** 2026-02-12  
**Status:** Proposed

The `learn-card-app` is a large Ionic/React/Vite application with **108 runtime dependencies** and **1,300+ source files**. The build currently requires `--max-old-space-size=16608` (16 GB!). This document is an audit of the major bundle size problems and a phased plan to address them.

---

## Audit Summary

### 🔴 Critical Issues (Highest Impact)

| Problem | Est. Savings | Details |
|---------|-------------|---------|
| No `manualChunks` in Vite config | — | Everything merges into a few giant chunks. No vendor splitting at all. |
| `moment` + `moment-timezone` (47+ files) | ~300-500 KB | Ships all locales. Replace with `dayjs` (~7 KB) or `date-fns` (tree-shakeable). |
| `lodash` full bundle (20+ files) | ~70-100 KB | `import _ from 'lodash'` and `import { fn } from 'lodash'` both pull the entire library. Switch to `lodash-es` (tree-shakeable) or per-function imports (`lodash/cloneDeep`). |
| 18 eagerly-imported pages in `Routes.tsx` | ~200-400 KB | These are loaded on every page load regardless of route. |

### 🟡 Moderate Issues

| Problem | Est. Savings | Details |
|---------|-------------|---------|
| `firebase` + `@capacitor-firebase` | ~100-200 KB | Used in 5 files. Ensure only used sub-packages are imported (e.g. `firebase/auth` not `firebase`). |
| `@web3auth/*` (5 packages!) | ~100-200 KB | Only used in 2 files (`useFirebase.ts`, `AppRouter.tsx`). Should be dynamically imported. |
| `@ionic/core` + `@ionic/react` | ~200+ KB | Framework dependency, can't remove, but ensure `@ionic/core` isn't separately bundled. |
| `@sentry/browser` + `@sentry/react` (both!) | ~50-100 KB | Two Sentry packages — consolidate to just `@sentry/react`. Use lazy loading for feedback widget. |
| `launchdarkly-react-client-sdk` | ~50-80 KB | Used in 28 files. Can't easily reduce, but can be split into its own chunk. |

### 🟢 Low-Hanging Fruit (Easy Wins)

| Problem | Est. Savings | Details |
|---------|-------------|---------|
| `jspdf` + `html2canvas` | ~200+ KB | Used in **1 file** (`QrCodeDownloadOptions.tsx`). Dynamic `import()` at point of use. |
| `jszip` | ~50 KB | Used in **2 files** (admin bulk-import only). Dynamic `import()`. |
| `@xterm/*` (3 packages) | ~200+ KB | Used in **1 file** (`DevCli.tsx`). Already lazy-loaded at route level ✓ but should be in its own chunk. |
| `katex` + `rehype-katex` + `remark-math` | ~300+ KB | Used in **1 file** (`MarkdownRenderer.tsx`). Dynamic import. |
| `react-shiki` | ~100+ KB | Used in **1 file** (same `MarkdownRenderer.tsx`). Dynamic import. |
| `pdf-lib` | ~400+ KB | Used in **0 files** in app src (only in `package.json`!). **Remove entirely**. |
| `emoji-picker-react` | ~200+ KB | Used in 5 files (family CMS only). Already behind lazy route, but ensure chunk isolation. |
| `react-lottie-player` | ~50 KB | 16 files — too widespread to dynamic-import, but should get its own vendor chunk. |

---

## Eagerly Imported Pages in Routes.tsx

These pages are statically imported and bundled into the main chunk, even though most users never visit them on any given session:

| Component | File |
|-----------|------|
| `LaunchPad` | `./pages/launchPad/LaunchPad` |
| `LoginPage` | `./pages/login/LoginPage` |
| `AchievementsPage` | `./pages/achievements/AchievementsPage` |
| `IdsPage` | `./pages/ids/IdsPage` |
| `LearningHistoryPage` | `./pages/learninghistory/LearningHistoryPage` |
| `WorkHistoryPage` | `./pages/workhistory/WorkHistoryPage` |
| `SocialBadgesPage` | `./pages/socialBadgesPage/SocialBadgesPage` |
| `AccomplishmentsPage` | `./pages/accomplishments/AccomplishmentsPage` |
| `AccommodationsPage` | `./pages/accommodations/AccommodationsPage` |
| `AdminToolsPage` | `./pages/adminToolsPage/AdminToolsPage` |
| `ViewAllManagedBoostsPage` | `./pages/adminToolsPage/ViewAllManagedBoostsPage` |
| `BulkBoostImportPage` | `./pages/adminToolsPage/bulk-import/BulkBoostImportPage` |
| `ManageServiceProfilesPage` | `./pages/adminToolsPage/ManageServiceProfilePage` |
| `ManageConsentFlowContractsPage` | `./pages/adminToolsPage/ManageConsentFlowContractsPage` |
| `SigningAuthoritiesPage` | `./pages/adminToolsPage/SigningAuthoritiesPage` |
| `APITokensPage` | `./pages/adminToolsPage/api-tokens/APITokensPage` |
| `AiSessionTopicsContainer` | `./components/ai-sessions/AiSessionTopicsContainer` |
| `AiSessionsContainer` | `./components/ai-sessions/AiSessionsContainer` |

> **Note:** `LoginPage` is hit on first visit by logged-out users, so lazifying it adds a small loading spinner. `LaunchPad` is the landing page for logged-in users. Both are acceptable to lazify — the existing `<Suspense fallback={<LoadingPageDumb />}>` wrapper handles the transition.

---

## Proposed Changes

### Phase 1: Vite Configuration — Chunk Splitting

**File:** `vite.config.ts`

Add `rollupOptions.output.manualChunks` to split vendor dependencies into separate cacheable chunks:

```typescript
build: {
    target: 'esnext',
    outDir: path.join(__dirname, 'build'),
    rollupOptions: {
        output: {
            manualChunks: {
                // Core framework
                'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom'],
                'vendor-ionic': ['@ionic/react', '@ionic/react-router', '@ionic/core'],
                // Heavy deps in their own chunks
                'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics'],
                'vendor-sentry': ['@sentry/react', '@sentry/browser'],
                'vendor-launchdarkly': ['launchdarkly-react-client-sdk'],
                'vendor-web3auth': [
                    '@web3auth/no-modal', '@web3auth/base',
                    '@web3auth/auth-adapter', '@web3auth/ethereum-provider',
                    '@web3auth/single-factor-auth'
                ],
                'vendor-swiper': ['swiper'],
                'vendor-lottie': ['react-lottie-player'],
                'vendor-tanstack': ['@tanstack/react-query'],
            },
        },
    },
},
```

**Why:** Even though this doesn't reduce total download size, it dramatically improves caching (vendor chunks rarely change) and initial load time (only needed chunks are loaded).

---

### Phase 2: Lazy-Load Eagerly Imported Pages

**File:** `src/Routes.tsx`

Convert all 18 static `import` statements to use `lazyWithRetry(() => import(...))`. Example:

```diff
-import LaunchPad from './pages/launchPad/LaunchPad';
+const LaunchPad = lazyWithRetry(() => import('./pages/launchPad/LaunchPad'));

-import AdminToolsPage from './pages/adminToolsPage/AdminToolsPage';
+const AdminToolsPage = lazyWithRetry(() => import('./pages/adminToolsPage/AdminToolsPage'));
```

**Risk:** Low — the app already uses `<Suspense>` with a loading fallback throughout.

---

### Phase 3: Replace `lodash` with Tree-Shakeable Alternative

**Files:** ~20 source files

**Recommended approach:** Replace `lodash` with `lodash-es` in `package.json`. Named imports like `import { cloneDeep } from 'lodash-es'` will be tree-shaken by Vite automatically.

Files using `import _ from 'lodash'` (full namespace) need to be refactored to named imports:
- `LoginLoader.tsx` / `LogoutLoader.tsx`
- `LearnerInsights.tsx`
- `AdminToolsStorageOption.tsx` / `AdminToolsNetwork.tsx`
- `personalizedQuestionCredential.helpers.ts`
- `FamilyPinWrapper.tsx`

Functions actually used: `cloneDeep`, `capitalize`, `isEqual`, `isRegExp`, `debounce`, `get`, `set`, `isEmpty`, `uniqBy`, `sortBy`, `groupBy`.

---

### Phase 4: Replace `moment` with `dayjs`

**Files:** 47+ source files  
**Estimated savings:** ~300-500 KB

Replace `moment` / `moment-timezone` with `dayjs` + plugins (`timezone`, `utc`, `relativeTime`, `customParseFormat`). The API is largely compatible:

```diff
-import moment from 'moment';
+import dayjs from 'dayjs';

-moment(date).format('MMM D, YYYY')
+dayjs(date).format('MMM D, YYYY')

-moment(date).fromNow()
+dayjs(date).fromNow()  // requires relativeTime plugin
```

> ⚠️ **This is the highest-risk, highest-reward change.** Recommend doing it as a separate PR with thorough testing. Some `moment-timezone` usage may need the `dayjs` timezone plugin.

---

### Phase 5: Dynamic Import Heavy Dependencies

| File | Dependencies | Approach |
|------|-------------|----------|
| `QrCodeDownloadOptions.tsx` | `jspdf`, `html2canvas` | `const { jsPDF } = await import('jspdf')` inside handler |
| `AdminToolsBulkBoostImportOption.tsx` | `jszip` | `const JSZip = (await import('jszip')).default` inside handler |
| `BulkBoostImportPage.tsx` | `jszip` | Same as above |
| `MarkdownRenderer.tsx` | `katex`, `rehype-katex`, `remark-math`, `react-shiki` | Wrap in lazy-loaded component or dynamic import |
| `package.json` | `pdf-lib` | **Remove entirely** — not imported anywhere in source |

---

### Phase 6 (Optional): Consolidate Sentry Packages

**Files:** `package.json`, `index.tsx`, `SideMenu.tsx`

The app currently imports both `@sentry/browser` and `@sentry/react`. Consolidate to `@sentry/react` only (which includes browser functionality):

```diff
-import * as Sentry from '@sentry/browser';
+import * as Sentry from '@sentry/react';
```

---

## Priority Order

| Priority | Phase | Effort | Impact | Risk |
|----------|-------|--------|--------|------|
| 1 | Phase 1 — Vite manualChunks | Low | High | Low |
| 2 | Phase 2 — Lazy routes | Low | High | Low |
| 3 | Phase 5 — Dynamic imports | Low | Medium | Low |
| 4 | Phase 3 — lodash-es | Medium | Medium | Low |
| 5 | Phase 6 — Sentry consolidation | Low | Low | Low |
| 6 | Phase 4 — moment → dayjs | High | High | Medium |

---

## Verification

1. **Run baseline build** — capture current chunk sizes from Vite output
2. **Apply changes** — rebuild and compare
3. **Smoke test** — verify login, navigation, PDF export, bulk import, markdown rendering, DevCli
4. **Optional** — install `rollup-plugin-visualizer` for interactive treemap analysis
