# Native Home and web dashboard mapping

October 15, 2026. Home is the consumer landing place, using the existing native stores and navigation. The generated [light/dark reference](design/home-drawn-concept-2026-10-15.png) follows the approved drawn style; [design rules](design/DESIGN_SYSTEM.md) formalize scale, imagery, color and motion.

October 16 learner refinement: Home is the initial signed-in destination, with **Home / Passport / Inbox / Apps** in reading order. Existing destination identifiers stay stable. The approved [learner Home and first-arrival direction](design/LEARNER_HOME_BRIEF.md) is now implemented with original SVG artwork and adaptive SwiftUI controls.

Home prioritizes real incoming credentials/updates and the two most recent personal credentials in the loaded pages. A successful, fully read empty Passport gets a first-credential invitation. Loading, failed reads and an empty partial page each have their own state; retained records stay visible during refresh errors. Partial results are labeled and do not imply an account-wide total. A failed snapshot read retains its retry flag after the transient alert is dismissed; a later successful snapshot clears it. Home never infers signup status from record count.

The **+ Add** header opens **Add or send**, with scan/link/QR-photo, direct Create/Send existing/Share actions and From your files. It does not start the camera until Scan is selected. Incoming claims retain their existing explicit review flow. Share opens the existing personal credential picker/publication flow. Scan and Share tiles appear when records are available or more pages remain; a truly empty Passport has the primary Add invitation. People and Data Sharing precede installed apps. Build My LearnCard, Families and a revisitable welcome guide remain lower down; Create/Your creations are visible secondary rows, with no disclosure to expand. Connected People profiles offer contextual sending with that person selected. See [the discoverability correction](SOCIAL_SENDING.md).

The optional welcome follows required signup/recovery/approval. `LearnerActivationStore` arms a versioned pending marker when setup is observed; ordinary ready accounts skip it. Hashed account keys store only pending/finished, while Add intent stays one-shot in memory. Lock clears active state; pending welcome survives relaunch. A pending claim completes optional welcome once the account is ready and continues to review. Home → Your LearnCard guide revisits the introduction without resetting setup.

## Source audit

The consumer dashboard is `apps/learn-card-app/src/pages/dashboard/DashboardPage.tsx`, with presentation in `DashboardView.tsx` and contracts in `DashboardView.types.ts`. The similarly named app-store developer dashboards are administrative tooling and are outside this experiment's scope.

The web consumer view composes profile/header controls, quick actions, recovery prompts, goal/onboarding content, Inbox activity, learning insights, installed/suggested apps and Data Trust. Its activity combines unread notifications, pending consent/connection requests and credential records. Learning insights depend on the AI feature gate and existing insight/skill credentials. Goals include newer Pathways state, distinct from the previously scoped AI career Pathways tile. Data Trust summarizes consent rather than simply counting installed apps.

## Implemented mapping

| Web purpose                   | Native implementation                         | Data / behavior                                                                                 |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Next action / unread activity | Illustrated Inbox card                        | `NativeAppStore.snapshot.offers`, `InboxStore.updates`; shared unread summary with tray         |
| Personal achievements         | Recent Passport rows; secondary creator tools | Real loaded credentials; existing detail, creation and send flows                               |
| Installed apps                | Up to three real installed listings, See all  | `ConsumerAppsStore.loadInstalled`; native listing detail retains consent and in-app launch      |
| Discover                      | Empty installed-app state                     | Explicitly opens Apps → Discover; See all opens My apps                                         |
| Data Trust management         | Data Sharing row                              | Existing native consent/shared-link management, without unsupported aggregate read/write counts |
| Relationships                 | People from Home/Account/Inbox                | Account-owned graph lists, username search and explicit connect/manage actions                  |
| Optional intake               | Build My LearnCard                            | Existing native scan, selected QR photo and claim-link review; no fabricated checklist count    |
| Family tools                  | Families row                                  | Existing native family roster/edit/invitation slice                                             |
| Session activity              | This visit                                    | Existing session-local created/received/sent events, explicitly labeled                         |

`RootView` owns tab selection and Apps' My apps/Discover binding so Home actions select a real destination. Explicit Home entry starts a fresh Apps navigation stack/search, so See all cannot reopen an earlier listing or filtered list. Ordinary tab switches retain their existing state; the account-owned consumer store is reused. Home never installs, launches, connects or grants access automatically. Installed-app selection first opens its native listing detail. The existing detail/browser retains permission checks and cancellation behavior.

Home and the tray derive counts from one `NativeAppStore` summary. Duplicate credential arrival notifications are removed before counting unread updates. Home distinguishes unknown/loading Inbox data from a completed fetch. Failed checks provide an Inbox route to retry. App loading uses `installedLoaded` so an unrequested catalog is not presented as an empty account; lock clears it along with account data. Home does not fetch the full privacy history just to display an aggregate.

## Deferred native parity

- Required [native first-time setup](FIRST_TIME_SETUP.md), optional scan/photo/link/file intake, source counts, reviewed signed JSON imports and People through Home/Account/Inbox are implemented. Connected-profile sending is also implemented. AI document extraction, contact invitation QR and person-specific personal-sharing shortcuts remain in [the onboarding/navigation plan](ONBOARDING_AND_PEOPLE.md).
- Persistent cross-device activity, pending consent-request dashboard summaries and app-specific unread counts need dedicated contracts; session activity and loaded updates are not substitutes for them.
- Learning profile/insights, onboarding/recovery prompts and goal/review cards need their real account state and feature gates exposed before rendering progress or completion.
- AI career Pathways and AI Sessions remain separate native slices. The newer Journeys/Pathways graph's scope is still unconfirmed.
- Native staging QR/claim handling has since been implemented; see [current claim contracts](QR_CLAIM_FLOW.md). Production/system-Camera association and contact-invite QR remain separate work.
- Child account custody/bootstrap/switching remains governed by `FAMILIES_NEXT_PHASE.md`.

No backend schema or permission changes are required for this Home slice. No live account mutations are part of its automated design verification.
