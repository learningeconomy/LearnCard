# Native experiment handoff — 2026-10-16

**Development remains in `learningeconomy/LearnCard`, branch `codex/vesper-73`; native CI is now manual only.** Pushes and pull requests no longer start the macOS suite. Use the explicit dispatch command in [TESTING](TESTING.md) when a hosted run is wanted. The brief fork trial synced `goblincore/LearnCard2/main` and copied a snapshot, but the user decided its ongoing maintenance was unnecessary; local tracking/default push have been restored to `origin`. The fork snapshot is retained unused. Backend services and private local account configuration remain in place. The last creator hosted run [38735039249](https://github.com/learningeconomy/LearnCard/actions/runs/38735039249) was cancelled, not passed.

The latest refinement separates empty Collection/category states from empty typed searches. A new collection gets a bold drawn passport with working Scan/Create actions; empty categories use their own illustration, category copy and View all action. Incomplete pagination never claims the account is empty. The signup photo is one clearly tappable row, including its thumbnail, camera badge and whitespace. System launch and animated loading now share the textured mark, size/position and neutral light/dark canvas; a compiled-asset regression check catches the alpha error that exposed black. See [actual screens, clips and the concept](design/EMPTY_STATES_BRIEF.md) and [verification](TESTING.md).

Native first-time setup is implemented: editable email, birth date/country, name/available username/optional photo, separate privacy choices, and canonical password-protected recovery-backup enrollment before profile creation. Under-13 signup routes to Families; unapproved profiles stay in a server-backed waiting/resend/check state. Interrupted setup reuses its identity and reconciles writes. Staging cannot deliver new recovery email with its current relay settings, so signup uses saved encrypted backup confirmation while older email recovery remains available. See [the flow and remaining live gates](FIRST_TIME_SETUP.md) and [generated reference plus actual screens](design/SIGNUP_BRIEF.md).

The user selected **staging-only reset with the shared Firebase login retained** for the live signup check. The native Account screen now offers typed-email confirmation and resumable, UID-bound collection/profile/recovery cleanup. The old SDK is disposed before fresh setup; partial cleanup blocks Collection and never resumes destructive writes automatically. The signup-preferences API is now permitted by the restricted account transport. See [reset scope and live status](ACCOUNT_DELETION_AUDIT.md).

**Current live state:** the user continued the staging reset and completed birthday/country, profile/privacy and required encrypted-backup setup directly in the simulator. The new LearnCard profile is ready, the selected Firebase login is retained and account access is saved on the device. The new public identity resolves; the former profile's identity returns 404. Independent second-device backup recovery and full staging-web UI parity remain unverified; do not reset this account again or delete its shared Firebase login.

Home is now the initial signed-in destination, including after signup. The navigation tray reads **Home → Collection → Inbox → Apps**, with Home on the leading edge in Arabic. Stable destination identifiers preserve shortcuts and pending-claim routing. Continue reset uses an explicit adaptive label/fill color pair after the user reported an unreadable navy-on-navy button.

The account-access pass now brings sign-in, code entry, recovery and Recovery & security into the drawn system: blue winking passport, pink envelope/plane, smiling yellow key, substantial type and a fixed keyboard-aware action tray. Recovery methods use a designed bottom sheet, and copy distinguishes the email recovery key from the sign-in code. Existing account identity, Firebase/recovery/Keychain integration, scan handoff and painted waiting states remain. See [account contracts](ACCOUNT_ACCESS.md) and [reference/native screens](design/ACCOUNT_ACCESS_BRIEF.md). The separate DIDKit investigation is complete; this UI pass does not integrate its artifacts.

The mockup-fidelity follow-up adds the paper plane, rays/star/heart marks, integrated artwork/title editing and side-by-side recipient cards. Format and Category open designed illustrated **bottom selection sheets**, replacing the rejected system bubble. More details includes criteria links, supporting work, study/role/term, start/completion and expiry, with review and signed-credential parity. See [mapping and boundaries](CREDENTIAL_BUILDER.md) and [current native screenshots](design/CREDENTIAL_BUILDER_BRIEF.md).

Create now follows an illustrated Design → Recipient → Review flow: colorful live draft, drawn artwork, persistent field labels/limits, designed selector bottom sheets, smiley/face recipient choices and a fixed action tray. Keyboard scrolling, draft preservation, recipient cancellation and actual Arabic accessibility/dark presentation are covered. Existing artwork upload and create/send semantics remain. See [flow contracts](CREDENTIAL_BUILDER.md) and [generated reference plus native screenshots](design/CREDENTIAL_BUILDER_BRIEF.md).

Account launch/reconnect/lock and operation waits now use a native painted mosaic assembly, continuing subtle stop-motion tile poses, floating brand-colored accents and contextual status text. The final palette is more saturated following user feedback, with a lighter watercolor layer. Reduce Motion/VoiceOver use a still, fully assembled mark; no animation delays readiness. See [motion behavior](ACCOUNT_MOTION.md) and [storyboard/prompts](design/ACCOUNT_MOTION_BRIEF.md).

Edit profile now supports native photo selection, preview, replacement and removal. A selected photo stays local until Save Profile; name/bio-only saves preserve the existing picture. Bounded image preparation strips EXIF/GPS, while upload retry and lifecycle guards protect account state. See [profile-photo contracts](PROFILE_PHOTOS.md).

Latest issued is now an interactive stack of up to five actual recent credentials in the current category. Horizontal swipes toss the active card aside and lift the next; Newer/Older controls, position dots, tap-to-detail and bounded navigation make its purpose clear. Vertical scrolling, short-drag cancellation, category/search reset, RTL and Reduce Motion are covered. No credential is dismissed or deleted. See [recent-stack contracts](RECENT_STACK.md).

Share credentials now supports larger collections with multi-category and inclusive issue-date filters, sorting, title/issuer/description search, progressive paging and a fixed selection/review footer. Selected audits every explicit choice, including those hidden by filters. See [picker contracts](SHARING_PICKER.md). Native QR scanning, account recovery, Portfolio/Qualifications parity, the approved Home/drawn design, neutral canvas and automatic credential detail motion remain; see [scanner and claim contracts](QR_CLAIM_FLOW.md).

- Branch: `codex/vesper-73`.
- Checkout: `/Users/donny/.codex/worktrees/vesper-73/LearnCard`; preserve unrelated primary-checkout work.
- Home baseline `4dde77e13383394163bad3ddaa7131d0f6d0adc3` passed [hosted CI 38694796776](https://github.com/learningeconomy/LearnCard/actions/runs/38694796776). The subsequent category run [38700166174](https://github.com/learningeconomy/LearnCard/actions/runs/38700166174) passed 42 simulator cases and failed three; timing/gesture assertions are addressed in this follow-up and must pass new source-specific CI.
- Current configured suite: **375 cases** — 153 Bun, 131 Swift and 91 simulator cases, plus one intentionally skipped live exchange.
- The latest empty/launch/photo pass has 153 Bun, 131 Swift and 27 distinct focused simulator cases passing, plus source contracts. Seven new UI and two Swift cases are included automatically; this is targeted verification, not a full 375-case run. Compiled launch assets pass checks in Debug and Release, and actual light/dark cold-start clips confirm the corrected system canvas. See [evidence](TESTING.md) and [native screens/clips](design/EMPTY_STATES_BRIEF.md).
- The preceding full local Home-first run passed **all 366 cases**, with the one intentional live skip and no failures. Independent web-SDK verification passes ten iOS-issued signatures plus encryption/recovery/presentation outputs. The existing CLR full-verification exception remains identical on web and iOS. See [exact evidence](TESTING.md) and [actual light/dark native screens](design/HOME_ENTRY_BRIEF.md). Hosted CI remains manual and was not dispatched.
- The earlier reset checkpoint passed 153 Bun and 129 Swift cases, source contracts and 11 unique focused UI cases. That checkpoint was targeted verification, not a full local 364-case run; it is superseded by the full run above.
- First-time setup passes all 136 Bun and 119 Swift cases, source contracts, 15 focused canonical SSS backup cases and three existing web-policy cases. All nine signup UI cases and pending-claim integration pass in the final ten-case run; combined with the 13 passing existing account-access/lifecycle/motion cases, 23 unique focused UI cases pass. See [exact evidence](TESTING.md). This is targeted validation, not a full local 334-case run.
- Account access passed all 106 Swift and fifteen unique focused simulator cases, including account lifecycle, motion and pending-claim integration. Five new UI cases are discovered automatically; hosted CI remains manual. See [verification](TESTING.md).
- The mockup-fidelity/optional-detail follow-up passed all 114 Bun and 106 Swift cases, native source contracts and seven focused UI cases. Actual SDK signing preserves the new fields; calendar day boundaries and nested-key retry identity are covered. See [verification](TESTING.md).
- Credential-creator checks passed all 102 Swift cases, source contracts and six unique focused simulator cases; Debug/Release compilation passes. Account-runtime code is unchanged, and no live creation/upload was performed. See [verification](TESTING.md).
- Account-motion checks passed all 102 Swift cases and nine unique targeted UI cases, with final texture/color passes; account-runtime source remains unchanged from the preceding 110-case Bun pass. See [verification](TESTING.md).
- Profile-photo checks passed all 110 Bun and 95 Swift cases, source contracts and eight unique focused simulator cases. No real photo was uploaded; see [verification and manual gate](PROFILE_PHOTOS.md).
- Recent-stack checks passed all 85 Swift cases, five initial focused simulator cases, a two-case traversal/detail-motion pass and the final cancellation/scroll refinement. This is targeted UI validation, not a new local full 245-case run. Bun/runtime code is unchanged from the preceding passing sharing checks.
- Sharing-picker checks passed all 105 Bun and 80 Swift cases, source contracts and four focused simulator cases; actual accessibility/RTL modal inheritance received an additional visual/automated pass. This is targeted UI validation, not a new local full 237-case run. See [TESTING](TESTING.md).
- QR/claim checks passed all 102 Bun and 68 Swift cases and source/type contracts. Eleven initial simulator checks, a five-case refinement pass and a final ten-case claim/category/CI follow-up passed; exact evidence is in [TESTING.md](TESTING.md). This is targeted validation, not a new local full 219-case run.
- Builds use two jobs at reduced priority; shared DerivedData operations remain sequential. Automated tests use the separate checks simulator, and private review configuration is preserved/restored around the CI script.

## What is ready to review

The app connects to the approved staging test account through Firebase email-code sign-in, existing account recovery and Keychain storage. Personal credentials live in Collection; reusable creations live in Home. The header menu supports scanning, creation, sending an existing creation and sharing selected credentials. Scan is also available from Inbox/Home and before sign-in. A scan only opens review; adding requires confirmation. Known Family templates require their web access-review flow. Production links and other QR protocols get explicit explanations rather than arbitrary navigation.

Consumer Apps now includes My apps/Discover, real catalog metadata and artwork, search/category filters, listing details, installation/removal, native agreement review and an in-app browser. Account → Data Sharing opens native agreements and owned shared links. Account → Language supports English, Spanish, French and Arabic, including RTL and pluralization for the new flows.

Families is reachable from Home, Account and Apps. It includes roster/profile views, creation, name/motto/color editing and existing-account guardian invitations. It reuses web Family memberships, PINs, claim hooks and encrypted personal indexing. Generic creation/send screens exclude family templates so they cannot bypass invitation review. See [FAMILIES_INTEGRATION.md](FAMILIES_INTEGRATION.md).

The default web **Colorful** theme is the design source, as clarified by the user. The October 14 review rejected strong page colors: Collection, Inbox, Apps, Home and Families use neutral gray-white/charcoal canvases with opaque white/dark panels. Original categories survive the account adapter: blue badges/IDs, pink achievements, orange Qualifications, green studies, yellow portfolio, violet assistance, cyan experiences and amber Families. Collection filters include Badges, Achievements, Qualifications, Studies, Portfolio, Assistance, Experiences, IDs, Skills, AI Sessions, Pathways and Insights; unfamiliar partner categories keep their label under Other. Family records stay outside Collection without deleting or reindexing them. Filters cover loaded pages, with partial-result guidance and Load more; they do not claim account-wide search. Collection defaults to artwork-led rows on phones/accessibility sizes; regular-width browsing retains tiles. The featured Collection card keeps its distinct stack. Search hides that featured section, includes every match, shows filtering feedback and a vector illustrated empty/reset state. Search covers loaded credentials; Search more checks the next page. See [the drawn-shell brief](design/DRAWN_SHELL_BRIEF.md).

All four tabs share an experimental soft painted-square mosaic without ink outlines and left-aligned LearnCard wordmark, which crossfades to the section title in the same fixed left slot on scroll, plus the compact action/account island. The user explicitly authorized this brand exploration after finding the implementation too small/timid. The account intro/loading version now has assembling painted blocks, continuing stop-motion poses and floating accents; see [account motion](ACCOUNT_MOTION.md). The create control has a clear navy plus on one blue tile; missing/failed profile photos use a round yellow winking face. Inbox has a compact envelope introduction and colorful artwork tiles/list accents, with real credential graphics preserved. Connection requests and notices use person-led rows, distinct action states, and a native illustrated Connect/Not now prompt. See [Inbox integration](INBOX_INTEGRATION.md) for server contracts, count semantics and deferred notification workflows. Avatar, Inbox and empty-search illustrations are editable light/dark SVGs. New Inbox/search copy has four-locale translations.

The new drawn passport/envelope/diagonal rocket/path icons and thin tray underline match the approved concept more closely. Bolder 38-point headings and 18-point row titles scale with Dynamic Type; larger artwork windows and tray icons give the composition more presence. The tray indicator, press feedback and family entrances add restrained motion. Credential details start a gentle automatic nine-second tilt loop on appearance, with a moving diagonal reflection, without stack layers, a disclosure arrow or a hold hint. Swipes scroll normally. Offscreen/background, Reduce Motion and VoiceOver pause the animation. Families has four-locale copy; compact nav captions use explicit keys while page/VoiceOver labels retain canonical full translations.

The app browser is separate from the account SDK. Embedded partner apps support the existing handshake, approved identity requests, listed-contract consent and supported listing-scoped app events. Unsupported actions return an explicit error. Direct/web-only launches use the same in-app browser without the partner bridge. Browser sessions close on account background/lock. See [Apps integration](APPS_INTEGRATION.md) for exact boundaries.

## Installed simulator build

The **Collection empty-state / launch continuity / signup photo** build is installed on **LearnCard Native Lab**. Eleven SHA-256 comparisons match executable, Debug dylib, assets, account SDK, private review configuration, DIDKit WASM, signup policy, Info.plist and compiled launch storyboard (`artifacts/empty-launch-photo-install-proof.json`). DIDKit remains unchanged. Release compilation and Debug installation pass (`empty-launch-photo-release.log`, `empty-launch-photo-review-install.log`); both compiled asset catalogs pass the launch check. Automated tests preserved/restored private review configuration byte-for-byte. The review simulator was restarted to refresh its cached launch snapshot, with its installed app and data retained; the separate checks simulator is shut down.

Real staging reset/signup and private credential creation/read completed before this installation. After the user unlocked macOS, live review confirmed Home entry, Home-first navigation and the saved “Native signup check” credential opening with its content and signature-check status intact. An empty Badges category shows the revised category state. The app is left on Home; no new reset or setup ran. Current live scope is recorded in [the reset audit](ACCOUNT_DELETION_AUDIT.md). Firebase identity deletion remains outside scope. No hosted CI was dispatched.

Open Simulator, select **LearnCard Native Lab**, and open **LearnCard Lab**. This is the review simulator (`ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E`); the automated UI checks use a separate simulator.

To rebuild and open it later, run from this checkout:

```bash
LC_NATIVE_SIMULATOR_ID=ACD3802A-67BC-4C5F-98A4-7FFCF598AE9E \
  bash apps/learncard-native/scripts/run-ios.sh
```

For a DEBUG review starting directly at Families, append `--review-families`. It opens the native screen and reads account-backed metadata; it does not create a family or send invitations automatically.

The existing ignored local configuration retains the approved test email. A fresh checkout requires its own test-login configuration; see [README](README.md). The CI build configuration uses a non-deliverable test address and should not replace the live review configuration.

## Manual review focus

Review [the new native signup screens](design/SIGNUP_BRIEF.md) and [the first-time setup contract](FIRST_TIME_SETUP.md). The authorized staging-only reset and first-time setup are complete with the shared Firebase login retained. Review Home as the initial destination and the new navigation order. Real guardian delivery/approval, second-device backup recovery and full staging-web UI parity remain manual gates. Existing Account → Recovery & security remains available; never send codes/passwords/recovery files through chat.

Watch the [native motion clip](design/account-motion-preview.mp4). The approved assembly now settles into small held tile shifts; background blocks float continuously on wider outer paths. Verify real cold start and background/resume without an animation-imposed delay, dark/Reduce Motion, errors/retry and a physical-device VoiceOver/energy pass. For a safe repeatable preview, append `--motion-review launch`; add `--motion-settled` to start after assembly. The normal app still connects to the recovered staging account.

Start with **Account → Edit profile**. Choose a library photo and inspect the local preview; changing or removing it must remain a draft until Save Profile. Verify the saved photo in the header and web LearnCard. Name/bio-only saves should preserve it. No automatic live profile mutation was performed. See [profile photos](PROFILE_PHOTOS.md).

Start with **Collection → Latest issued**. Swipe horizontally through the five recent credentials, reverse direction, tap the active card and return. Confirm the throw/settlement feels right, the ends stop, issue dates follow the card, and vertical swipes still scroll. A category with fewer records has a shorter stack; a single record has no fake layers or redundant controls. Data outside the loaded pages is explicitly qualified. See [recent stack behavior](RECENT_STACK.md).

Start with **+ → Share credentials**. Combine Portfolio/Qualifications with issue-date ranges; try several search words, older-first sorting and a credential beyond the first page. Select across filters, then use Selected and Review to verify exactly what will be disclosed. At accessibility sizes rows stack artwork/checkmark above full-width text. Check live large-account loading time and manual link publication separately; automated fixtures publish no real link. See [sharing picker behavior](SHARING_PICKER.md).

Review Scan a code → photo/paste → review → Add to Collection → success. Cancel must not claim. A pending link should return after sign-in/recovery; background removes private preview/input, and sign-out clears intent. The simulator cannot capture a camera frame, so use a selected QR photo or paste. The [generated concept and source prompt](design/CLAIM_FLOW_BRIEF.md) guide composition; [the contract](QR_CLAIM_FLOW.md) records actual boundaries. A dedicated live claim and physical-camera test remain manual gates. Standard HTTPS system-Camera launching needs the app identity and hosted AASA configuration.

First review the separate Portfolio and Qualifications filters, labels in rows/cards/details, category-scoped search and Load more guidance. Families should remain in its dedicated area. The category mapping is read-only; full authoring parity across all categories remains a separate builder/SDK update.

Home’s new [reference](design/home-drawn-concept-2026-10-15.png) and [design rules](design/DESIGN_SYSTEM.md) guide this pass. Review the house icon and larger tray artwork, illustrated credential/app fallbacks, Inbox summary, installed app → detail flow, and See all → My apps (including when Apps previously had a search/detail open). Data Sharing and Families open native screens. Session activity is explicitly labeled This visit.

The user approved the three generated Account/Data Sharing, Apps and Families boards on October 15. Native layouts now use this direction with actual account/catalog/permission data. Account has grouped drawn icon rows, Data Sharing an illustrated intro and permission tiles, My apps direct Open actions, and Families a constellation/roster plus separate guardian selection and access/PIN review. See [boards, exact prompts and implementation mapping](design/WHIMSY_EXPANSION_BRIEF.md).

1. Larger type/artwork/nav, soft painted mark and stable left wordmark/section-title crossfade on all four tabs; readable plus and round winking avatar fallback. Review phone Collection rows, Inbox accents, search results/empty/reset behavior and partial-result pagination. Details have an automatic isolated-card tilt; check scrolling and Reduce Motion too.
2. Home/Account/Apps → Families: overview, compact roster, profile detail, creation/editing and guardian access review. Sample mode uses PIN `12345` and sends no actual invitations.
3. Apps discovery/browser and native Data Sharing after the new navigation entry; app uninstall and agreement withdrawal remain distinct.
4. Language selection, Arabic direction and full versus compact navigation labels; background/reopen and sign-out.
5. Dedicated staging family setup/PIN/invitation/edit validation remains necessary. Do not assume sample or protocol cases mutated the real account.

Read-only live checks already confirmed account recovery/resumption, collection/incoming offers, staging catalog artwork/promotion flags, the empty installed list, and existing agreements/shared-link metadata. The agent has **not** installed an app, published or withdrawn consent, sent a credential, copied a protected link or revoked a link on this live account. Automated mutation tests use synthetic boundaries. Real staging mutations and app-by-app partner compatibility remain to be validated with dedicated test data.

## Remaining work after review

- Required first-time registration, authorized staging-only reset/signup and final-build relaunch/persistence are verified. Complete staging-web parity and independent second-device backup recovery, then optional Build My LearnCard on Home and native People through Home/Account/Inbox. Do not reset the recreated account again. Shared Ireland threshold is corrected to 16 and pending approval now gates account access. Broader policy-table/minor-default/server enforcement review remains. See [remaining roadmap](ONBOARDING_AND_PEOPLE.md) and [reset scope audit](ACCOUNT_DELETION_AUDIT.md).
- Review live sharing-picker latency and real publication/passcode/revocation with explicitly chosen test credentials. Metadata/index optimization for large libraries is a separate backend/performance task; this picker progressively reads existing pages. Legacy review/publication copy still needs complete localization.

- Validate physical camera capture, PhotosPicker behavior and a dedicated live staging claim, including exhausted/expired links and server approval cases. Run a hosted exact-head check only when requested; native CI remains manual. Publish associated-domain/AASA configuration before promising automatic system Camera/Safari HTTPS opening. Other QR protocols remain separate.
- Apply manual design feedback, including consistent header/chrome behavior across tabs.
- Extend the builder/SDK contract for full category authoring, including Qualifications; current creation retains its three existing kinds. Category-specific server pagination/search also remains separate.
- Review the new drawn tray icons, compact typography/rows, search and connection prompt presentation.
- Investigate the apparent self-connection prompt shown after the private self-issued signup test; Not now successfully skipped it during review without creating a connection. Check identity filtering/server generation before changing the prompt contract.
- Validate real staging notification pagination, accepting/dismissing requests and server-created prompts with dedicated accounts. Specialized guardian/device/partner notification actions and push delivery remain separate; ordinary updates are readable/dismissible.
- Validate real app installation, consent, withdrawal and supported partner actions; physical-device behavior and web sign-in continuity still need review.
- Complete localization of older builder/recovery/dashboard screens and review translations with native speakers.
- Implement native **AI career Pathways** (`/ai/pathways`). The user clarified this feature; the newer Journeys (`/pathways`) scope remains unconfirmed.
- Continue Families with child-account bootstrap/switching and guardian approval; follow [the next-phase design and regression gate](FAMILIES_NEXT_PHASE.md). AI Sessions/learner-context synchronization remains separate. Existing server gates remain authoritative.
- Keep résumé builder web-only in the in-app browser. Store/admin/developer/publisher portals remain excluded.
- Complete account-management parity and outstanding live artwork-upload, managed-delivery, sharing and profile-update validation recorded in [account integration](ACCOUNT_INTEGRATION.md).

Anonymous/redacted consent, advanced contract flows and deferred partner actions remain unsupported; do not treat a full signed credential as anonymized. The new native UI does not imply complete web feature parity.

## Reference map

- [Collection empty states, signup photo and actual cold-launch clips](design/EMPTY_STATES_BRIEF.md)

- [Native QR capture, claim transaction and retry boundaries](QR_CLAIM_FLOW.md)
- [Scanner/review/success concept and exact prompt](design/CLAIM_FLOW_BRIEF.md)
- [Credential categories, Qualifications and compatibility rules](CATEGORY_PARITY.md)
- [Native design system: scale, artwork, color and motion](design/DESIGN_SYSTEM.md)
- [Home dashboard contracts and web mapping](HOME_INTEGRATION.md)
- [Home light/dark concept](design/home-drawn-concept-2026-10-15.png)
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
