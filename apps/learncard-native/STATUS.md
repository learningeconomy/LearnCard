# Native experiment handoff — 2026-10-13

**Paused for manual review at the user's request.** Resume with their review feedback before starting another implementation phase.

- Branch: `codex/vesper-73`.
- Checkout: `/Users/donny/.codex/worktrees/vesper-73/LearnCard`.
- Latest implementation commit: `10141da123da851425e3571a3bae53b4964eabcf`.
- [Passing CI for that implementation](https://github.com/learningeconomy/LearnCard/actions/runs/38412284027): 108 cases passed (47 Bun, 36 Swift, 25 simulator), one opt-in live exchange intentionally skipped, 10 iOS credential/crypto outputs independently verified with the web SDK, and Release compilation passed.

Later documentation commits do not change the tested implementation. CI runs on branch pushes, so check the commit associated with a run when comparing results.

## What is ready to review

The app connects to the approved staging test account through Firebase email-code sign-in, existing account recovery and Keychain storage. Personal credentials live in Collection; reusable creations live in Home. The plus menu supports creation, sending an existing creation and sharing selected credentials.

Consumer Apps now includes My apps/Discover, real catalog metadata and artwork, search/category filters, listing details, installation/removal, native agreement review and an in-app browser. Account → Data Sharing opens native agreements and owned shared links. Account → Language supports English, Spanish, French and Arabic, including RTL and pluralization for the new flows.

The app browser is separate from the account SDK. Embedded partner apps support the existing handshake, approved identity requests, listed-contract consent and supported listing-scoped app events. Unsupported actions return an explicit error. Direct/web-only launches use the same in-app browser without the partner bridge. Browser sessions close on account background/lock. See [Apps integration](APPS_INTEGRATION.md) for exact boundaries.

## Installed simulator build

The final Debug executable and account SDK bundle were installed on **LearnCard Native Lab**, and their hashes matched the final build. Existing account access was preserved. The Mac was locked, so the app UI was not reopened after that installation.

Open Simulator, select **LearnCard Native Lab**, and open **LearnCard Lab**. This is the review simulator (`ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E`); the automated UI checks use a separate simulator.

To rebuild and open it later, run from this checkout:

```bash
LC_NATIVE_SIMULATOR_ID=ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E \
  bash apps/learncard-native/scripts/run-ios.sh
```

The existing ignored local configuration retains the approved test email. A fresh checkout requires its own test-login configuration; see [README](README.md). The CI build configuration uses a non-deliverable test address and should not replace the live review configuration.

## Manual review focus

1. Collection/Inbox/Home: titles, artwork loading, cards, navigation tray and account-sheet spacing.
2. Apps: My apps versus Discover, search/categories, listing details and browser loading/fallback behavior.
3. Native agreement review: visible recipients and permissions, optional access starting off, and explicit credential selection. Removing an app and withdrawing its agreement are separate actions.
4. Account → Data Sharing: agreement details and existing shared-link status; review the interface before changing live access.
5. Language selection and Arabic layout; background and reopen the app to check account resumption and browser closure.

Read-only live checks already confirmed account recovery/resumption, collection/incoming offers, staging catalog artwork/promotion flags, the empty installed list, and existing agreements/shared-link metadata. The agent has **not** installed an app, published or withdrawn consent, sent a credential, copied a protected link or revoked a link on this live account. Automated mutation tests use synthetic boundaries. Real staging mutations and app-by-app partner compatibility remain to be validated with dedicated test data.

## Remaining work after review

- Apply manual design feedback, including consistent header/chrome behavior across tabs.
- Validate real app installation, consent, withdrawal and supported partner actions; physical-device behavior and web sign-in continuity still need review.
- Complete localization of older builder/recovery/dashboard screens and review translations with native speakers.
- Implement native **AI career Pathways** (`/ai/pathways`). The user clarified this feature; the newer Journeys (`/pathways`) scope remains unconfirmed.
- Tackle Families/guardian approval and AI Sessions/learner-context synchronization separately. Existing server gates remain authoritative.
- Keep résumé builder web-only in the in-app browser. Store/admin/developer/publisher portals remain excluded.
- Complete account-management parity and outstanding live artwork-upload, managed-delivery, sharing and profile-update validation recorded in [account integration](ACCOUNT_INTEGRATION.md).

Anonymous/redacted consent, advanced contract flows and deferred partner actions remain unsupported; do not treat a full signed credential as anonymized. The new native UI does not imply complete web feature parity.

## Reference map

- [Product and implementation plan](PLAN.md)
- [Consumer Apps contracts and limitations](APPS_INTEGRATION.md)
- [Account integration evidence and outstanding cases](ACCOUNT_INTEGRATION.md)
- [Regression coverage and commands](TESTING.md)
- [Consumer design brief](design/CONSUMER_APPS_BRIEF.md)
- Obsidian: `Codex Notes/LearnCard/2026-10-13-native-consumer-apps.md`
- DualMem: project checkpoint `Native consumer Apps`, paused for manual review
