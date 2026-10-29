# Native SQLite encryption

Native account storage is prepared before the shared SQLite connection is created. The pinned
`@capacitor-community/sqlite@8.1.1` patch adds `prepareEncryptedDatabase` on Android/iOS; it returns
only a version, encryption status and whether a plaintext file was converted. Random 256-bit
secrets stay in native code and its protected store, never in JavaScript, logs or preferences
outside that store. Browser SQLite and IndexedDB storage are unchanged.

This change is stacked on connection ownership PR #1837. Account-isolation PR #1838 remains
separate; it must retain its own selection rules when both land. Jira: LC-2321.

## File and secret lifecycle

- A process lock serializes native preparation, including secret provisioning. Android also uses
  a same-JVM monitor. On encryption-capable binaries, missing/unreadable secrets fail preparation;
  a wrong secret fails the plugin's keyed open. No new secret, plaintext downgrade, deletion or
  account reset occurs for an existing encrypted file.
- An existing encrypted file is not opened or scanned by preparation: it checks the header and
  protected secret, then the plugin authenticates its own keyed connection. This avoids a duplicate
  SQLCipher key derivation and a full startup scan of every cache page, including after a JS reload.
  A damaged cache page can still fail when queried, but does not by itself gate healthy account pages.
- Android persists the random secret synchronously in the plugin's EncryptedSharedPreferences
  backed by its Keystore MasterKey. iOS uses the plugin's Keychain account/prefix, with
  `AfterFirstUnlockThisDeviceOnly` accessibility. Keychain access errors propagate rather than
  becoming a missing value. Normal logout does not clear the storage secret or recovery shares.
- For plaintext conversion, validate the source, checkpoint any WAL, require DELETE journal
  mode, export inside an exclusive transaction to an encrypted file in the same directory,
  preserve `user_version`, then validate both SQLite and SQLCipher integrity. The original is
  never renamed aside or deleted first. Sync the staged file, atomically rename it over the
  original, and sync the directory. Only encrypted staging files and their sidecars are disposable.
- A zero-byte legacy file with no populated WAL/journal/SHM is treated as a fresh empty database.
  Short nonempty files and empty files with populated recovery sidecars remain intact and fail closed.
- Process death before replacement leaves a usable original and a stable stored secret; a retry
  rebuilds staging. Death after replacement leaves a valid encrypted file; a retry opens it.
  This is tested process-interruption recovery, not a claim of power-loss certification on every
  device/filesystem. An active writer preventing WAL checkpoint/journal change blocks conversion.
- Android backup/transfer rules exclude SQLite databases and the encrypted secret preferences.
  iOS excludes the prepared file from backup and applies complete-until-first-authentication file
  protection. These rules cannot retract older backups that already exist.
- Existing encrypted files with a missing device secret remain intact and unavailable; recovery
  must be explicit. Cross-device DB-file restore is unsupported. Removing account/recovery data
  follows the existing logout/forget-device contracts; the storage secret is not itself an account
  identity and can be retained for the next empty account database. iOS Keychain entries may
  survive uninstall; Android Keystore secrets do not.

## Connection lifetime and rollout

Native SQLCipher connections are retained for the JavaScript owner lifetime. Releasing a retained
owner still lets active leases finish. Failed schema initialization releases/closes its connection;
database deletion invalidates schema and connection knowledge. There is no timer racing a new
reader. Web and non-retained connection behavior is unchanged.

Encryption requires an updated native **binary**: it uses a new plugin method and native backup/config
changes. If Capacitor reports exactly `code: 'UNIMPLEMENTED'` for that method, the JS bundle uses
the older binary's existing plaintext connection mode. Those devices remain unencrypted until a
binary upgrade; this is compatibility with a missing capability, not a fallback after a preparation
or keyed-open failure. Error messages, other error codes and invalid preparation responses never
enable the legacy path. LearnCard/VetPass and ScoutPass canonical native configurations enable encryption. The
new LearnCard OTA channel is `1.0.14`, ScoutPass `1.0.9`; older channels must remain on compatible
JavaScript for all native capabilities. ScoutPass's committed Android/iOS configs are generated from
its canonical settings, with a regression for channel/encryption/browser-setting drift. Validate
tenant generation/sync before release. An older binary expecting plaintext cannot read an already-converted DB; binary downgrade
is unsupported without an explicitly designed recovery path. Keep the PR draft until device and
release gates are reviewed.

