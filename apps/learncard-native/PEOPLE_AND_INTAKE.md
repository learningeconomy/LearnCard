# People and optional LearnCard intake

October 16, 2026. Home now groups Data Sharing immediately after My collection, Create a credential and Your creations. Families stays in its existing area. Scan a code is an illustrated full-width action with explanatory copy and a chevron, rather than unadorned text.

## Where things live

The four-tab tray remains Home → Collection → Inbox → Apps. **People** is a native destination reached from Home and Account; Inbox's People shortcut opens Requests. **Build My LearnCard** is an optional Home destination for collecting credentials after required account setup. Back leaves it freely, and it remains available to returning users. No desktop side menu or extra tab is introduced.

See [the generated composition and native screenshots](design/PEOPLE_INTAKE_BRIEF.md). The reference guides illustration and scale; example people in it are not live accounts.

## People

- Connections, Requests and Sent use existing paginated network APIs. Blocked uses the existing blocked-profile list. Rows show supplied images or the drawn smiley, name, username and actual relationship state.
- Search within these lists scans later pages too. Each page has a progress guard; a search exceeding 100 pages fails visibly rather than claiming a complete empty result. Normal browsing loads 50 profiles at a time and supports Load more.
- Find people searches LearnCard usernames through `searchProfiles`, requests connection status and excludes the current profile and service profiles. That API has no cursor; native shows up to 50 and asks for a more specific query when the limit is reached. It does not access the phone address book.
- A profile shows the authorized public/account-visible fields and explicit Connect or Accept, outgoing-request cancellation, disconnect and block/unblock actions. Destructive or reversal actions ask for confirmation. Connecting alone does not grant access to credentials, shared links or app permissions.
- Before mutations, the runtime reloads authoritative relationships and excludes self. Duplicate taps are serialized; a lost response is reconciled by reading state before retrying a write. Errors use stable translated copy, including profile restrictions.
- There is no dedicated incoming-request decline API in the audited web contract. `cancelConnectionRequest` cancels only the current user's outgoing request. Native does not label that endpoint Decline; Accept and explicit Block are available for incoming requests.
- People changes refresh Inbox and mark only settled matching request notices read. Pending connection prompts still require their explicit Connect/Not now decision. Inbox relationship actions invalidate People so reopened lists refresh. Metadata errors remain visible rather than being reported as complete synchronization.

Services and stores belong to one native account. Lock/sign-out/reset clears list, profile, search, pagination and busy state. Generation/request checks discard late reads and writes; the existing runtime is disposed with the account. Live unavailable services never substitute sample contacts. Demo People and Inbox share an in-memory relationship graph solely for reproducible checks.

Contact invitation links/QR, device contacts, profile-specific send/share shortcuts, a richer profile editor and specialized guardian/device notifications remain separate. The generic credential scanner does not silently treat contact-invite codes as credential claims.

## Build My LearnCard: first native intake slice

The hub offers working **Scan a code**, **Use a claim link** and **Choose a QR photo** actions. Each enters the existing native claim flow with a matching input mode. Link entry focuses the field without starting the camera; photo entry opens the system picker; scan uses camera availability/permission feedback. An unfinished claim retains its current review/retry state rather than being silently discarded by a new entry mode. Cancelling a picker or leaving the hub never adds a credential. Every resolved credential still goes through preview and explicit Add to Collection, with existing signature, approval and retry-journal behavior.

Build My LearnCard is not required signup, a completion score or an AI processing promise. This initial hub does not offer unfinished document buttons. Web résumé/certificate/transcript/diploma extraction, raw credential JSON import and cross-client intake bookkeeping remain the next slice in [the onboarding plan](ONBOARDING_AND_PEOPLE.md). Existing résumé import is distinct from the web-only résumé builder/editor. No document is uploaded or processed by opening Home or the hub.

## Source and validation

The web audit uses `pages/addressBook/`, network plugin `types.ts`/`plugin.ts`, brain profile routes and `helpers/connection.helpers.ts`; intake uses the active `components/learncard/checklist/` and shared checklist definitions. No backend route, policy or schema changes are made.

Native implementation lives in `account-runtime/people.ts`, `PeopleService.swift`, `PeopleStore.swift`, `NativeAppStore.swift`, `InboxStore.swift`, `PeopleView.swift`, `BuildLearnCardView.swift`, `HomeAppsView.swift` and existing claim presentation. New copy is in the native String Catalog for en/es/fr/ar, with inherited RTL/Dynamic Type. Original SVGs provide the final illustrations and icons. No Paraglide web runtime is embedded in these views.

Protocol tests cover multi-page search, authoritative states, self/stale/invalid actions, restrictions, duplicate writes, lost replies and account replacement. Swift tests cover pending reads/profile/actions across lock, replaced queries, cursor guards, shared Inbox state, typed errors/localization and intake modes. UI checks exercise Home routing/ordering, People actions, the existing account lifecycle and claim routes. Exact results and remaining live/physical-device gates are recorded in [TESTING](TESTING.md) and [STATUS](STATUS.md).
