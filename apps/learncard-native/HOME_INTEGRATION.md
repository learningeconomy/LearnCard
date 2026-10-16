# Native Home and web dashboard mapping

October 15, 2026. Home is the consumer landing place, using the existing native stores and navigation. The generated [light/dark reference](design/home-drawn-concept-2026-10-15.png) follows the approved drawn style; [design rules](design/DESIGN_SYSTEM.md) formalize scale, imagery, color and motion.

October 16 follow-up: Home is now the initial root destination, including completed first-time setup and account resume. The tray and backing tab view use Home → Collection → Inbox → Apps in reading order. Existing destination IDs remain unchanged, so badges, app handoffs and Home shortcuts preserve their routes. Collection-focused UI checks explicitly navigate to Collection; signup/approval checks require Home and verify private Home content remains absent before readiness.

## Source audit

The consumer dashboard is `apps/learn-card-app/src/pages/dashboard/DashboardPage.tsx`, with presentation in `DashboardView.tsx` and contracts in `DashboardView.types.ts`. The similarly named app-store developer dashboards are administrative tooling and are outside this experiment's scope.

The web consumer view composes profile/header controls, quick actions, recovery prompts, goal/onboarding content, Inbox activity, learning insights, installed/suggested apps and Data Trust. Its activity combines unread notifications, pending consent/connection requests and credential records. Learning insights depend on the AI feature gate and existing insight/skill credentials. Goals include newer Pathways state, distinct from the previously scoped AI career Pathways tile. Data Trust summarizes consent rather than simply counting installed apps.

## Implemented mapping

| Web purpose                   | Native implementation                        | Data / behavior                                                                                 |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Next action / unread activity | Illustrated Inbox card                       | `NativeAppStore.snapshot.offers`, `InboxStore.updates`; shared unread summary with tray         |
| Collect and recognize         | Collection, Create and Creations rows        | Existing personal collection and native issue/send flows                                        |
| Installed apps                | Up to three real installed listings, See all | `ConsumerAppsStore.loadInstalled`; native listing detail retains consent and in-app launch      |
| Discover                      | Empty installed-app state                    | Explicitly opens Apps → Discover; See all opens My apps                                         |
| Data Trust management         | Data Sharing row                             | Existing native consent/shared-link management, without unsupported aggregate read/write counts |
| Family tools                  | Families row                                 | Existing native family roster/edit/invitation slice                                             |
| Session activity              | This visit                                   | Existing session-local created/received/sent events, explicitly labeled                         |

`RootView` owns tab selection and Apps' My apps/Discover binding so Home actions select a real destination. Explicit Home entry starts a fresh Apps navigation stack/search, so See all cannot reopen an earlier listing or filtered list. Ordinary tab switches retain their existing state; the account-owned consumer store is reused. Home never installs, launches, connects or grants access automatically. Installed-app selection first opens its native listing detail. The existing detail/browser retains permission checks and cancellation behavior.

Home and the tray derive counts from one `NativeAppStore` summary. Duplicate credential arrival notifications are removed before counting unread updates. Home distinguishes unknown/loading Inbox data from a completed fetch. Failed checks provide an Inbox route to retry. App loading uses `installedLoaded` so an unrequested catalog is not presented as an empty account; lock clears it along with account data. Home does not fetch the full privacy history just to display an aggregate.

## Deferred native parity

- Required [native first-time setup](FIRST_TIME_SETUP.md) is implemented before account access. Optional Build My LearnCard and a People destination remain in [the onboarding/navigation plan](ONBOARDING_AND_PEOPLE.md): resumable Home intake and People reached from Home/Account/Inbox. Those Home cards are not implemented yet.
- Persistent cross-device activity, pending consent-request dashboard summaries and app-specific unread counts need dedicated contracts; session activity and loaded updates are not substitutes for them.
- Learning profile/insights, onboarding/recovery prompts and goal/review cards need their real account state and feature gates exposed before rendering progress or completion.
- AI career Pathways and AI Sessions remain separate native slices. The newer Journeys/Pathways graph's scope is still unconfirmed.
- Native staging QR/claim handling has since been implemented; see [current claim contracts](QR_CLAIM_FLOW.md). Production/system-Camera association and contact-invite QR remain separate work.
- Child account custody/bootstrap/switching remains governed by `FAMILIES_NEXT_PHASE.md`.

No backend schema or permission changes are required for this Home slice. No live account mutations are part of its automated design verification.