## Reproducible synthetic checks

The two native helper files here are canonical. The package patch includes byte-identical copies.
`scripts/verify-native-sqlite-encryption.mjs` refuses a source/installed-patch mismatch.

Host test prerequisites: macOS, Swift/Xcode tools, a separately built SQLCipher 4.14.0 library,
Node 24.12, repository-pinned Bun 1.4.2. Build the pinned official source under a disposable
directory (OpenSSL include/library paths depend on the host):

```sh
curl -fL https://github.com/sqlcipher/sqlcipher/archive/refs/tags/v4.14.0.tar.gz -o sqlcipher.tar.gz
# SHA-256: 67fb27e967a4a6968c0905691c89c908e7250dddc581b887c19ef981c737e473
tar -xzf sqlcipher.tar.gz
cd sqlcipher-4.14.0
./configure --with-tempstore=yes --disable-tcl \
  CFLAGS="-O2 -DSQLITE_HAS_CODEC -DSQLITE_EXTRA_INIT=sqlcipher_extra_init -DSQLITE_EXTRA_SHUTDOWN=sqlcipher_extra_shutdown -DSQLCIPHER_CRYPTO_OPENSSL -I/opt/homebrew/opt/openssl@3/include" \
  LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib -lcrypto"
make -j2 sqlite3 libsqlite3.dylib
```

From the repo root:

```sh
node scripts/verify-native-sqlite-encryption.mjs \
  --sqlcipher-dir /absolute/path/sqlcipher-4.14.0 --output /absolute/private/evidence-directory \
  --functional-only
```

This compiles the production Swift helper and exercises fresh files, wrong/missing secrets,
preserved account/recovery data and schema version, corrupt originals, secret-write failure,
stale staging, real uncheckpointed WAL, concurrent processes, and process death after secret
storage/before replacement/after replacement. Fixtures are synthetic and removed after success;
the CLI secret-file adapter is a test double, **not proof of iOS Keychain behavior**.
The added regressions corrupt an authenticated cache page: existing-file preparation permits a
healthy account read, while the same corruption in conversion staging fails full validation and
preserves the source. Wrong keys still fail at keyed open, and zero-byte/short/sidecar cases are covered.
`--functional-only` skips the performance comparison; omit it only when intentionally measuring.

The standalone `android-tests` app compiles the actual patched native plugin and Android SQLCipher
4.17.0, without Firebase, LearnCard accounts, or any existing app data. Use a separately owned
emulator/device and the applicationId `com.learncard.sqlite.encryption.probe`. Never run tests
against the user's LearnCard/ScoutPass package or clear another task's emulator.

```sh
ANDROID_HOME=/absolute/android/sdk JAVA_HOME=/absolute/jdk21 \
  apps/learn-card-app/android/gradlew -p packages/learn-card-base/native/sqlite/android-tests \
  :app:assembleDebug :app:assembleDebugAndroidTest --console=plain
```

Install its two APKs on the explicitly selected owned serial, then run
`adb -s <owned-serial> shell am instrument -w com.learncard.sqlite.encryption.probe.test/androidx.test.runner.AndroidJUnitRunner`.
Only synthetic counts/durations are emitted. Keep raw device output private. Uninstall the two
probe packages and stop only the owned emulator after collecting evidence.

The instrumentation class includes an explicit `measureEngineCosts` benchmark; select functional
methods when measuring is paused. For protected-secret persistence across an Android process restart,
run the functional suite first, then rerun only `MigrationTest#nativePluginUsesProtectedStoreAndEncryptedConnection`
with instrumentation argument `-e sqlitePhase reopen`. That phase requires the existing encrypted
fixture and must not seed or delete it.

For the real iOS plugin/Keychain regression:

```sh
node scripts/verify-native-sqlite-ios.mjs --output /absolute/new/private/ios-evidence
```

