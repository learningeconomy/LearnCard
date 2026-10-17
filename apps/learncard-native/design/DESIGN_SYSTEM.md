# LearnCard native design system

Working rules, October 17, 2026. Applies to the SwiftUI consumer experiment. Use this with the approved [drawn shell](DRAWN_SHELL_BRIEF.md), [secondary screens](WHIMSY_EXPANSION_BRIEF.md), and [learner Home reference](LEARNER_HOME_BRIEF.md). Generated screens guide composition; shipping SwiftUI, accessibility and real data determine the final layout.

## Character

The October 16 learner pass renames the personal destination **Passport**, keeping shared credential collections distinct. Reading order is **Home / Passport / Inbox / Apps**; historical Collection references below describe the same internal destination. The implemented Home and optional welcome follow the [learner Home and first-arrival compositions](LEARNER_HOME_BRIEF.md). Existing creator/issuer capabilities are secondary; institution workspaces remain a later product slice.

Learner-first sets the hierarchy while keeping creation/sending discoverable. Show these actions directly in Add and as visible secondary Home rows. Connected profiles offer contextual **Send a credential**, with the person carried into new/existing creation flows and explicit review before delivery. Connections support useful recognition and exchange; Home does not need gamified sending prompts or administrative controls. See [the social sending contract](../SOCIAL_SENDING.md).

**Confident, useful, a little whimsical.** Substantial type, clear actions, warm outlined illustrations and the Colorful theme. Keep ordinary tasks quick. Personality belongs in a smiling avatar, an illustrated envelope, or a little house, while reading and account decisions stay calm.

- Neutral canvas, colorful objects. Strong full-page backgrounds were tried and rejected.
- One main purpose per surface. Inbox reviews arrivals and requests; Collection holds personal credentials; Creations holds reusable credentials to issue; Apps contains consumer tools; Home brings useful next actions together.
- Supplied credential, profile and publisher imagery takes precedence. Missing artwork gets an original generic/category illustration, never a made-up publisher identity or a broken-image frame.
- Use native SF typography and controls. Do not scale a screenshot uniformly, imitate desktop hover behavior, or import the web taste skill's landing-page/GSAP rules.

## Color roles

`Palette` in `ios/Sources/DesignSystem.swift` is the code source. The web Colorful schema and category meanings are the brand source.

| Role          | Light                               | Dark / treatment                     |
| ------------- | ----------------------------------- | ------------------------------------ |
| Page          | `#EFF0F5`                           | `#11151C`                            |
| Surface       | System secondary grouped background | Native charcoal surface              |
| Primary ink   | `#18224E`                           | `#EFF0F5`                            |
| Secondary ink | `#353E64`                           | `#C5C8D3`                            |
| Separator     | `#E2E3E9`                           | `#353E64`                            |
| Blue          | `#93C5FD`                           | Badges, IDs, collection controls     |
| Pink          | `#F9A8D4`                           | Achievements, creation, Inbox art    |
| Orange        | `#FDBA74`                           | Qualifications                       |
| Green         | `#34D399`                           | Studies                              |
| Yellow        | `#FDE047`                           | Portfolio, warm illustration details |
| Violet        | `#C4B5FD`                           | Assistance and skills                |
| Cyan          | `#22D3EE`                           | Experiences                          |
| Amber         | `#FBBF24`                           | Families                             |
| Teal          | `#5EEAD4`                           | Career Pathways / supporting artwork |

Colorful tiles stay opaque in dark mode, with navy `cardInk` and `cardSecondary`. Never apply white semantic dark-mode text blindly to a bright yellow/pink panel. Use semantic `ink` on adaptive surfaces. Status colors communicate success, warning and failure; illustrations are decorative and cannot be the only status signal.

Filled primary actions use the pair `Palette.selection` for the fill and `Palette.selectionInk` **on the label**. Both invert together between light and dark appearances. Never rely on a parent foreground or `.tint` alone: the real reset continuation inherited navy text on a navy button and became unreadable. Keep a visible action verb and at least a 54-point primary-action height, expanding for wrapped text.

