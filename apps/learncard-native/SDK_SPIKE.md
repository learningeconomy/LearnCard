# LearnCard native SDK compatibility spike

Use **SwiftUI for the interface and the existing LearnCard SDK in a bundled local WebKit service host** for the first live-account implementation. The iOS simulator can run the current SDK and its version-matched DIDKit WASM without importing the Ionic app, React UI, or web portals. Keeping the existing SDK preserves credential signing, encryption, recovery, and network semantics while the native interface develops independently.

The offline spike uses disposable public identities and generated credential-library fixtures. A follow-up [staging exchange](STAGING_VALIDATION.md) now opens existing disposable profiles, claims and indexes credentials, reloads the collection, and sends a native-issued credential back to the current SDK. The personal app now has a separate account SDK facade: [Firebase sign-in, SSS recovery, and Keychain-backed relaunch](ACCOUNT_INTEGRATION.md) have connected an existing staging account. The offline spike harness remains separate from that facade. Physical-device and minimum-iOS testing remain required.

## Measured interoperability

The native test host loads the bundled SDK from local files in a nonpersistent WebKit data store. Its content security policy blocks network connections and remote scripts. Swift calls a fixed list of spike commands with structured arguments, and the runtime returns JSON outputs that the tests validate; it does not render product screens.

The normal SDK in Bun generates reference inputs. XCTest runs the same source bundle on an iPhone 17 Pro simulator with iOS 26.4. A separate Bun verifier checks outputs created by the native runtime. This tests an actual cross-runtime exchange, rather than two checks within one JavaScript context.

| Check                                                         | Result                                                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Signing identity                                              | Both issuer and holder derive the same `did:key` as the standard SDK                                      |
| Web-issued credential signatures verified on iOS              | 10 of 10                                                                                                  |
| iOS-issued credential signatures verified by the standard SDK | 10 of 10                                                                                                  |
| Altered signed credentials                                    | Rejected for all 10                                                                                       |
| DAG-JWE encrypted data                                        | Web → iOS and iOS → web pass, preserving Unicode, numbers, and nested objects                             |
| Unrelated decryption identity                                 | No plaintext returned; adapter must treat the SDK's empty-string result as a failure                      |
| LearnCloud index fields                                       | Encrypted query/index hashes match the standard SDK                                                       |
| Signed presentation                                           | Created on iOS and verified by the standard SDK with its challenge and domain                             |
| Wrong presentation challenge                                  | Rejected                                                                                                  |
| DID-auth JWT                                                  | Created on iOS and verified by the standard SDK with `proofFormat: 'jwt'` and the expected challenge      |
| Device/auth SSS shares                                        | Reconstruct the original test identity material                                                           |
| Password recovery                                             | Existing Argon2id/AES-GCM record decrypts and reconstructs the original identity; wrong password rejected |
| Recovery phrase                                               | Existing LearnCard phrase format decodes and reconstructs the original identity                           |
| QR transfer crypto                                            | Existing X25519/HKDF/AES-GCM format passes in both directions; unrelated transfer recipient rejected      |

The fixtures are `vc-v1/basic`, `vc-v2/basic`, `vc-v2/with-evidence`, `vc-v2/multiple-subjects`, `obv3/minimal-badge`, `obv3/full-badge`, `boost/basic`, `boost/with-skills`, `clr/minimal`, and `clr/westbridge-full`. The CLR checks cover the outer credential signature and preserve contained data; they do not establish independent verification of every nested credential or issuer policy.

### Full verification differs from signature verification

Nine fixtures pass default full verification in this test. `clr/westbridge-full` passes signature verification in both directions but fails default full verification in both the web baseline and the offline native host. It contains external status/schema dependencies, and the web baseline also reported schema validation problems in an earlier run. The offline native host reports unavailable status-list/schema resources.

That exception is **not a failed native signature exchange** and must not become a green verified badge. The production app needs separate signature, status, schema, issuer-trust, and last-check results. An unavailable online check remains unavailable; the display must preserve that distinction. Remote contexts, status lists, and schemas need an explicit fetch policy in the live adapter.

### SDK behavior that the adapter must preserve

The encryption plugin adds the sender to the recipients of `createDagJwe`. Sender decryption is therefore expected. A negative recipient test needs a third identity. For an unrelated identity, the current WASM SDK can return an empty string rather than throw. Native code must validate decrypted credential/index shapes and reject empty or malformed results. Swift dictionary serialization can change object key order; LearnCloud index-field hashes are compared as an unordered set, while their individual values remain byte-identical. Preserve that distinction instead of treating JSON key order as a cryptographic identity.

JWT presentation verification requires `proofFormat: 'jwt'`. The network and cloud clients sign challenge-bound DID-auth JWTs; a Firebase bearer token cannot replace those proofs.

