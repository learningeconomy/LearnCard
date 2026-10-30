# Android parity

Slice 1 is the Android (Kotlin + Jetpack Compose) foundation for the iOS LearnCard native app. Later slices should take the next **Remaining** row rather than invent a parallel structure.

## This slice

- App: `apps/learncard-native/android`
- JS host: QuickJS-NG, same `account-runtime/runtime.ts` entry as iOS, command shape `LearnCardAccount.call(method, input) -> JSON` and `webkit.messageHandlers.accountNative`
- Storage: Android Keystore via EncryptedSharedPreferences, slot names matching `KeychainVault` / `AccountStorageScope`
- Screens that render without a live account: demo Home (`HomeFixture`) and fixture sign-in (`AccountFixture`)

## iOS Sources

| File                                      | Status                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Sources/AccountAccessUI.swift`           | Ported in part. Welcome and restore headings used by sign-in.                                     |
| `Sources/AccountController.swift`         | Ported in part. Fixture phase machine. The live Firebase controller remains.                      |
| `Sources/AccountFixture.swift`            | Ported in part. Sign-in fixture scenarios for this slice.                                         |
| `Sources/AccountSignInView.swift`         | Ported in part. Email, code, providers, email recovery key, and the birthday gate.                |
| `Sources/AccountTransitionView.swift`     | Remaining                                                                                         |
| `Sources/AccountView.swift`               | Remaining                                                                                         |
| `Sources/BrandProgressStyle.swift`        | Ported. Three-tile indeterminate indicator.                                                       |
| `Sources/BrandRefreshScrollView.swift`    | Remaining                                                                                         |
| `Sources/BuildLearnCardView.swift`        | Remaining                                                                                         |
| `Sources/CareerView.swift`                | Remaining                                                                                         |
| `Sources/CollectionView.swift`            | Remaining                                                                                         |
| `Sources/ConnectionInboxRow.swift`        | Remaining                                                                                         |
| `Sources/ConsumerAppSurfaces.swift`       | Remaining                                                                                         |
| `Sources/ConsumerAppsView.swift`          | Remaining                                                                                         |
| `Sources/ConsumerBrowserView.swift`       | Remaining                                                                                         |
| `Sources/CreateSendView.swift`            | Remaining                                                                                         |
| `Sources/CreationsView.swift`             | Remaining                                                                                         |
| `Sources/CredentialActivityFixture.swift` | Remaining                                                                                         |
| `Sources/CredentialActivityStatus.swift`  | Remaining                                                                                         |
| `Sources/CredentialBuilderDetails.swift`  | Remaining                                                                                         |
| `Sources/CredentialBuilderUI.swift`       | Remaining                                                                                         |
| `Sources/CredentialCardSurface.swift`     | Remaining                                                                                         |
| `Sources/CredentialDetailCard.swift`      | Remaining                                                                                         |
| `Sources/CredentialDetailFixture.swift`   | Remaining                                                                                         |
| `Sources/CredentialDetailSections.swift`  | Remaining                                                                                         |
| `Sources/CredentialDetailView.swift`      | Remaining                                                                                         |
| `Sources/CredentialLifecycleView.swift`   | Remaining                                                                                         |
| `Sources/CredentialListRow.swift`         | Remaining                                                                                         |
| `Sources/CredentialShareView.swift`       | Remaining                                                                                         |
| `Sources/DataSharingView.swift`           | Remaining                                                                                         |
| `Sources/DesignSystem.swift`              | Ported. Tokens, buttons, page headings, surfaces.                                                 |
| `Sources/DrawnUI.swift`                   | Ported in part. Settings rows and color tiles. Remaining drawn symbols stay on iOS.               |
| `Sources/EditAccountProfileView.swift`    | Remaining                                                                                         |
| `Sources/FamiliesView.swift`              | Remaining                                                                                         |
| `Sources/HomeAppsView.swift`              | Ported in part. Greeting, inbox card, recent stack, apps, people/sharing rows, and create entry.  |
| `Sources/HomeGreeting.swift`              | Ported.                                                                                           |
| `Sources/InboxActivityView.swift`         | Remaining                                                                                         |
| `Sources/IntakeFileView.swift`            | Remaining                                                                                         |
| `Sources/KeychainProbeView.swift`         | Remaining                                                                                         |
| `Sources/LatestCredentialStack.swift`     | Ported in part. Latest-five deck and older/newer controls.                                        |
| `Sources/LearnCardNativeApp.swift`        | Ported in part. Demo home and fixture sign-in entry.                                              |
| `Sources/LearnerWelcomeView.swift`        | Remaining                                                                                         |
| `Sources/LoadingReviewView.swift`         | Remaining                                                                                         |
| `Sources/NativeConsentView.swift`         | Remaining                                                                                         |
| `Sources/NativeSignInButtons.swift`       | Ported. Apple and Google buttons and the email divider.                                           |
| `Sources/NativeSignupView.swift`          | Remaining                                                                                         |
| `Sources/NavigationChrome.swift`          | Ported in part. Bottom tray. The collection action menu remains.                                  |
| `Sources/PassportBrowseControls.swift`    | Remaining                                                                                         |
| `Sources/PeopleView.swift`                | Remaining                                                                                         |
| `Sources/QRScannerView.swift`             | Remaining                                                                                         |
| `Sources/ReceiveView.swift`               | Remaining                                                                                         |
| `Sources/RefreshSkyView.swift`            | Remaining                                                                                         |
| `Sources/RootView.swift`                  | Ported in part. Four-tab shell with Home first. Sheets and the other panes' full contents remain. |
| `Sources/SampleSyncBanner.swift`          | Remaining                                                                                         |
| `Sources/ShareCredentialPicker.swift`     | Remaining                                                                                         |
| `Sources/ShareCredentialsView.swift`      | Remaining                                                                                         |
| `Sources/SignupSelectionSheets.swift`     | Remaining                                                                                         |
| `Sources/SkillsView.swift`                | Remaining                                                                                         |
| `Sources/SkyAtmosphere.swift`             | Remaining                                                                                         |
| `Sources/SkyRefreshReviewView.swift`      | Remaining                                                                                         |
| `Sources/SkyVisitors.swift`               | Remaining                                                                                         |
| `Sources/StagingResetView.swift`          | Remaining                                                                                         |
| `Sources/SystemNativeSignInClient.swift`  | Remaining                                                                                         |

## NativeCore

| Area                                                                                               | Status                               |
| -------------------------------------------------------------------------------------------------- | ------------------------------------ |
| KeychainVault, AccountStorageScope, signup/reset slot keys                                         | Ported as `KeystoreVault`            |
| AccountBridge native message ops for share, signup journal, and reset receipt                      | Ported                               |
| AccountRuntime `LearnCardAccount.call` and signed-out command envelopes                            | Ported on QuickJS                    |
| WebKit host, DIDKit WASM, live Firebase, and network transport                                     | Remaining                            |
| Credential category resolution and latest-five deck selection                                      | Ported for Home fixtures             |
| Demo credential and installed-app fixtures used by Home                                            | Ported for the default demo snapshot |
| Auth coordinator, signup completion, staging reset, claims, inbox, apps, families, learner, career | Remaining                            |

## Suggested next slices

1. Passport list, empty state, and category fixtures.
2. Inbox offers and the claim review sheet.
3. Full signup (backup, profile, approval) on the fixture controller.
4. Live account host: Firebase session, encrypted share slots, and the real `initialize` command.
5. Apps catalog, consent, and the in-app browser.
6. Credential detail, share, and the create/send builder.

UITests other than the sign-in and home cases mirrored in `FoundationScreenTest` stay remaining with the screens they cover.
