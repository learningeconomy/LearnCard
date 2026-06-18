# i18n Phase 2 Coverage Report

**Branch**: `feat/lc-1831-paraglide-exploration` (PR #1266)  
**Companion**: `dispatch/lc-1831-i18n-poc` (PR #1255)  
**Date**: 2026-06-03  
**Total leaf keys**: 850  
**Locales**: en, es, fr, ar _(final shipping list — English, French, Spanish, Arabic; German/Korean removed)_

## Key Statistics

| Namespace       | Keys | Components Converted                                                  |
| --------------- | ---- | --------------------------------------------------------------------- |
| `sidemenu.*`    | 29   | SideMenu, SideMenuRootLinks, SideMenuFooter                           |
| `passport.*`    | 12   | PassportPage                                                          |
| `launchpad.*`   | 26   | LaunchPad, LaunchPadHeader                                            |
| `wallet.*`      | 28   | WalletPage, WalletPageSquare                                          |
| `theme.*`       | 6    | ThemePicker                                                           |
| `language.*`    | 7    | LanguagePicker                                                        |
| `login.*`       | 83   | LoginPage, LoginPageLoader, SeedPhrase, Email, Phone                  |
| `onboarding.*`  | 117  | OnboardingContainer, OnboardingNetworkForm, Slides, Consent           |
| `profile.*`     | 79   | UserProfileUpdateForm, UserContact*, UserOptions*, UserProfileSetup   |
| `settings.*`    | 35   | PrivacySettingsPage, PrivacySettingsModal, PushNotifications\*        |
| `contacts.*`    | 58   | AddressBookContactItem, AddContactView, ContactOptions, Header, QR    |
| `consentFlow.*` | 64   | ConsentFlowConfirmation, ConsentFlowError, PrivacyAndData, ShareCards |
| `recovery.*`    | 62   | RecoverySetupModal, RecoveryFlowModal                                 |
| `alerts.*`      | 28   | Notification cards (partial)                                          |
| `boost.*`       | 42   | BoostClaimCard                                                        |
| `ai.*`          | 25   | JSON keys only (component conversion Phase 3)                         |
| `pathways.*`    | 28   | JSON keys only (component conversion Phase 3)                         |
| `scanner.*`     | 11   | JSON keys only                                                        |
| `share.*`       | 8    | JSON keys only                                                        |
| `issue.*`       | 20   | IssuanceList, IssuanceDetailModal (from LC-1862)                      |
| `error.*`       | 7    | JSON keys only                                                        |
| `legal.*`       | 6    | JSON keys only                                                        |
| `family.*`      | 6    | JSON keys only                                                        |
| `membership.*`  | 6    | JSON keys only                                                        |

## Conversion Status

### Fully Converted (components wrapped on BOTH branches)

-   Side menu + footer + links
-   Passport page
-   LaunchPad + header
-   Wallet page + category constants
-   Theme picker
-   Language picker
-   Login page (all auth methods + seed phrase + QR)
-   Onboarding (roles, profile, consent flows, slides)
-   User profile form + contact management
-   User options (delete, export seed, seed modal)
-   Privacy settings (page + modal)
-   Push notification settings + prompt
-   Contacts (contact item, add contact, contact options, header, QR)
-   Boost claim card
-   ConsentFlow (confirmation, error, privacy & data)
-   Recovery (setup + flow modals)
-   Notification cards (guardian approval, boost, connection request)

### JSON Keys Only (component conversion deferred to Phase 3)

-   AI sessions/insights/pathways
-   Full boost management
-   Full wallet credential detail
-   Scanner/QR import
-   Share/invite links
-   Legal pages
-   Family management
-   Membership/network admin
-   Error dialogs (generic)

## What's Left for Phase 3

1. **Component conversion** for the ~200 remaining strings in JSON-only namespaces
2. **Machine-quality translations** for non-EN locales (currently EN placeholders for newer namespaces)
3. **Credential category titles** in `CredentialPage.tsx` config object (needs refactor for runtime lookup)
4. **Dynamic/conditional strings** in utility functions outside React components
5. **Toast messages** scattered across many components
6. **RTL testing** on real devices (Arabic)
7. **Longer-string overflow testing** (German, French)

## Build Verification

Both branches pass `vite build` cleanly:

-   `feat/lc-1831-paraglide-exploration` ✓
-   `dispatch/lc-1831-i18n-poc` ✓

JSON catalogs are byte-identical between branches for all 6 locales.
