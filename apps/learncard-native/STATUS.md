# Native experiment handoff — 2026-10-15

The approved Account/Data Sharing, Apps and Families designs are implemented with editable drawn SVG icons, compact grouped rows and family smiley illustrations. Credential details now start a visible automatic tilt and sheen on arrival. The header keeps a fixed left logo/label slot, crossfading LearnCard into the section name, with a tighter action/profile pill. Neutral page canvases remain.

- Branch: `codex/vesper-73`.
- Checkout: `/Users/donny/.codex/worktrees/vesper-73/LearnCard`; preserve unrelated primary-checkout work.
- Baseline `c3db8563b` passed [hosted CI 38638878502](https://github.com/learningeconomy/LearnCard/actions/runs/38638878502), including 171 cases, 10 independent iOS output checks and Release compilation. That baseline is distinct from this implementation's fresh branch CI.
- Current suite: **174 cases** — 84 Bun, 51 Swift and 39 simulator cases, plus one intentionally skipped live exchange.
- Full local run passed all 174 cases, source contracts, independent verification of 10 iOS outputs and Release compilation. Result: `artifacts/native-regressions-20261015-014409-23844.xcresult`. A final five-digit PIN input cap and formatting cleanup then passed three focused dark-mode Account/Data Sharing/invitation checks in `artifacts/approved-design-dark-final.xcresult`. See [TESTING.md](TESTING.md) for exact evidence and boundaries.
- Builds use two jobs at reduced priority; shared DerivedData operations remain sequential. Automated tests use the separate checks simulator, and private review configuration is preserved/restored around the CI script.

## What is ready to review

The app connects to the approved staging test account through Firebase email-code sign-in, existing account recovery and Keychain storage. Personal credentials live in Collection; reusable creations live in Home. The plus menu supports creation, sending an existing creation and sharing selected credentials.

Consumer Apps now includes My apps/Discover, real catalog metadata and artwork, search/category filters, listing details, installation/removal, native agreement review and an in-app browser. Account → Data Sharing opens native agreements and owned shared links. Account → Language supports English, Spanish, French and Arabic, including RTL and pluralization for the new flows.

Families is reachable from Home, Account and Apps. It includes roster/profile views, creation, name/motto/color editing and existing-account guardian invitations. It reuses web Family memberships, PINs, claim hooks and encrypted personal indexing. Generic creation/send screens exclude family templates so they cannot bypass invitation review. See [FAMILIES_INTEGRATION.md](FAMILIES_INTEGRATION.md).

The default web **Colorful** theme is the design source, as clarified by the user. The October 14 review rejected strong page colors: Collection, Inbox, Apps, Home and Families use neutral gray-white/charcoal canvases with opaque white/dark panels. Original categories survive the account adapter: blue badges/IDs, pink achievements, green studies, yellow portfolio, violet assistance, cyan experiences and amber Families. Collection defaults to artwork-led rows on phones/accessibility sizes; regular-width browsing retains tiles. The featured Collection card keeps its distinct stack. Search hides that featured section, includes every match, shows filtering feedback and a vector illustrated empty/reset state. Search covers loaded credentials; Search more checks the next page. See [the drawn-shell brief](design/DRAWN_SHELL_BRIEF.md).

All four tabs share an experimental soft painted-square mosaic without ink outlines and left-aligned LearnCard wordmark, which crossfades to the section title in the same fixed left slot on scroll, plus the compact action/account island. The user explicitly authorized this brand exploration after finding the implementation too small/timid. Intro/loading logo animation remains deferred. The create control has a clear navy plus on one blue tile; missing/failed profile photos use a round yellow winking face. Inbox has a compact envelope introduction and colorful artwork tiles/list accents, with real credential graphics preserved. Connection requests and notices use person-led rows, distinct action states, and a native illustrated Connect/Not now prompt. See [Inbox integration](INBOX_INTEGRATION.md) for server contracts, count semantics and deferred notification workflows. Avatar, Inbox and empty-search illustrations are editable light/dark SVGs. New Inbox/search copy has four-locale translations.

The new drawn passport/envelope/diagonal rocket/path icons and thin tray underline match the approved concept more closely. Bolder 38-point headings and 18-point row titles scale with Dynamic Type; larger artwork windows and tray icons give the composition more presence. The tray indicator, press feedback and family entrances add restrained motion. Credential details start a gentle automatic nine-second tilt loop on appearance, with a moving diagonal reflection, without stack layers, a disclosure arrow or a hold hint. Swipes scroll normally. Offscreen/background, Reduce Motion and VoiceOver pause the animation. Families has four-locale copy; compact nav captions use explicit keys while page/VoiceOver labels retain canonical full translations.

The app browser is separate from the account SDK. Embedded partner apps support the existing handshake, approved identity requests, listed-contract consent and supported listing-scoped app events. Unsupported actions return an explicit error. Direct/web-only launches use the same in-app browser without the partner bridge. Browser sessions close on account background/lock. See [Apps integration](APPS_INTEGRATION.md) for exact boundaries.

## Installed simulator build

The approved Account/Apps/Families and automatic-motion build is installed and running on **LearnCard Native Lab**. The executable, Debug dylib, asset catalog, account SDK and private review configuration match the final Debug build by SHA-256 comparisons. The existing account/profile resumed; live credential loading is read-only. The agent did not claim/send credentials or act on live connections, family invitations, consent or shared links. Those real-account mutations remain manual validation items. Tests use the separate checks simulator, which is shut down after checks; private review configuration was preserved/restored around the CI script.

The full 174-case local run, independent verification of 10 iOS outputs and Release compilation passed. Final PIN/contrast refinements have focused dark-mode evidence. New hosted CI runs on push; verify its source SHA before reporting final hosted results.

Open Simulator, select **LearnCard Native Lab**, and open **LearnCard Lab**. This is the review simulator (`ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E`); the automated UI checks use a separate simulator.

To rebuild and open it later, run from this checkout:

```bash
LC_NATIVE_SIMULATOR_ID=ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E \
  bash apps/learncard-native/scripts/run-ios.sh
```

For a DEBUG review starting directly at Families, append `--review-families`. It opens the native screen and reads account-backed metadata; it does not create a family or send invitations automatically.

The existing ignored local configuration retains the approved test email. A fresh checkout requires its own test-login configuration; see [README](README.md). The CI build configuration uses a non-deliverable test address and should not replace the live review configuration.

## Manual review focus

The user approved the three generated Account/Data Sharing, Apps and Families boards on October 15. Native layouts now use this direction with actual account/catalog/permission data. Account has grouped drawn icon rows, Data Sharing an illustrated intro and permission tiles, My apps direct Open actions, and Families a constellation/roster plus separate guardian selection and access/PIN review. See [boards, exact prompts and implementation mapping](design/WHIMSY_EXPANSION_BRIEF.md).

1. Larger type/artwork/nav, soft painted mark and stable left wordmark/section-title crossfade on all four tabs; readable plus and round winking avatar fallback. Review phone Collection rows, Inbox accents, search results/empty/reset behavior and partial-result pagination. Details have an automatic isolated-card tilt; check scrolling and Reduce Motion too.
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
- [Additional Account, Apps and Families concept boards](design/WHIMSY_EXPANSION_BRIEF.md)
- Obsidian: `Codex Notes/LearnCard/2026-10-13-native-consumer-apps.md`
- Obsidian: `Codex Notes/LearnCard/2026-10-13-native-families.md`
- Obsidian: `Codex Notes/LearnCard/2026-10-15-native-approved-design-and-motion.md`
- DualMem: project checkpoint `Native Families and visual refinement`

The October 14 protocol follow-up handles legacy sender strings: a staging did:web username is decoded and resolved through current pending membership; a same-named identity from another network cannot accept a local request. This adds one case (84 Bun, 51 Swift, 36 simulator = 171 cases at that baseline). The recorded full local 170-case run predates this final case; focused protocol/source-contract checks cover the change.