## Optional milestone and filter actions

Build My LearnCard's document milestones use numbered 46-point color tiles, with navy ink in both appearances, and checkmarks for document kinds that actually have saved copies. A four-segment summary reflects saved kinds; it is optional, independent of signup, and does not count taps or fictional credentials. Sample-bundle access uses the existing explicit consent surface. Its receiving toggles may start on when the contract marks them enabled by default, matching the explicit Add samples intent; optional sharing of existing credentials or personal information remains off. The receiving controls stay optional and visible, and agreement requires a receiving selection. Signed fictional samples are labelled without changing their issuer or cryptographic contents.

Keep reset actions physically grouped with their filters. Passport's date/order reset has a 44-point circular touch target beside Sort, with an explicit accessible label. Category-only selection already has All/View all, so it must not insert an isolated reset row. Empty-state artwork should be legible as a whole; do not obscure the book/ribbon with a second category tile.

## Surface depth

Depth follows the element's role, rather than the section it lives in. The October 17 review keeps the rendered artwork while removing Apps-only diffuse card shadows. Use these rules when touching existing screens; a broader consistency audit is queued in [the plan](../PLAN.md#queued-design-system-consistency-audit--october-17).

| Role                   | Treatment                                                                                           | Examples                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Reading and actions    | Adaptive surface, no cast shadow or thick lower edge; separate with spacing or a quiet divider      | Home groups, Inbox rows, ordinary Apps cards, forms and permission groups |
| Featured invitation    | Same flat surface, with a restrained tint or opaque Colorful fill and sparse drawn accents          | Featured app, Apps empty invitation                                       |
| Illustrated object     | Depth inside the artwork; a small local shadow can anchor an app icon without lifting its whole row | App icons, rocket illustration, category artwork                          |
| Credential hero/detail | Deliberately raised edge, artwork window, broad cast shadow and directional reflection              | Home recent credential and isolated credential detail                     |
| Overlay or shell       | System sheet elevation or established compact header treatment                                      | Presented sheets, Add/account island                                      |

Do not spread credential lighting, sheen or tilting to generic panels. Keep real publisher imagery intact. A panel's color or shadow must never imply verified status, endorsement or access.

## Long-running sync feedback

Keep long-running receipt work visible outside its initiating screen. Sample sync uses a shared, in-layout strip above the bottom tray: a small activity indicator, checked/total count and permission to keep browsing. It becomes a short completion or incomplete/retry state, retained until dismissed. Final Passport refresh is its own named phase. Do not use an alert for ordinary progress, disappear with view navigation, cover the last scroll row or invent a percentage. Error/partial copy stays distinct from completion; refresh saved additions even after a later step fails.

Passport and Inbox also share a compact activity row directly beneath the page title. A real snapshot read says Checking for credentials; explicit receipt says Adding to your Passport; Inbox notification reads use their own loading label. Sample preparation/receipt/final refresh use the same operation state as the persistent strip. At rest the row offers a labelled 44-point Refresh action. Refresh failures remain inline with retry and retain the previous content. Do not call ordinary creation, sending, sharing or pagination incoming sync, promise continuous background delivery, or show all caught up while the relevant checks are incomplete or failed.

## Credential identity and browsing

Credential names are primary; issuer text always starts with localized **Issued by**. Show a known issue date as a quiet **Issued _date_** line below the category, rather than squeezing it beside a long title. Keep missing dates out of rows/cards and label them unavailable in detail. Issuer labels and category art do not imply trust. Passport places designed date/sort sheets behind compact controls below search and remains a list in every browsing mode; Home holds the recent deck. See [the complete browsing contract](PASSPORT_BROWSING.md).

## Scale and rhythm

Dimensions are logical points. Display pixel density is irrelevant to layout. `NativeLayout` provides the shared 20-point page inset, 24-point section gap/surface radius and 14-point row gap. Existing surfaces migrate to these tokens as they are touched.