LearnCard's recovery phrase encodes an SSS share and can contain 25 words. It is not simply a standard 24-word wallet mnemonic. Password records use the stored Argon2id parameters: the baseline currently uses memory 65,536 KiB, three iterations, parallelism four, and a 32-byte derived key. Reusing the source avoids drifting from those formats.

## Runtime decision

| Option                                | Evidence                                                                                                                              | Decision                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Local WebKit SDK host                 | Current SDK, DIDKit WASM, Web Crypto, recovery, and bidirectional fixture exchanges pass on iOS 26.4 simulator                        | Preferred first implementation behind the native service interface                                                                   |
| JavaScriptCore with platform adapters | Actual DIDKit WASM compiles on this simulator with 108 imports; unadapted SDK load fails on missing browser crypto/global assumptions | Keep as a possible later optimization; requires adapters and real-device/minimum-iOS proof                                           |
| Rust mobile FFI                       | Repo contains a Node N-API wrapper over pinned DIDKit/SSI forks; mobile targets and initialized submodules are absent here            | Viable longer-term candidate; not built or benchmarked in this spike, and does not directly replace SDK recovery/network/index logic |
| Existing HTTP signing bridge          | Uses a singleton server `WALLET_SEED`                                                                                                 | Does not model existing personal account custody; excluded                                                                           |

