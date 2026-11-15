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
