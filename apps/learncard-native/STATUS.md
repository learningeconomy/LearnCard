# Native experiment handoff — 2026-10-13

**Resumed: native Families and visual refinement.** The user authorized autonomous progress while away. The first Families slice is implemented and locally verified; child-account creation/switching and guardian approval remain separate work.

- Branch: `codex/vesper-73`.
- Checkout: `/Users/donny/.codex/worktrees/vesper-73/LearnCard`.
- Previous Apps implementation: `10141da123da851425e3571a3bae53b4964eabcf`, with [passing CI](https://github.com/learningeconomy/LearnCard/actions/runs/38412284027).
- Current suite: 69 Bun cases, 43 Swift cases, 30 full simulator tests plus one opt-in live exchange intentionally skipped. Full account/lifecycle/interoperability and final Colorful screen checks are recorded in [TESTING.md](TESTING.md). Fresh branch CI runs on push; match its source commit before treating it as final evidence.

The earlier manual-review pause is superseded by the user's request to continue. Use this checkout and preserve unrelated primary-checkout work.

## What is ready to review

The app connects to the approved staging test account through Firebase email-code sign-in, existing account recovery and Keychain storage. Personal credentials live in Collection; reusable creations live in Home. The plus menu supports creation, sending an existing creation and sharing selected credentials.

Consumer Apps now includes My apps/Discover, real catalog metadata and artwork, search/category filters, listing details, installation/removal, native agreement review and an in-app browser. Account → Data Sharing opens native agreements and owned shared links. Account → Language supports English, Spanish, French and Arabic, including RTL and pluralization for the new flows.

Families is reachable from Home, Account and Apps. It includes roster/profile views, creation, name/motto/color editing and existing-account guardian invitations. It reuses web Family memberships, PINs, claim hooks and encrypted personal indexing. Generic creation/send screens exclude family templates so they cannot bypass invitation review. See [FAMILIES_INTEGRATION.md](FAMILIES_INTEGRATION.md).

The default web **Colorful** theme is the design source, as clarified by the user. Solid blue Collection, violet Inbox, cyan Apps, green Families and pink Home canvases contrast with opaque white/dark panels. Original categories survive the account adapter: blue badges/IDs, pink achievements, green studies, yellow portfolio, violet assistance, cyan experiences and amber Families. Collection cards have colorful artwork sections and white/dark text bodies; featured cards have a surface border and distinct stacked layers. The neutral comparison and stronger backdrop references are saved with exact prompts in [the Colorful brief](design/COLORFUL_BRIEF.md).

The tray indicator, press feedback and family entrances add restrained motion. The real mosaic logo and approved outlined icon shapes are preserved, with flat Colorful details replacing gradient icon fills. Families has four-locale copy; compact nav captions use explicit keys while page/VoiceOver labels retain canonical full translations.

The app browser is separate from the account SDK. Embedded partner apps support the existing handshake, approved identity requests, listed-contract consent and supported listing-scoped app events. Unsupported actions return an explicit error. Direct/web-only launches use the same in-app browser without the partner bridge. Browser sessions close on account background/lock. See [Apps integration](APPS_INTEGRATION.md) for exact boundaries.

## Installed simulator build

The previous Apps build is installed on **LearnCard Native Lab**, with existing account access preserved. Replace it with the newly verified Families build using the run command below; tests use a separate simulator and do not change this account.

Open Simulator, select **LearnCard Native Lab**, and open **LearnCard Lab**. This is the review simulator (`ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E`); the automated UI checks use a separate simulator.

To rebuild and open it later, run from this checkout:

```bash
LC_NATIVE_SIMULATOR_ID=ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E \
  bash apps/learncard-native/scripts/run-ios.sh
```

For a DEBUG review starting directly at Families, append `--review-families`. It opens the native screen and reads account-backed metadata; it does not create a family or send invitations automatically.

The existing ignored local configuration retains the approved test email. A fresh checkout requires its own test-login configuration; see [README](README.md). The CI build configuration uses a non-deliverable test address and should not replace the live review configuration.

## Manual review focus

1. Solid page colors and Collection cards in light/dark mode; subtle motion and the edge-to-edge tray.
2. Home/Account/Apps → Families: overview, compact roster, profile detail, creation/editing and guardian access review. Sample mode uses PIN `12345` and sends no actual invitations.
3. Apps discovery/browser and native Data Sharing after the new navigation entry; app uninstall and agreement withdrawal remain distinct.
4. Language selection, Arabic direction and full versus compact navigation labels; background/reopen and sign-out.
5. Dedicated staging family setup/PIN/invitation/edit validation remains necessary. Do not assume sample or protocol cases mutated the real account.

Read-only live checks already confirmed account recovery/resumption, collection/incoming offers, staging catalog artwork/promotion flags, the empty installed list, and existing agreements/shared-link metadata. The agent has **not** installed an app, published or withdrawn consent, sent a credential, copied a protected link or revoked a link on this live account. Automated mutation tests use synthetic boundaries. Real staging mutations and app-by-app partner compatibility remain to be validated with dedicated test data.

## Remaining work after review

- Apply manual design feedback, including consistent header/chrome behavior across tabs.
- Validate real app installation, consent, withdrawal and supported partner actions; physical-device behavior and web sign-in continuity still need review.
- Complete localization of older builder/recovery/dashboard screens and review translations with native speakers.
- Implement native **AI career Pathways** (`/ai/pathways`). The user clarified this feature; the newer Journeys (`/pathways`) scope remains unconfirmed.
- Continue Families with child-account bootstrap/switching and guardian approval; follow [the next-phase design and regression gate](FAMILIES_NEXT_PHASE.md). AI Sessions/learner-context synchronization remains separate. Existing server gates remain authoritative.
- Keep résumé builder web-only in the in-app browser. Store/admin/developer/publisher portals remain excluded.
- Complete account-management parity and outstanding live artwork-upload, managed-delivery, sharing and profile-update validation recorded in [account integration](ACCOUNT_INTEGRATION.md).

Anonymous/redacted consent, advanced contract flows and deferred partner actions remain unsupported; do not treat a full signed credential as anonymized. The new native UI does not imply complete web feature parity.

## Reference map

- [Product and implementation plan](PLAN.md)
- [Consumer Apps contracts and limitations](APPS_INTEGRATION.md)
- [Families contracts and limitations](FAMILIES_INTEGRATION.md)
- [Child-account phase and lifecycle gates](FAMILIES_NEXT_PHASE.md)
- [Account integration evidence and outstanding cases](ACCOUNT_INTEGRATION.md)
- [Regression coverage and commands](TESTING.md)
- [Consumer design brief](design/CONSUMER_APPS_BRIEF.md)
- Obsidian: `Codex Notes/LearnCard/2026-10-13-native-consumer-apps.md`
- DualMem: project checkpoint `Native Families and visual refinement`