| Element                | Default                     | Scaling rule                                                |
| ---------------------- | --------------------------- | ----------------------------------------------------------- |
| Page title             | 38 pt bold                  | `PageHeading` uses Dynamic Type; allow wrapping             |
| Section heading        | System title2 / title3 bold | Native Dynamic Type                                         |
| Important row title    | 18 pt semibold              | `DrawnSettingsRow` uses `ScaledMetric` relative to headline |
| Supporting text        | System subheadline / body   | Keep readable; never shrink a long title to fit             |
| Small metadata         | Caption / footnote          | Secondary information only                                  |
| Row art tile           | 48 pt                       | Colored rounded square; about 66% drawing inside            |
| Credential row artwork | 56 pt in a 74 × 78 tile     | Circular window; bold category illustration if missing      |
| Main action target     | At least 44 × 44 pt         | Grow vertically for larger text                             |
| Typical grouped row    | At least 68 pt              | Content and accessibility text can increase height          |

Use an 8-point minor spacing rhythm (4/8/12/16/24); 20-point outer insets and 14-point artwork gaps are deliberate optical exceptions. Group related actions into a surface with quiet separators instead of giving every row an oversized independent panel. Long translations wrap, never disappear.

### Loading hierarchy

The assembled painted mark and shared 32-point bold LearnCard wordmark are the main brand lockup. Below them, the greeting or operation title uses system title3 medium in secondary ink, followed by body-sized status copy. Do not place a large bold Welcome back headline beneath an equally bold brand name. The running view scales with Dynamic Type and remains scrollable; static launch retains the same brand lockup. No launch timing or motion change is implied by typography.

### Language previews

Review English and Arabic at the same explicit standard Dynamic Type size first. `--standard-type` selects the normal `.large` baseline in DEBUG review fixtures; ordinary app launches still follow the user's system setting. Keep `--large-type` (`accessibility3`) captures separately labeled as accessibility stress tests. Do not present an enlarged Arabic capture as the default language design or shrink Arabic alone to compensate for a mismatched review setting. The default sign-in controls should have matching target heights and readable, unclipped labels in both languages; keep the larger accessibility check as a separate case.

### Heading accents

Reuse the builder's three rounded ray strokes as a small static flourish, through `headingFlair` and the optional `PageHeading.accent`. Keep the mark next to the words, with six points of breathing room, rather than stranded at the page edge. Use 32-point artwork beside root page titles and 20-point artwork beside selected section headings. Current root accents are warm yellow for Home, blue for Passport, pink for Inbox and teal for Apps; `Palette.flair*` supplies light/dark colors. These are decorative colors, not status or category filters.

Keep the rhythm sparse: one main title and, where useful, one supporting section in a pane. Do not repeat rays on each row, navigation icon, tab label or action. Text stays primary and can wrap; mirror the flourish in RTL, hide it from accessibility/hit testing, and omit it at accessibility Dynamic Type sizes so it never displaces readable content. It has no looping animation. The compact scrolled brand and the tray retain their existing navigation signals. See [native examples](HEADING_ACCENTS.md).

### Bottom tray

Edge-to-edge adaptive surface, a fine top divider, four equal-width targets. A colored drawn icon, readable label, and short active underline communicate selection. Keep native bottom inset ownership in the tray. No floating glass island.

Reading order is **Home → Passport → Inbox → Apps**. Home is the initial destination after signup, approved setup, sign-in and a fresh account resume. Keep the existing destination identifiers stable when changing visual order; Inbox badges, Home shortcuts and pending-claim review must still route to their intended destination. Arabic presents Home at the leading (right) edge. Ordinary tab switches retain each section's navigation state.

`NavigationMetrics` defines icon frames from **available tray width**:

| Width in points | Icon frame | Minimum item height |
| --------------- | ---------- | ------------------- |
| Up to 375       | 31         | 68                  |
| 376–414         | 36         | 74                  |
| Over 414        | 40         | 78                  |

