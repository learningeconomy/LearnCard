# Native CDN startup results — 2026-10-29

Both APK variants started the real native React application and completed native SQLite initialization online and fully offline. The ordinary-network samples show no material startup penalty from the CDN tag. This corrects the earlier claim that losing the network would necessarily prevent native startup.

## Visible native UI — cold launches

Android accessibility measured the first visible public sign-in text online, or the expected offline gate offline. Each cell contains six launches, alternating variant order, with app data cleared and process restarted. Times include native startup. The milestone can occur during the final splash fade; it does not measure authentication.

| Network | Tag     | Successful / launches |  Median | Observed range |
| ------- | ------- | --------------------: | ------: | -------------: |
| Online  | Without |                   6/6 | 4.515 s |  4.242–4.797 s |
| Online  | With    |                   6/6 | 4.393 s |  4.261–4.597 s |
| Offline | Without |                   6/6 | 4.444 s |  4.378–4.508 s |
| Offline | With    |                   6/6 | 4.508 s |  4.357–4.730 s |

The tag-present median was 123 ms faster online and 64.5 ms slower offline. These small, opposite-direction differences sit within run-to-run variation; this sample does not establish a normal-network speedup from removing the tag. Offline cold requests failed quickly; they did not prevent the application or native database from starting.

## React and real native SQLite — separate cold cohort

Ten launches per cell (40 total), all successful. These launches did not use native UI instrumentation and must not be pooled with the visible-UI timings. WebView milestones are relative to navigation and can occur behind the native splash. SQLite timing means the first successful native bridge `open` / `execute`, not a database-content audit.

| Network | Tag     | React first frame, median | Native SQLite open, median | Native SQLite execute, median |
| ------- | ------- | ------------------------: | -------------------------: | ----------------------------: |
| Online  | Without |                  610.8 ms |                  2417.0 ms |                     2433.2 ms |
| Online  | With    |                  609.7 ms |                  2416.9 ms |                     2432.4 ms |
| Offline | Without |                  589.8 ms |                  2376.5 ms |                     2396.2 ms |
| Offline | With    |                  569.4 ms |                  2373.6 ms |                     2390.0 ms |

Cold offline CDN error events settled in 136.4–196.6 ms after navigation.

## Cached launches

A separate online-prime/force-stop cohort completed all 12 measured launches (three per cell). Its 12 priming launches are excluded from counts and statistics. With the tag present and Wi-Fi disabled after priming, the CDN module loaded successfully from the HTTP cache in all three samples. This is an additional reason to distinguish cold offline from cached offline behavior.

## Controlled pending CDN connection

A local opaque HTTPS CONNECT proxy used identical policies for both variants, forwarding the real LearnCard/Android connectivity checks and denying other hosts. Only CDN connections were held behind a shared 10,000 ms barrier. No TLS interception, certificate changes or fake connectivity response was used. Three cold launches per cell alternated order.

| CDN connection | Tag     | Successful / launches | Visible sign-in median |  Observed range | React frame after navigation, median |
| -------------- | ------- | --------------------: | ---------------------: | --------------: | -----------------------------------: |
| No added delay | Without |                   3/3 |                4.338 s |   4.225–4.352 s |                             594.3 ms |
| No added delay | With    |                   3/3 |                4.317 s |   4.127–4.389 s |                             631.8 ms |
| Held for 10 s  | Without |                   3/3 |                4.372 s |   4.235–4.442 s |                             592.6 ms |
| Held for 10 s  | With    |                   3/3 |               14.274 s | 14.272–14.425 s |                           10501.9 ms |

With a pending CDN connection, the public screen median rose from 4.317 s to 14.274 s with the tag; the no-tag median stayed near 4.4 s (4.338 s control, 4.372 s held). Each tag-present held launch recorded one actually delayed CDN CONNECT. The browser reported a script error after approximately 10.1–10.2 s, then React, native SQLite and the public sign-in screen completed successfully. This experiment proves delay while the request remains pending, not permanent startup failure. Android `am start -W` did not return a `TotalTime` in these delayed launches; visible-UI time uses the independent monotonic measurement.

The proxy is a restricted-network control, not a model of every real outage. One earlier proxy control denied the app connectivity probe and another stopped on a socket reset; neither is included in the results. Their logs remain private. The corrected zero-delay control and all six held-condition launches passed.

## Controls and limits

- Fresh task-owned Android 16/API 36 arm64 emulator, 4 vCPU, 4 GiB RAM, 720×1280 display; WebView 133.0.6943.137 remained unchanged. Host contention was not controlled (observed load around 3–6); no application builds ran during timed trials.
- Actual complete bundled LearnCard debug APK, package `com.learncard.app.dctest`, no live-server URL, OTA auto-update disabled. Anonymous guest only; online public sign-in and offline gate are the expected screens. No account creation, signed-in restoration, credential content or production backend performance was tested.
- Source binary SHA-256: `82c035f0dacd1aaac76515f0d2f0d7dcd67f6a3b4afb924640be62f9f4721e97`. Its source commit is not established; this is an A/B of that binary, not proof of a newly built current-PR native APK.
- Identical early timing instrumentation and throwaway signing key in both copies. The audited pair has 1,860 identical non-signature entries; only `assets/public/index.html` differs. The tag uses the original jeep-sqlite 2.5.8 CDN URL, immediately before the app module.
- Pair SHA-256 without tag: `2b946f64ea2c1afa4fb70910862950db6ff6ce4a14544f3d556e67a40377563f`; with tag: `61c860f78ada88c8f9bd127cf420a40579ce803d94633423f6542784801b79e2`.
- Network conditions use actual guest Wi-Fi disable/enable with cellular data disabled. Guest connectivity and `navigator.onLine` are checked. Cold launches clear only the disposable test package.
- Probes retain method names/timings only, not SQLite arguments/results. Raw JSON, logs, APKs and signing material remain private. Exploratory pilots and invalid proxy controls are excluded.
- These observations do not establish iOS, physical-device, release-build, battery/CPU, authenticated offline, or production service behavior. No statistical equivalence or device-wide performance guarantee is claimed.

These were one-off development measurements, not a maintained regression suite. The measurement proxy, APK preparation scripts and Android probe were removed after review. Their original implementation remains in commit `9c459118f`; retained regression coverage is described in the [production bundle README](README.md).
