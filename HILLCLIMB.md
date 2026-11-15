# LCA cold-start hillclimb (LC-2415)

Branch `perf/lca-startup-hillclimb` = #2048 (`anvil/lca-coldstart-did` @ 5ab8f946a) + merge of #2047
(`perf/lca-coldstart-ld-registry` @ 747e2501e). Same app tree as Roadie's local bench merge 52c8b0afd
(the only difference is #2048's Scouts commit; `apps/learn-card-app` is byte-identical).

Each attempt is one commit. Roadie benches it on the FrenchFry emulator (AVD lca-bench-pixel8, debugmarks
APK, n=20 per scenario, interleaved). Numbers are device-clock ms from the tap (T0), p50/p90.

## Baseline (merged 52c8b0afd, runs/20261115T000127-merged)

| metric                      |          full |       LTE |          UMTS |
| --------------------------- | ------------: | --------: | ------------: |
| startup:react               |     1579/1623 | 1602/1628 |     1583/1625 |
| auth:coordinator_ready      |     2219/2272 | 2239/2263 |     2229/2272 |
| auth:wallet_ready           |     2220/2273 | 2242/2266 |     2231/2273 |
| **dashboard**               | **2284/2360** | 2299/2457 | **2305/2427** |
| Δ react → coordinator_ready |       631/659 |   638/654 |       638/647 |
| Δ coordinator → wallet      |           1/3 |       1/4 |           1/3 |

Phase split inside react → coordinator_ready (full, p50 over 20 runs, from the WebView marks/paints in
`collect.json`; network-independent, the same on UMTS):

| span                                              |      ms | what runs                                                                                                                                                                 |
| ------------------------------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| react → first paint (LoadingPage)                 |    ~291 | lazy `FullApp` chunk graph (55 chunks, 7.2 MB) fetch/compile/eval + first render                                                                                          |
| first paint → auth transition #1 (`deriving_key`) |    ~210 | FullApp's first-commit effects; `sqliteInit` opens native SQLite (3 bridge calls + open + 8 schema `execute`s + close), then `getCachedPrivateKey` (open + query + close) |
| transition #1 → #2 (`ready`)                      | ~40–110 | re-render on `deriving_key`, JS did:key, no-op `getCurrentUser`                                                                                                           |
| transition #2 → coordinator_ready mark            | ~20–100 | commit of the `ready` tree; the mark fires from an effect                                                                                                                 |

Bundle (production build, this branch): the entry static closure is 15.85 MB (`index` 14.0 MB + vendors).
Roughly, by sourcemap share of `index`: paraglide messages 16%, openid4vc 14%, render-method 9%,
brain-client 9%, sss-key-manager 5%, filestack-js 5%, learn-cloud 5%, init 5%, helpers 5%,
learn-card-network plugin 4%, ethereum 4%, lca-api-plugin 3%. Most of the wallet stack sits in the entry via
the `learn-card-base` barrel. `FullApp` adds 7.2 MB more (`useOpenNotifications` 2.9 MB,
`AuthCoordinatorProvider` 1.4 MB, `Routes` 1.25 MB).

## Hypotheses (ranked by expected gain × confidence ÷ risk)

| #   | hypothesis                                                                                                     | target                         | expected                               | risk                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------- |
| H1  | Start native SQLite init at entry instead of after FullApp's first commit                                      | first paint → transition #1    | −50 to −150 ms react→coordinator_ready | low                                                                              |
| H2  | `modulepreload` FullApp's static chunk closure from index.html so fetch+compile overlaps the 921 ms entry load | react → first paint            | −50 to −200 ms                         | low–med (contention could slow entry; WebView off-thread compile not guaranteed) |
| H3  | Batch the 8 `CREATE TABLE IF NOT EXISTS` into one `execute`, and reuse the open connection for the key query   | SQLite chain                   | −20 to −60 ms (less once H1 lands)     | low                                                                              |
| H4  | Load only the active locale's paraglide messages at startup (~16% of `index`)                                  | nav → entry                    | −80 to −150 ms                         | med (i18n switching must lazy-load)                                              |
| H5  | Move upload/screenshot-only deps out of the entry (filestack-js 5%, html2canvas 1%) behind dynamic imports     | nav → entry                    | −30 to −60 ms                          | low–med                                                                          |
| H6  | Lazy-load wallet plugins not needed for the first wallet (openid4vc 14%, render-method 9%)                     | nav → entry                    | −100 to −200 ms                        | med–high (wallet plugin composition)                                             |
| H7  | Dedupe the two startup `connectivity.txt` probes (~150 ms apart)                                               | main-thread/network contention | small                                  | low                                                                              |
| H8  | Cut the extra full-tree render on `deriving_key` (`ready` usually follows within ~50 ms)                       | transition #1 → #2             | −30 to −60 ms                          | **risky: changes visible auth states → separate commit for Taylor**              |
| H9  | Render the shell before walletReady                                                                            | dashboard                      | large                                  | **risky → separate commit for Taylor only**                                      |

## Attempts

### 1. H1: native SQLite init at entry

- **Change:** `startNativeSQLiteInit()` in `learn-card-base/hooks/useSQLiteStorage` (shared promise; publishes the
  handle + `markSQLiteReady` once per attempt; a failed attempt is cleared so `sqliteInit()` retries). It's called from
  `index.tsx` right after `prewarmDidKit()`. `useSQLite` → `createSQLiteDriver()` (same driver, no React) so it can
  run before mount. No-op on web. Key validation, identity filters and the cached-key query are unchanged.
- **Expected:** shorter first paint → transition #1. The connection + schema pass should already be done
  when `getCachedPrivateKey` runs, leaving open + query + close. react→coordinator_ready −50 to −150 ms; dashboard
  moves by the same amount. No effect on web or on nav→entry.
- **Commit:** 95ba11046
- **Numbers (measured, Roadie, n=10, vs same-session control 52c8b0afd n=10, Mann-Whitney p):**
  runs `20261115T004743-hc-95ba11046-n10-full-umts` (H1) and `20261115T005312-hc-52c8b0afd-n10-full-umts` (control).
  An emulator restart shifted absolute numbers by +20 to +50 ms, hence the same-session control.

    | metric            | full control |   full H1 | Δp50 (p)         | UMTS control |   UMTS H1 | Δp50 (p)     |
    | ----------------- | -----------: | --------: | ---------------- | -----------: | --------: | ------------ |
    | dashboard         |    2338/2552 | 2272/2426 | −66 (0.15, n.s.) |    2310/2462 | 2150/2370 | −160 (0.008) |
    | react             |    1616/1745 | 1611/1680 | −6 (n.s.)        |    1608/1679 | 1603/1632 | −4 (n.s.)    |
    | coordinator_ready |    2250/2366 | 2092/2171 | −158 (2e-4)      |    2251/2340 | 2074/2123 | −177 (2e-4)  |
    | walletReady       |    2255/2367 | 2094/2173 | −161 (2e-4)      |    2252/2343 | 2077/2124 | −175 (2e-4)  |

    react → coordinator_ready p50: 631 → 492 ms (full), 638 → 476 ms (UMTS). Bundle load and pre-react phases flat.
    Open question: walletReady → dashboard on full went 45 → 174 ms p50 (p90 322). A ~250–320 ms slow mode hit 5/10 H1
    full runs vs 3/20 baseline. Guess: n=10 noise; alternative: the coordinator now finishes before something the
    dashboard waits on, so part of the win moves downstream. Next stacked bench on full checks it.
    Stalls 0/10 both scenarios.

- **Kept/reverted:** **kept.** Dashboard p50 −66 (full) and −160 (UMTS), both ≥ 50 ms; p90 improved in both
  (2552 → 2426, 2462 → 2370). The full-network dashboard gain is not significant at n=10.

### 2. H5: lazy-load filestack-js and html2canvas

- **Change:** filestack-js loads on the first Filestack upload (once per provider; a failed load resets); html2canvas
  loads on the first feedback screenshot, inside the existing screenshot deadline.
- **Commit:** 58ae71d62 (cherry-pick of d5f680528)
- **Size (measured, same build script):** entry 14,568,621 → 13,767,369 B (−801,252 B raw, −182 KB gzip). Total JS
  −17 KB: the code moved out of the entry, it was not removed.
- **Numbers (measured, Roadie A/B vs H1 95ba11046, alternating blocks of 5, full n=20, UMTS n=10):**
  run `20261115T011745-ab-95ba11046-vs-58ae71d62` (ab-report.md).

    | metric            |   full H1 |  full +H5 | Δp50 (p)   |   UMTS H1 |  UMTS +H5 | Δp50 (p)                    |
    | ----------------- | --------: | --------: | ---------- | --------: | --------: | --------------------------- |
    | dashboard         | 2354/2493 | 2270/2419 | −84 (0.07) | 2356/2472 | 2117/2364 | −239 (0.007, slow-mode mix) |
    | react             | 1631/1670 | 1574/1608 | −56 (2e-5) | 1644/1693 | 1566/1607 | −78 (0.002)                 |
    | coordinator_ready | 2134/2188 | 2082/2117 | −52 (7e-5) | 2160/2187 | 2041/2075 | −120 (0.001)                |
    | walletReady       | 2137/2191 | 2084/2118 | −53 (5e-5) | 2163/2188 | 2042/2077 | −122 (0.001)                |

    nav → entry: −58 ms full (p=6e-8), −55 ms UMTS; every candidate block beat every control block. Other phases flat.

- **Kept/reverted:** **kept.** Dashboard p50 ≥ 50 ms better on both; p90 better on both.

### Dashboard slow mode (open)

walletReady → dashboard is bimodal: ~45–60 ms or ~240–290 ms. Builds before H1: 11/60 runs slow; with H1: 44/80
(Fisher p=1e-5, measured). Inferred: once coordinator_ready lands earlier, the dashboard often waits ~200 ms on some
other async dependency, so part of H1's gain moves downstream. From here, iterations are judged on
coordinator_ready / walletReady p50 plus the slow-mode count; dashboard p50 at n≤20 is session-sensitive.

### 3. H3: one native execute for the startup schema, reuse the connection for the key read

- **Commit:** 558fb66c1 (cherry-pick of 24a6b0346)
- **Numbers (measured, Roadie A/B vs 58ae71d62, full n=20, UMTS n=10 vs 9; one stalled UMTS run excluded, cause unrelated, see below):**
  run `20261115T014841-ab-58ae71d62-vs-558fb66c1` (ab-report.md, ab-report-nostall.md).

    | metric             | full ctrl |   full H3 | Δp50 (p)    | UMTS ctrl |   UMTS H3 | Δp50 (p)                   |
    | ------------------ | --------: | --------: | ----------- | --------: | --------: | -------------------------- |
    | auth transition #1 | 1924/1967 | 1888/1931 | −35 (0.006) | 1917/1946 | 1857/1917 | −61 (0.007)                |
    | coordinator_ready  | 2056/2105 | 2004/2059 | −52 (5e-4)  | 2048/2095 | 1976/2041 | −72 (0.014)                |
    | walletReady        | 2061/2106 | 2005/2062 | −56 (5e-4)  | 2050/2100 | 1978/2042 | −71 (0.014)                |
    | dashboard          | 2216/2361 | 2107/2329 | −108 (0.09) | 2107/2375 | 2235/2287 | +128 (0.46, slow-mode mix) |

    FCP → transition #1: 54 → 6 ms (full), 60 → 3 ms (UMTS). Native bridge calls through the first query 14 → 5
    (logcat). Slow mode: no shift (pooled p=0.44).

- **Kept/reverted:** **kept** on coordinator_ready/walletReady (the agreed metric since run #2); no p90 regression there.

### Found along the way (not hillclimb changes)

- **Blocking font import:** `apps/learn-card-app/src/index.scss` `@import`s
  `https://tetunori.github.io/fluent-emoji-webfont/dist/FluentEmojiFlat.css`. One UMTS run waited 30,042 ms on it
  (p50 13 ms over 163 runs). Rare, but it can freeze startup on a bad network. Candidate H10: self-host or load
  non-blocking.
- **Debug build logs SQLite results, including the stored privateKey, to the console (logcat).** Roadie redacted saved
  logs. Being traced; needs gating regardless of perf.
- **~8 identical `SELECT DISTINCT privateKey FROM users`** in one startup burst (control). Candidate: dedupe.

### 4. dashfix: mount Routes without the root Suspense round trip

- **Commits:** 7628a84f0 (debug-only `learncard:startup:dash_*` marks, no behavior change), 3eb1f99c6 (fix).
- **Cause (measured, control 7628a84f0, full, 10 slow vs 10 fast):** the root fallback stays up 203 ms in slow runs vs
  32 ms in fast (tracks walletReady → dashboard, r=0.95). The Routes module is ready ~60 ms after walletReady but Routes
  renders at ~224 ms in slow runs (inferred: the delayed Suspense retry).
- **Numbers (measured, Roadie A/B vs 7628a84f0, full n=20, UMTS n=10):** run `20261115T021911-ab-7628a84f0-vs-3eb1f99c6`.
    - Slow mode: full 10/20 → 0/20 (p=4e-4); UMTS 4/10 → 0/10 (p=0.09). root_fallback_shown fires 0/30 (control 30/30).
    - walletReady → URL flip p50/p90: full 178/281 → 37/72 (p=1e-6); UMTS 111/283 → 37/78 (p=9e-4).
    - `dashboard` (URL flip) from tap: full 2242/2329 → 2058/2265 (−184, p=0.003); UMTS 2191 → 2024 (−167, n.s.).
    - Real render, dash_dashboard_commit from tap: full 2334 → 2252 (−81, p=0.02); from walletReady full −52 (p=2e-4),
      UMTS −8 (n.s.).
    - coordinator_ready / walletReady / react: flat (n.s.), as expected.
- **Kept/reverted:** **kept.** Removes the slow mode; real render gain −52 ms on full.
- **Metric change:** the bench `dashboard` metric is the URL flip, not DashboardPage's render. From here Roadie leads
  with dash_dashboard_commit.
- **Next target (measured):** the Routes Suspense fallback is up in 30/30 runs, ~30 → ~245 ms after walletReady,
  waiting on whatever DashboardPage suspends on (inferred: its lazy chunk or a data read). ~210 ms.
- Stalls: 1/10 UMTS per build, both the FluentEmojiFlat.css @import (22.9 s, 30.1 s). H10 is next.

### 5. H10: bundle the Fluent Emoji font CSS and load it after first render

- **Commit:** b621bb588 (cherry-pick of 1bdd594a4). CSS is MIT (tetunori/fluent-emoji-webfont); font files still load
  from that host on demand.
- **Forced hang (measured, Roadie, SNI blackhole proxy on the font host, 3 cold launches each, no warm-ups):** control
  froze ~30 s on all 3 (FCP 31,477 / 34,939 / 31,590 ms); candidate FCP 1,877 / 1,924 / 1,841 ms and made no request
  to that host before the dashboard. Run `20261115T033244-hang2-3eb1f99c6-vs-b621bb588`.
- **Why it matters (inferred from Roadie's fetch log):** the CSS has max-age=600, so any cold start >10 min after the
  last one hits the network. 15 of 585 fetches tonight went to the network; the 3 that landed on UMTS runs are exactly
  the 3 natural stalls.
- **No-hang A/B (measured, full n=20, UMTS n=10, 0 stalls):** dash_dashboard_commit −43 full (p=0.24), −110 UMTS
  (p=0.36); full coordinator_ready −27 (p=0.042) but that gain sits in webview_nav_start, before any JS/CSS, so read as
  session noise. Neutral. Run `20261115T025701-ab-3eb1f99c6-vs-b621bb588`.
- Emoji render as Fluent glyphs on /skills (screenshots: `~/roadie-scratch/lca-bench/clips/emoji/`).
- **Kept/reverted:** **kept** as a correctness/robustness fix: it removes a 30 s startup freeze, neutral otherwise.

### 6. dashpage: skill-profile wizard off the dashboard's cold path; direct DashboardPage mount

- **Commits:** fd832f7e5 (lazy SkillProfileModal, warmed 3 s after mount), 74b0703b3 (direct mount + dash_page_* marks).
- **Size (measured, built assets):** dashboard chunk graph beyond entry + FullApp 1,032,951 → 352,444 B; the 620 KB
  SelectFrameworkToManageModal / emoji-mart chunk is off the cold path.
- **Numbers (measured, Roadie A/B vs b621bb588, full n=20, UMTS n=10, 0 stalls):** run
  `20261115T035353-ab-b621bb588-vs-74b0703b3`.

    | metric                | full ctrl | full cand | Δp50 (p)   | UMTS ctrl | UMTS cand | Δp50 (p)     |
    | --------------------- | --------: | --------: | ---------- | --------: | --------: | ------------ |
    | dash_dashboard_commit | 2111/2238 | 2057/2260 | −55 (0.12) | 2176/2282 | 2039/2197 | −138 (0.049) |
    | coordinator_ready     | 1989/2032 | 1971/2039 | −18 (0.40) | 1972/2021 | 1963/1997 | −8 (0.36)    |
    | walletReady           | 1993/2032 | 1973/2040 | −20 (0.40) | 1973/2023 | 1964/1998 | −9 (0.33)    |

    Page chunk loads 72–105 ms; dash_page_direct fires 30/30. Fewer slow runs (13/30 → 8/30, p=0.28).

- **Kept/reverted:** **kept.** UMTS −138 (p=0.049), full −55 (n.s.), no regressions.
- **Remaining slow group (measured):** commits ~205 ms after the page chunk loads even when page_direct fired, so
  something below DashboardPage suspends. Slow runs are exactly those where Routes resolves late (~20 ms before
  walletReady instead of ~100 ms). Inferred: a DashboardPage child suspends on something requested alongside Routes.

### 7. H4: load only the active locale's messages

- **Commit:** f6fb610cb (cherry-pick of 5ec8f065e)
- **Size (measured, debug APK build):** entry 13,769,109 → 12,580,440 B (−1,188,669, −8.6%); es 438 KB, fr 464 KB,
  ar 544 KB lazy chunks.
- **Numbers (measured, Roadie A/B vs 74b0703b3, en, full n=20, UMTS n=10, 0 stalls):** run
  `20261115T041751-ab-74b0703b3-vs-f6fb610cb`. Δp50 full / UMTS, all significant: nav→entry −54 / −62, react −53 / −49,
  FCP −44 / −80, coordinator_ready −37 / −74, walletReady −39 / −74, am TotalTime −43 / −71.
- **dash_dashboard_commit did not follow:** +103 full (p=0.22), −111 UMTS (p=0.07). Slow group on full 1/20 → 12/20
  (Fisher p=4e-4); UMTS 4/10 → 4/10. Within each group H4 is faster (fast 2031 → 2000, slow 2246 → 2207).
  Inferred (Roadie): walletReady now overtakes the Routes/page chunk more often, so more runs hit the slow path.
- **es check (measured, 3 launches):** Spanish UI, es chunk fetched, same console errors as en, commit 2034–2069 ms.
  flags → react cost: +1–2 ms en, ~17–19 ms es.
- **Kept/reverted:** **kept, provisional.** It meets the agreed metric (coordinator_ready / walletReady, all
  significant) but the slow-mode count got worse. The dashboard gain depends on fixing the slow path (attempt 8).

### 8. EXPERIMENTAL routes-fallback nudge (rejected)

- **Commits:** 9e19aac6e (debug-only marks, kept: no behavior change), 7d7807688 (nudge, **reverted** in the next commit).
- **Numbers (measured, Roadie A/B 9e19aac6e vs 7d7807688, full n=20, UMTS n=10, 0 stalls):** run
  `20261115T045620-ab-9e19aac6e-vs-7d7807688` (holdtable.py per-run table).
  dash_dashboard_commit full 2027/2201 → 2144/2185 (+117, p=0.06), UMTS 2032/2188 → 2030/2217 (−2). Slow runs pooled
  8/30 → 17/30 (Fisher p=0.035). Worse.
- **Theories tested (measured):** nudge-releases-hold: no (commit lands 147–204 ms after the nudge). Timer hold: no
  (dash_routes_fallback_timer fired 0/60). **Long task: yes.** Every slow run has a ~110–120 ms main-thread task
  starting 100–115 ms after walletReady, then ~80 ms more; the last body render and the commit sit inside it. In fast
  runs the same task starts ~40 ms after the commit.
- **Mechanism (inferred):** a post-walletReady task, not the dashboard, decides the slow group. If the page chunk lands
  within ~60 ms of walletReady the commit wins; otherwise it queues behind the task. That is also why H4 (earlier
  walletReady, same chunk timing) grew the slow group.

## Next ideas

1. Identify the ~110 ms task that starts ~100 ms after walletReady (CDP trace on the emulator) and defer it until after
   the first dashboard commit (post-commit effect / requestIdleCallback), if it is not needed for first paint. Expected:
   most of the slow group (~200 ms on 8–16/30 runs) goes away, and H4's gain reaches the dashboard.
2. Start the Routes + DashboardPage chunk fetch at entry so it lands before that task.
3. H2 (modulepreload FullApp's static closure), H11 (dedupe ~8 concurrent privateKey reads), H10b (self-host
   Poppins/Jacques Francois, drop the blocking Google Fonts @imports): prepared and host-verified, not benched.
4. H6 (lazy wallet plugins: openid4vc 14%, render-method 9% of entry): not started, med–high risk.

## Final confirm (measured, Roadie, emulator)

f947b4cbd vs baseline 52c8b0afd, alternating, n=20 per build per scenario, locale en, Nov 15 05:23-05:46 PT
(run `20261115T052328-ab-52c8b0afd-vs-f947b4cbd`; reused the 9e19aac6e APK, sha256 identical, diff is HILLCLIMB.md only).

| metric               | full p50 Δ         | UMTS p50 Δ         | Mann-Whitney p |
| -------------------- | ------------------ | ------------------ | -------------- |
| dashboard (URL flip) | 2327 → 1990 (−337) | 2293 → 1992 (−302) | 6e-8 / 6e-8    |
| am TotalTime         | 2352 → 2034 (−318) | 2342 → 2027 (−315) | 6e-8 / 9e-8    |
| coordinator_ready    | −317               | −323               | 6e-8           |
| walletReady          | −315               | −323               | 6e-8           |
| FCP                  | −105               | −91                | 3e-4 / 3e-5    |
| nav→entry            | −98                | −102               | 6e-8           |
| react                | −88                | −99                | 5e-6 / 8e-8    |

- dash_dashboard_commit has no baseline (52c8b0afd predates the marks). f947b4cbd: p50 2077 full, 2022 UMTS.
- Biggest share: FCP → auth transition #1, about −205 ms. Auth transition #1 → #2 is about +75 ms slower (p≈0.04),
  likely work that moved, not new work (inferred).
- Slow groups: URL flip 3/20 → 0/20 full, 0 → 0 UMTS. Commit mark on f947b4cbd: 8/20 full, 8/20 UMTS (the
  walletReady+~110 ms long task, still open).
- Stalls: baseline 1/40 (nav→entry 23.3 s on UMTS, consistent with the FluentEmoji @import H10 removed); f947b4cbd 0/40.

## The long task, identified (Roadie CDP trace, 3 cold launches of f947b4cbd, full)

- **Measured:** one 125–133 ms task under tracing (110–120 ms untraced), starting 92–114 ms after walletReady. It is the
  native bridge result (`androidBridge.onmessage` → `returnResult`) resuming `restoreClient` (in the `useLogout-*` chunk):
  the TanStack Query persisted-cache restore. It reads native storage, JSON-parses, then
  `persistQueryClientRestore` → `hydrate`.
- **Measured:** ~97 ms of self time is `setTimeout`. Main stack: `setTimeout` < Sentry's setTimeout wrapper < `scheduleGc`
  < `QueryCache.build` < `hydrate` (~90 ms). About 1,720 GC timers per launch (~1,080 at 5 min gcTime, 641 at 7 days).
- **Fix options (inferred, not benched):** persist less (`shouldDehydrateQuery` / `dehydrateOptions`, `maxAge`); defer the
  restore until after the first dashboard commit (must not show stale or another user's data); keep Sentry from
  wrapping these timers. This is now next idea #1 and should remove most of the 8/20 commit-mark slow group.
- Before/after clip (UMTS): FrenchFry `~/roadie-scratch/lca-bench/clips/merged-vs-final.mp4` (baseline take 2260 ms,
  final take 1928 ms). Traces: `~/roadie-scratch/lca-bench/traces/f947b4cbd-longtask.md`.