Labels start at 14 pt, scale to 18 pt and allow two lines. This navigation-only cap preserves four usable targets and unbroken short Arabic labels at accessibility text sizes; page content continues to scale fully and VoiceOver retains the full destination name. Icons retain a bounded optical size rather than growing indefinitely on a wide display. Drawings occupy roughly 80–90% of a 40-unit canvas, with naturally narrower passport artwork. Review glyph bounds as well as the frame. These rules support future wider layouts; they do not imply that iPad has been implemented or validated.

Collection uses a passport, Inbox an envelope, Apps a rocket, Home a pink-roofed yellow house. Home is a personal landing place, so its icon should read as home rather than a data graph. Badge values must share the same deduplication as Home's Inbox summary.

The shared root shell must reserve the tray's actual measured height in layout. Keep page scrolling above it, including when label wrapping or Dynamic Type changes the tray height. Hide the system tab bar on each tab’s NavigationStack; container-level visibility can leave a second native bar. A bottom-only background may extend to the home indicator; scrollable content may not. Retain each page's normal content padding rather than adding guessed tray-height spacers to individual tabs. Verify the released, settled end position of the final row in all four tabs, not only its hittability during overscroll.

### Header

Use the shared header on all four root sections. Left: soft painted mosaic and LearnCard. Scrolled: crossfade the wordmark into the section title in the **same fixed slot**. Do not add a competing centered navigation title or animate the horizontal position. At accessibility sizes keep the mark and preserve room for controls.

Right: a tight pill groups the labeled **+ Add** control and a 44-point profile target. Keep both labels readable and the gap compact; the profile opens Account. Default profile art is a round winking smiley with pink cheeks. The mosaic itself has no ink outline or white circular container.

## Artwork

- Editable SVGs are generated by `scripts/prepare-illustrations.ts`. Navy rounded outlines, confident 3.2-unit strokes on the 64-unit category canvas, simple opaque fills, one or two small accent marks.
- Category art is descriptive: shooting star for achievements, ribbon, qualification certificate/seal, apple, book, life ring, mountain, ID, family smiles, skill star, conversation, path and lightbulb. App fallback is a generic illustrated application window. It does not pretend to be a publisher's logo. See [the rendered card/material refinement](CREDENTIAL_DEPTH_BRIEF.md).
- `scripts/prepare-branding.ts` maintains the tray's original vector drawings and exports the existing 1x/2x/3x light/dark assets. Keep the source reproducible.
- Use the built-in image generator for new composition explorations. Record the prompt, selected board and deviations driven by actual account data. Implement final icons as editable artwork, not crops of a generated phone screenshot.
- Image loading keeps stable geometry and a native progress indicator; failed/missing images use the illustration. App loading retains its generic artwork beneath the indicator. Do not replace a real profile image just because it is an initial.

## Motion

Empty states communicate the actual state: a new collection, an empty category and a failed search are different. Use the drawn passport and Scan/Create for an empty collection, category art and View all for an empty category, and the magnifying glass only for a nonempty search query. A partial page cannot establish whole-account emptiness; retain Load More and truthful loaded-page copy. See [native empty-state compositions](EMPTY_STATES_BRIEF.md).

An illustrated action row is one complete button. Thumbnail, label, whitespace and chevron share the tap target; an optional photo must not require tapping title-like text. Camera badges and forward chevrons clarify intent. Stack the photo row at accessibility text sizes while keeping normal-size rows compact.

System launch and running loading views share their adaptive canvas, painted material and full-size assembled mark from the first frame. Continue with the slight held-pose jiggle; do not shrink, scatter or gather the tiles. Static launch cannot animate; it must not introduce a different palette or untextured mark. No animation may delay readiness.

Interactions use a brief press response and selection feedback. Navigation/label transitions are around 220–300 ms. Motion must explain state or preserve continuity and respect Reduce Motion.

Root pull-to-refresh uses a compact painted mosaic and localized status. Pull distance gently stretches its tiles; actual refresh work drives a traveling diagonal ripple. Keep the system's pull gesture, accessible refresh action, inset handling and async completion. Hide the artwork at rest and end it without a minimum display time or invented success/progress. Reduce Motion and VoiceOver use a still, complete mark; pause animation offscreen and inactive. Ordinary scrolling must not continually redraw hidden artwork. Keep errors/retry in their existing page-level status. See [the motion board and interaction contract](PULL_REFRESH_BRIEF.md).

