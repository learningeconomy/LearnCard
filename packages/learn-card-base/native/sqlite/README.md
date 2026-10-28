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
  a same-JVM monitor. A missing/corrupt/unreadable secret on an existing encrypted file fails
  closed. No new secret, plaintext fallback, deletion or account reset occurs.
- Android persists the random secret synchronously in the plugin's EncryptedSharedPreferences
  backed by its Keystore MasterKey. iOS uses the plugin's Keychain account/prefix, with
  `AfterFirstUnlockThisDeviceOnly` accessibility. Keychain access errors propagate rather than
  becoming a missing value. Normal logout does not clear the storage secret or recovery shares.
- For plaintext conversion, validate the source, checkpoint any WAL, require DELETE journal
  mode, export inside an exclusive transaction to an encrypted file in the same directory,
  preserve `user_version`, then validate both SQLite and SQLCipher integrity. The original is
  never renamed aside or deleted first. Sync the staged file, atomically rename it over the
  original, and sync the directory. Only encrypted staging files and their sidecars are disposable.
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

An encrypted native **binary** is required: this uses a new plugin method and native backup/config
changes. LearnCard/VetPass and ScoutPass canonical native configurations enable encryption. The
new LearnCard OTA channel is `1.0.14`, ScoutPass `1.0.9`; older channels must remain on compatible
JavaScript. Validate tenant generation/sync before release. Never push this bundle onto the older
channels. An older binary expecting plaintext cannot read an already-converted DB; binary downgrade
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
  --sqlcipher-dir /absolute/path/sqlcipher-4.14.0 --output /absolute/private/evidence-directory
```

This compiles the production Swift helper and exercises fresh files, wrong/missing secrets,
preserved account/recovery data and schema version, corrupt originals, secret-write failure,
stale staging, real uncheckpointed WAL, concurrent processes, and process death after secret
storage/before replacement/after replacement. Fixtures are synthetic and removed after success;
the CLI secret-file adapter is a test double, **not proof of iOS Keychain behavior**.

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

To regenerate the dependency patch, first use `bun patch @capacitor-community/sqlite@8.1.1`,
extract the unmodified npm package to a disposable directory, then run
`node scripts/sync-sqlite-encryption-patch.mjs /absolute/path/unmodified-package` followed by
`bun install --ignore-scripts`. The generator includes exactly seven reviewed source files and
excludes Gradle outputs/cache tags. Do not use `bun patch --commit` after compiling the native
dependency: it can collect generated build outputs into the patch.

## Initial performance observations (not a device baseline)

Two macOS host trials on the same synthetic shape (1,000 × 1 KiB credential rows, 1 MiB snapshot,
SQLCipher default security settings) varied under concurrent host load:

| Median                    | Trial 1 plain / encrypted | Trial 2 plain / encrypted |
| ------------------------- | ------------------------- | ------------------------- |
| Open + first read + close | 0.058 / 63.97 ms          | 0.081 / 123.61 ms         |
| Warm point read           | 0.0052 / 0.0047 ms        | 0.0068 / 0.0116 ms        |
| 1 MiB snapshot commit     | 5.14 / 9.74 ms            | 6.99 / 27.74 ms           |

Conversion was 144–190 ms. Trial 2 encrypted snapshot p95 reached 98 ms, illustrating host-load
variance. These include native API/engine work but no Capacitor bridge, JavaScript, protected-store
access or physical-device scheduling. The strong finding is repeated encrypted-open cost; keep
the connection rather than weakening derivation/authentication settings. Warm read differences
at these durations are too small/noisy for a production speed claim. Measure actual Android/iOS
startup and large-cache commits before setting budgets. The Linux web catalog proves no native
encryption behavior.