Apple supports JavaScript execution in [WebKit content worlds](https://developer.apple.com/documentation/webkit/wkwebview/evaluatejavascript%28_%3Ain%3Acontentworld%3A%29) and describes local-resource access with [app-bound domains](https://webkit.org/blog/10882/app-bound-domains/). The prototype host only loads its exact bundled HTML entry point and blocks other navigation.

The SDK bundle measured **2,157,544 bytes** and the version-matched DIDKit WASM **8,840,701 bytes**, about 10.49 MiB together before app packaging/compression. The WASM hash is `fe1d254186130480a3ae831fe1b17c58ea732adc39cad16f895aa58e03f1bd62`. One simulator run initialized WebKit plus three test SDK instances in **1,091 ms**; password/device/phrase recovery checks, including a wrong-password attempt, took **283 ms**. These are single-run simulator observations, not device startup targets or memory measurements. Re-run output includes current timings in `sdk-spike/generated/results.json`.

Keep the service boundary independent of the engine. Once live interoperability is established, a smaller personal-only plugin bundle, JavaScriptCore adapters, or Rust FFI can be evaluated on measured startup, memory, binary size, and maintenance costs. The current spike bundles the normal SDK initialization stack to establish a baseline; no web application UI is bundled.

## Connecting an existing account

Native sign-in and credential access involve three identities that must not be conflated:

1. **Auth session:** sign into the same configured Firebase project/provider to obtain the existing user's session and identity-recovery authorization.
2. **Signing identity:** reconstruct the original key through the existing SSS/device-transfer/recovery workflow. Compare the derived `did:key` with the server's stored `primaryDid` and, where applicable, the approving device's identity. A successful auth session with missing local shares means recovery is needed; it is not permission to generate a new identity.
3. **Network profile identity:** initialize the network SDK and load the existing profile. The network plugin can expose the profile's DID rather than the underlying `did:key`. Keep the signing DID, network profile DID, auth UID, and tenant separate in native state. Preserve the SDK's LearnCloud DID-association behavior when the account is confirmed.

Use native Firebase authentication and native secure storage while reusing the headless SSS/account logic through explicit adapters. `createSSSStrategy` accepts storage functions; adapt those to Keychain instead of using IndexedDB or web local storage for device shares. Keep long-lived keys/shares out of WebKit persistence, JavaScript logs, message-handler diagnostics, and collection display models. The local SDK may hold signing material in memory while unlocked; it should be disposed on sign-out/account switch and recreated from native protected storage.

The initial existing-account path should be **Sign in → Restore access → Confirm identity → Load collection**. Existing-device QR approval is useful for users who still have a signed-in device; password/phrase recovery covers enrolled users without it. Do not require users to paste private keys. Preserve share versions, rotation/history, recovery sessions, and identity-rebind semantics from `sss-strategy.ts` rather than writing a new simplified secret-sharing system.

Legacy Web3Auth-only accounts and users without usable recovery material require the existing upgrade/recovery flow. A new native install must not silently create a different account with the same email. Email/escrow identity recovery, guardian account behavior, and native passkey PRF need their own live validation; the cryptographic fixture pass does not test their server authorization or enrollment.

Native Firebase setup needs the experiment's own registered iOS app and appropriate provider configuration. Check Google client identifiers, email-link callbacks, and Sign in with Apple app/service grouping so the new bundle does not accidentally create a distinct auth identity. Resolve the tenant and its endpoints explicitly. Local development can share production Firebase settings in the current repo, so a local URL alone does not establish a separate test account environment.

### First live slice

The user selected staging/dev services and the shared Firebase project `learncard` with a dedicated test login. The disposable DID-auth staging exchange passes; Firebase-backed account restoration remains the next slice:

1. Register/configure the native Firebase client and deep-link callbacks. Implement native provider/session adapters and Keychain device-share storage.
2. Connect the current SSS strategy and recovery state machine, including DID equality and version checks. Validate first install, existing-device transfer, restart, sign-out, wrong recovery input, interrupted recovery, and account switching.
3. Initialize the real SDK with the confirmed identity and tenant endpoints. Load the existing profile and LearnCloud collection; resolve/decrypt credential content and retain signed payloads separately from display metadata. The personal index determines the collection, while network/inbox records determine delivery state.
4. Validate challenge-authenticated **read access** against a real account before enabling claim, creation, send, or disclosure commands. Network acceptance plus personal indexing is a recoverable multi-step operation, not one atomic mutation.
5. Add a production facade with a small typed command list and an allowlisted native HTTPS transport. The offline harness's `connect-src 'none'` must remain on the spike; do not simply open broad network access or expose arbitrary `invoke`/JavaScript calls to the app.

The reusable account facade should expose initialize/lock/dispose, profile/collection reads, credential verification, offer review/claim, native builder issuance/send, and sharing operations. Each command needs a stable DTO, cancellation/deadline handling, and friendly errors. Secrets are inputs from native protected storage, not return values. Tests should check missing profiles and associations explicitly before allowing writes.

## Remaining interoperability cases

- Physical iPhone and the minimum supported iOS version; simulator JSContext support is not a device guarantee.
- Live Firebase provider identity, SSS auth-share authorization, share rotation/rebind, native Keychain lifecycle, and account switching.
- Existing Firebase-backed account collection equality, pagination, guardian approval, revocation sync, and partial claim/index failures. Disposable staging profile reads, DID association, claim/index, reload, and send now pass.
- External issuers, remote contexts/schema/status resources, federated storage URIs, independently signed nested CLR credentials, and issuer-trust policy.
- OpenID issuance/presentation exchanges, SD-JWT selective disclosure, current share-link expiry/passcodes/revocation, and native passkey PRF with a real authenticator.
- Android's chosen local SDK host, Web Crypto support, native authentication, and Keystore behavior.

These are scoped follow-up gates. The fixture results support general credential-format interoperability, not complete feature parity or live account access today.

## Branding changes

The native prototype now uses the actual LearnCard rainbow **L** mark and vector wordmark from the existing app assets, including a native launcher icon. Its green primary action uses the current login brand family. Credential surfaces map the colorful theme's achievement pink, learning emerald, and membership blue into the native detail/card layout. Navigation, forms, and sheets remain native; category color carries LearnCard identity without bringing back the old display-mode switches.

Sources are `apps/learn-card-app/src/assets/images/learncard-circle-icon.svg`, `learncard-text-logo.svg`, `src/theme/schemas/colorful/theme.json`, and `tailwind.config.js`. The native asset conversion preserves those existing marks. The new native directory intentionally uses category colors from the established colorful theme; the earlier neutral-only treatment has been superseded by the user's branding request.

## Reproduce

From the repository root with Bun dependencies installed, Xcode, and an iOS simulator runtime:

```bash
bash apps/learncard-native/scripts/test-sdk.sh -quiet
bash apps/learncard-native/scripts/run-ios.sh
```

The script generates public vectors and the browser SDK bundle, runs focused native checks, exports their result attachments, and independently verifies native-created outputs in Bun. Generated JS/WASM/vectors and raw test artifacts are ignored. Synthetic transfer fixtures are extractable only so both runtimes can import the same disposable test key; the production QR helper retains its nonextractable key behavior.

Source landmarks: `sdk-spike/prepare.ts`, `runtime.ts`, `verify-native.ts`, `ios/NativeCore/Sources/LearnCardNativeSDK/SDKSpikeRuntime.swift`, and `ios/UITests/SDKCompatibilityTests.swift`. The current offline host is a compatibility harness. The default app uses `LiveCredentialService`; `--demo` selects `DemoCredentialService`. See [ACCOUNT_INTEGRATION.md](ACCOUNT_INTEGRATION.md) for current live evidence and limitations.

## Saved result snapshot

[SDK_RESULTS.json](SDK_RESULTS.json) records the measured fixture outcomes, runtime/device metadata, sizes, and timings from the successful October 12, 2026 run. It contains summary results only; signed fixture outputs and disposable recovery material remain in ignored test artifacts. The five branded native UI checks and seven domain tests also pass.

## Existing account update on October 12 2026

Native email-code sign-in now uses Firebase REST custom-token exchange and refresh, with the existing AuthCoordinator/SSS source and native Keychain adapters. Recovery through an email recovery key restored the existing staging identity and opened 30 collection records plus three incoming offers. Relaunch resumed access. This revises the initial native-Firebase-SDK registration dependency for the email-code slice only; Google/Apple providers still need separate app configuration. See [ACCOUNT_INTEGRATION.md](ACCOUNT_INTEGRATION.md).
