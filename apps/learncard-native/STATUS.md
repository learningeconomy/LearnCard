# Native experiment handoff — 2026-10-14

The user resumed development on October 14. The drawn shell now uses matching outlined tray icons, a thin underline, stronger native typography, larger artwork/navigation and a painted mosaic/scrolling wordmark. Inbox adds account-backed connection requests, connection updates and explicit server-driven suggestions. The first Families slice remains implemented; child-account switching and guardian approval are separate work. The full local 170-case suite passed with 10 independent iOS interoperability checks and Release compilation; the later scale/brand refinements passed focused title/search/large-text, connection, French/Arabic, scrolling-header and dark-mode checks. The final review installation and hosted CI are recorded separately below.

- Branch: `codex/vesper-73`.
- Checkout: `/Users/donny/.codex/worktrees/vesper-73/LearnCard`.
- Previous Apps implementation: `10141da123da851425e3571a3bae53b4964eabcf`, with [passing CI](https://github.com/learningeconomy/LearnCard/actions/runs/38412284027).
- Families/Colorful baseline: `a0321e78c`, with [passing CI](https://github.com/learningeconomy/LearnCard/actions/runs/38496224004). The prior `77efd4fd9` touch-card [hosted run failed](https://github.com/learningeconomy/LearnCard/actions/runs/38517841840); no cause is attributed from the abbreviated log, and artifact retrieval timed out. That interaction is now replaced. The workflow prints simulator summaries even after failure so future assertions are visible in the log.
- Current suite: 83 Bun cases, 51 Swift cases, 36 simulator tests plus one opt-in live exchange intentionally skipped. Full account/lifecycle/interoperability and visual checks are recorded in [TESTING.md](TESTING.md). Fresh branch CI runs on push; match its source commit before treating it as final evidence.
- Local full suite passed all 142 cases and verified 10 iOS outputs, followed by eight focused stronger-backdrop title/language/dark/Families checks and final Release compilation. Commit hooks passed after replacing untyped test fixtures with explicit fixture types; hooks/baselines were not bypassed.
- The October 14 neutral-canvas/interactive-card follow-up passed five focused simulator checks, native source-contract validation and Release compilation. Light Collection and dark detail/share screenshots were inspected. This does not imply a new local full 144-case run.
- The drawn-shell/automatic-motion revision passed the full local **146-case** suite (69 Bun, 43 Swift, 34 simulator; one opt-in live skip) and independent verification of 10 iOS outputs. Result bundle: `artifacts/native-regressions-20261014-021459-27510.xcresult`. Inbox, search results/empty and dark detail screenshots were inspected. This is functional/visual review, not pixel-diff testing or iPad validation.

Both earlier pauses are superseded by the user's request to continue. Builds use two compiler jobs at reduced priority; direct UI tests default to the dedicated checks simulator. Use this checkout and preserve unrelated primary-checkout work.

- Resumed Inbox source passed the full local **170-case** suite (83 Bun, 51 Swift, 36 simulator; one live skip), source contracts, 10 independent SDK output checks and Release compilation. Result: `artifacts/native-regressions-20261014-155632-36714.xcresult`. The final scale/painted-mark/smiley refinements were checked with focused simulator runs, not a second full local run; see [TESTING.md](TESTING.md).

## What is ready to review

The app connects to the approved staging test account through Firebase email-code sign-in, existing account recovery and Keychain storage. Personal credentials live in Collection; reusable creations live in Home. The plus menu supports creation, sending an existing creation and sharing selected credentials.

Consumer Apps now includes My apps/Discover, real catalog metadata and artwork, search/category filters, listing details, installation/removal, native agreement review and an in-app browser. Account → Data Sharing opens native agreements and owned shared links. Account → Language supports English, Spanish, French and Arabic, including RTL and pluralization for the new flows.

Families is reachable from Home, Account and Apps. It includes roster/profile views, creation, name/motto/color editing and existing-account guardian invitations. It reuses web Family memberships, PINs, claim hooks and encrypted personal indexing. Generic creation/send screens exclude family templates so they cannot bypass invitation review. See [FAMILIES_INTEGRATION.md](FAMILIES_INTEGRATION.md).

The default web **Colorful** theme is the design source, as clarified by the user. The October 14 review rejected strong page colors: Collection, Inbox, Apps, Home and Families use neutral gray-white/charcoal canvases with opaque white/dark panels. Original categories survive the account adapter: blue badges/IDs, pink achievements, green studies, yellow portfolio, violet assistance, cyan experiences and amber Families. Collection defaults to artwork-led rows on phones/accessibility sizes; regular-width browsing retains tiles. The featured Collection card keeps its distinct stack. Search hides that featured section, includes every match, shows filtering feedback and a vector illustrated empty/reset state. Search covers loaded credentials; Search more checks the next page. See [the drawn-shell brief](design/DRAWN_SHELL_BRIEF.md).

All four tabs share an experimental soft painted-square mosaic without ink outlines and left-aligned LearnCard wordmark, which recedes to the mark on scroll, plus the action/account island. The user explicitly authorized this brand exploration after finding the implementation too small/timid. Intro/loading logo animation remains deferred. The create control has a clear navy plus on one blue tile; missing/failed profile photos use a round yellow winking face. Inbox has a compact envelope introduction and colorful artwork tiles/list accents, with real credential graphics preserved. Connection requests and notices use person-led rows, distinct action states, and a native illustrated Connect/Not now prompt. See [Inbox integration](INBOX_INTEGRATION.md) for server contracts, count semantics and deferred notification workflows. Avatar, Inbox and empty-search illustrations are editable light/dark SVGs. New Inbox/search copy has four-locale translations.

The new drawn passport/envelope/diagonal rocket/path icons and thin tray underline match the approved concept more closely. Bolder 38-point headings and 18-point row titles scale with Dynamic Type; larger artwork windows and tray icons give the composition more presence. The tray indicator, press feedback and family entrances add restrained motion. Credential details use a gentle automatic eight-second tilt loop with faint reflection, without stack layers, a disclosure arrow or a hold hint. Swipes scroll normally. Offscreen/background, Reduce Motion and VoiceOver pause the animation. Families has four-locale copy; compact nav captions use explicit keys while page/VoiceOver labels retain canonical full translations.

The app browser is separate from the account SDK. Embedded partner apps support the existing handshake, approved identity requests, listed-contract consent and supported listing-scoped app events. Unsupported actions return an explicit error. Direct/web-only launches use the same in-app browser without the partner bridge. Browser sessions close on account background/lock. See [Apps integration](APPS_INTEGRATION.md) for exact boundaries.

## Installed simulator build

The final painted-mark/wordmark/smiley build is installed and running on **LearnCard Native Lab**. The executable, asset catalog, account SDK and private review configuration match the Debug build by SHA-256 comparisons. Existing account access resumed and read-only Collection shows 30+ credentials with three pending offers. The agent did not claim/send credentials or act on live connections/prompts. Direct native pointer navigation could not be completed through the current desktop automation bridge, so new live notification actions remain a manual validation item. Tests run on the separate checks simulator, and the private review configuration was preserved/restored around the CI script.

Final Release compilation passed. The fuller Inbox source passed 170 local cases and independent verification of 10 iOS outputs; subsequent visual changes passed focused checks, including the final collapsing-wordmark regression and dark sharing. New hosted CI runs on push; verify its source SHA before reporting final hosted results.

Open Simulator, select **LearnCard Native Lab**, and open **LearnCard Lab**. This is the review simulator (`ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E`); the automated UI checks use a separate simulator.

To rebuild and open it later, run from this checkout:

```bash
LC_NATIVE_SIMULATOR_ID=ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E \
  bash apps/learncard-native/scripts/run-ios.sh
```

For a DEBUG review starting directly at Families, append `--review-families`. It opens the native screen and reads account-backed metadata; it does not create a family or send invitations automatically.

The existing ignored local configuration retains the approved test email. A fresh checkout requires its own test-login configuration; see [README](README.md). The CI build configuration uses a non-deliverable test address and should not replace the live review configuration.

## Manual review focus

1. Larger type/artwork/nav, soft painted mark and collapsing left wordmark on all four tabs; readable plus and round winking avatar fallback. Review phone Collection rows, Inbox accents, search results/empty/reset behavior and partial-result pagination. Details have an automatic isolated-card tilt; check scrolling and Reduce Motion too.
2. Home/Account/Apps → Families: overview, compact roster, profile detail, creation/editing and guardian access review. Sample mode uses PIN `12345` and sends no actual invitations.
3. Apps discovery/browser and native Data Sharing after the new navigation entry; app uninstall and agreement withdrawal remain distinct.
4. Language selection, Arabic direction and full versus compact navigation labels; background/reopen and sign-out.
5. Dedicated staging family setup/PIN/invitation/edit validation remains necessary. Do not assume sample or protocol cases mutated the real account.

Read-only live checks already confirmed account recovery/resumption, collection/incoming offers, staging catalog artwork/promotion flags, the empty installed list, and existing agreements/shared-link metadata. The agent has **not** installed an app, published or withdrawn consent, sent a credential, copied a protected link or revoked a link on this live account. Automated mutation tests use synthetic boundaries. Real staging mutations and app-by-app partner compatibility remain to be validated with dedicated test data.

## Remaining work after review

- Apply manual design feedback, including consistent header/chrome behavior across tabs.
- Review the new drawn tray icons, compact typography/rows, search and connection prompt presentation.
- Validate real staging notification pagination, accepting/dismissing requests and server-created prompts with dedicated accounts. Specialized guardian/device/partner notification actions and push delivery remain separate; ordinary updates are readable/dismissible.
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
- [Inbox connections and prompt contracts](INBOX_INTEGRATION.md)
- [Families contracts and limitations](FAMILIES_INTEGRATION.md)
- [Child-account phase and lifecycle gates](FAMILIES_NEXT_PHASE.md)
- [Account integration evidence and outstanding cases](ACCOUNT_INTEGRATION.md)
- [Regression coverage and commands](TESTING.md)
- [Consumer design brief](design/CONSUMER_APPS_BRIEF.md)
- [Current Colorful direction and exact image-generation prompts](design/COLORFUL_BRIEF.md)
- [Drawn shell, lists, search and SVG sources](design/DRAWN_SHELL_BRIEF.md)
- Obsidian: `Codex Notes/LearnCard/2026-10-13-native-consumer-apps.md`
- Obsidian: `Codex Notes/LearnCard/2026-10-13-native-families.md`
- DualMem: project checkpoint `Native Families and visual refinement`