Credential **detail** has one isolated card with an automatic 9-second loop: about ±7° yaw, ±3.2° pitch, a moving cast shadow and reflection behind the content. Raised artwork, a lower edge and corner contours give the surface depth without washing out its text. No stack or drag instruction. Pause when offscreen, inactive, using Reduce Motion or VoiceOver. Home's recent stack is a different presentation; Passport uses list rows. Avoid additional perpetual motion throughout lists and dashboards. See [the card material contract](CREDENTIAL_DEPTH_BRIEF.md).

Home’s recent stack is deliberate browsing: the latest five personal records across categories, a horizontal toss/settlement, position dots and bounded Newer/Older controls. Render the real covered cards before and throughout the drag, including their own color, artwork and text; never cover them with opaque decorative sleeves. Keep vertical scrolling intact and tap navigation tied to the active record. At most two covered layers are visible; one record has no fake stack. The oldest position previews actual newer cards for reverse browsing. Passport always uses list rows, with its existing search/filter/sort controls. Reduce Motion changes position immediately; detail animation remains independent. See [the recent-stack contract](../RECENT_STACK.md).

Account transitions are the expressive exception to quiet in-app motion. Launch, reconnect, locked and account-operation waiting states use the original watercolor mosaic already fully formed, with small held stop-motion shifts in each tile and colored pigment floating on broader smooth paths at the canvas edges. The neutral canvas and clear central copy remain. Use a paused, fully formed mark for Reduce Motion/VoiceOver and never hold real readiness for a splash animation. No percent progress without real progress data. Inline buttons and list refreshes keep compact contextual feedback; do not replay a full launch screen on every action. See [motion contracts](../ACCOUNT_MOTION.md) and [the generated board/prompts](ACCOUNT_MOTION_BRIEF.md).

## Content and states

### Account access

Sign-in, email-code entry and recovery use one substantial headline, an original drawn illustration, persistently labeled fields and a fixed action tray above the keyboard. The ScrollView owns supplementary content and focus scrolling; clip its artwork below the status area. Email entry is editable; verified account state chooses existing-account recovery or native first-time setup. Distinguish the sign-in code from the email recovery key in plain language. Recovery methods use the designed illustrated bottom sheet, with current selection and explanatory copy; cancellation preserves input and changing method clears it. At accessibility text sizes reduce decorative artwork rather than shrinking text. Nested sheets inherit language/RTL, appearance and Dynamic Type. Waiting states retain the established painted motion; forms do not add competing perpetual animation. Recovery/security settings disclose web-only management actions. See [the account reference](ACCOUNT_ACCESS_BRIEF.md) and [input/lifecycle contracts](../ACCOUNT_ACCESS.md).

### First-time setup

Use the same access shell with three clear steps, calendar/globe and shield/heart SVG companions, a smiling photo placeholder, persistently labeled fields and a fixed action tray. Country selection is a searchable designed sheet; birth date requires explicit confirmation. Privacy toggles are independent and off by default. Recovery export uses the real system file picker with clear cancellation/retry; do not simulate a successful save or approval. Guardian waiting has its own illustrated state. See [composition](SIGNUP_BRIEF.md) and [behavior](../FIRST_TIME_SETUP.md).

### Credential creation

Design → Recipient → Review uses an artwork-led, category-colored preview, compact numbered progress and a fixed action tray. Fields keep persistent labels and actual character limits. Format/category use custom bottom selection sheets with illustrated option rows and selected states; do not use confirmationDialog or a menu, which adapt to the rejected floating bubble on iOS 26. Colored selector tiles stay in two columns on ordinary phones. Optional criteria, evidence and activity/expiry details expand only when needed. Recipient choices use the smiley/illustrated faces, colored side-by-side cards, an explicit selection state and the real member identity. Carry the reference’s paper plane, rays, hearts and star marks into the real UI as accessible-hidden SVG decoration; preserve space for actual data and larger type. Review shows actual draft content and delivery/reuse behavior before any upload or issuance. Keep the neutral canvas, adaptive surfaces and navy ink on opaque colorful panels. Accessibility text stacks preview content and selectors; the modal and nested picker explicitly inherit language/RTL and text size. See [the composition reference](CREDENTIAL_BUILDER_BRIEF.md) and [flow contract](../CREDENTIAL_BUILDER.md).