Requires Xcode with the iOS 18.1 simulator runtime and Ruby's `xcodeproj` gem (tested with 1.27.0).
The runner supplies the published package's declared-but-missing `ios/PluginTests` directory and
generates an ad-hoc-signed, sandboxed probe app with its own Keychain entitlement. It creates its
own iPhone 16/iOS 18.1 simulator, runs the hosted test, then shuts down/deletes only that simulator.
It never adopts an existing device or needs a real signing account. Xcode logs/xcresult remain private. The test
checks native conversion, a second plugin instance's stored-secret access, recovery-data reads,
backup exclusion, and the exact Keychain accessibility policy.

The hosted test passed on the task-owned iPhone 16/iOS 18.1 simulator. The patched production
plugin also built for both arm64 and x86_64 Simulator. An initial unhosted SwiftPM runner could
not access Keychain without an entitlement; the committed runner uses the sandboxed app above.
These results do not establish physical-device lock/unlock or cross-device restore behavior.

To regenerate the dependency patch, first use `bun patch @capacitor-community/sqlite@8.1.1`,
extract the unmodified npm package to a disposable directory, then run
`node scripts/sync-sqlite-encryption-patch.mjs /absolute/path/unmodified-package` followed by
`bun install --ignore-scripts`. The generator includes exactly seven reviewed source files and
excludes Gradle outputs/cache tags. Do not use `bun patch --commit` after compiling the native
dependency: it can collect generated build outputs into the patch.

## Initial performance observations (not a device baseline)

Three macOS host trials on the same synthetic shape (1,000 × 1 KiB credential rows, 1 MiB snapshot,
SQLCipher default security settings) varied under concurrent host load:

| Median                    | Trial 1 plain / encrypted | Trial 2 plain / encrypted | Final source plain / encrypted |
| ------------------------- | ------------------------- | ------------------------- | ------------------------------ |
| Open + first read + close | 0.058 / 63.97 ms          | 0.081 / 123.61 ms         | 0.282 / 146.59 ms              |
| Warm point read           | 0.0052 / 0.0047 ms        | 0.0068 / 0.0116 ms        | 0.0124 / 0.0113 ms             |
| 1 MiB snapshot commit     | 5.14 / 9.74 ms            | 6.99 / 27.74 ms           | 14.41 / 31.31 ms               |

Conversion was 144–390 ms. Trial 2 encrypted snapshot p95 reached 98 ms, illustrating host-load
variance. These include native API/engine work but no Capacitor bridge, JavaScript, protected-store
access or physical-device scheduling. The strong finding is repeated encrypted-open cost; keep
the connection rather than weakening derivation/authentication settings. Warm read differences
at these durations are too small/noisy for a production speed claim. Measure actual Android/iOS
startup and large-cache commits before setting budgets. The Linux web catalog proves no native
encryption behavior.

## Android API 36 synthetic results

The independently built probe app passed six instrumentation tests using the actual patched plugin
and Android SQLCipher 4.17.0. A separate instrumentation invocation then passed the protected-store
reopen test without reseeding the database. Only the task-owned probe packages/device were used;
both packages were uninstalled and that emulator stopped afterward.

| Operation                 | Plain p50 / p95    | Encrypted p50 / p95   |
| ------------------------- | ------------------ | --------------------- |
| Open + first read + close | 0.356 / 4.227 ms   | 874.091 / 2516.899 ms |
| Warm account point read   | 0.0338 / 0.0875 ms | 0.0229 / 0.1221 ms    |
| 1 MiB snapshot commit     | 24.105 / 54.870 ms | 148.546 / 253.783 ms  |

Conversion took 1276 ms for the small account/recovery fixture. Open/write samples: ten each;
warm reads: fifty. This API 36 arm64 emulator had two vCPUs and 2 GiB RAM, and host load was about 24. Measurements include native engine/API and cursor work, not the WebView/JavaScript bridge.
The modes were measured in sequence and host load was uncontrolled; these are observed costs,
not a quiet-device baseline, a precise overhead percentage, or a physical-phone startup budget.
The Android fixture is smaller than the host fixture, so do not compare conversion times across
platforms directly. The retained-connection unit tests prove sequential scopes open once and close
only after explicit release; full-app account readiness and physical-device performance still need QA.