- Name the next action: Review Inbox, Create a credential, See all. Give destructive actions distinct styling and confirmation.
- Every async action needs contextual feedback and a retry path. Initial loading must not appear as a completed empty state. A failed Inbox fetch cannot become “all caught up.”
- Counts describe data actually loaded. Do not present a paged collection as a global total. Credential arrivals that duplicate pending offers must not inflate the badge. Session activity is labeled **This visit**, not a permanent activity history.
- Home shows existing account capabilities: arrivals and unread updates, installed apps, collection/creation entry points, Families and native Data Sharing. It must not invent progress, learning insight scores or goal completion.
- Use the String Catalog for new app copy, including plural forms and interpolated names. Preserve publisher and credential text verbatim. Verify RTL, long labels and accessibility type.

## Review before extending

### Consumer Apps

The [October 16 rendered Apps implementation](../APPS_REDESIGN.md) uses app-first hierarchy: installed app entries or an inviting Discover action, then quieter native utilities. Follow the surface-depth roles above: calm flat reading panels, restrained featured accents, rendered artwork and a small local app-icon shadow; preserve actual publisher art and keep permission text/toggles calm. No perpetual card tilt in Apps. Required scopes are fixed labeled rows; optional scopes retain explicit controls. Parent cards containing actions use accessibility containment so their identifiers do not override independent child buttons. The [boards and native captures](APPS_RENDERED_BRIEF.md) keep synthetic design facts distinct from live metadata. First-party Pathways/Journeys follow their [separate learner plan](../LEARNER_LEARNING_PLAN.md), without framework or Journey authoring.

Check the actual view at ordinary and accessibility text sizes, light/dark appearance, and representative narrow/wide logical widths. Review supplied, loading, failed and missing art. Exercise destinations and account lifecycle behavior, not only snapshots. Confirm touch areas, semantic labels, reading order, honest counts and Reduced Motion behavior. Save representative simulator screenshots alongside test results; image-generation boards are not evidence that implementation matches.

## Category parity

Filters and category labels use semantic credential categories, independently of the legacy three authoring kinds. Portfolio, Assistance, Qualifications and the other web categories retain distinct names, artwork and filters. Families stays in its dedicated area. Unknown partner values remain readable under Other. See [category contracts and qualification rules](../CATEGORY_PARITY.md).

## Authoring vocabulary

Category, credential type and visual format are separate controls and data fields. Use the eight regular web creator categories with the same Collection labels/artwork/colors. Category opens a two-stage category/type sheet with localized search; selection commits together, while Back/Cancel preserves the draft. The category tile and review show the chosen type. Format offers Badge/Award/Certificate/Media, with the ID category fixed to its dedicated card format. Do not list Course, Skill, Membership or License as visual formats. Browse-only Skills/AI and Family flows do not become manual authoring options. Keep exact wire values out of user copy and use the shared audited catalog for both Swift and JavaScript. See [the source audit and contract](../CREDENTIAL_AUTHORING_PARITY.md).

## Home actions and relationships

A primary action must look actionable: illustrated colored tile, clear verb/title, one useful line and a disclosure arrow on a full-width touch surface. Scan a code uses this same treatment. Home groups Data Sharing with Collection/Create/Creations, while People and optional Build My LearnCard have their own entries. Keep the four-tab tray; no desktop side menu is copied. Relationship states use explicit text; a connection never implies credential access. Search distinguishes pending results, real empty lists and a query with no matches. Native People/Build artwork extends the bold navy-outline SVG set and the smiley fallback; the generated board is composition guidance only.
