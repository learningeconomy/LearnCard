# Private campaign composer

LC-2270 provides URL-only `/admin/campaigns` and `/admin/campaigns/:id` routes. `/admin/campaigns?create=1` creates a draft. `campaignsIsAdmin` must succeed before list/editor data loads; denied users see a generic not-found page. Each account/network session owns a non-persisted query cache. Server authorization remains authoritative for every operation.

## Supported

- Paginated list and editor; immutable saved ID; shared `CreateCampaignInputValidator` validation with JSON field paths.
- Independently selectable `inApp` and `notify` channels (at least one required). Only selected channels require content: in-app JSON or notification title/body. Also supports optional start/end times entered in the browser's local timezone and stored as ISO timestamps, notification title/body, `excludeMinors` and `selfEnroll`.
- Preview via `setInAppMessageOverride` and the existing real renderer. The existing override path suppresses dismissal storage/engagement telemetry and never calls a campaign dispatch API. Message buttons remain interactive, including navigation; leaving the editor clears the override.
- Create draft, update, confirmed live/pause/archive transitions, and confirmed `campaignsSendTestToMe` for the saved selected channels. Notification tests use the existing inbox/push queue. In-app tests persist a private snapshot for the requesting administrator and appear on the next app visit outside the editor via `getMyCampaigns`. The real renderer acknowledges presentation through `recordCampaignEvent` with a test ID. Tests do not enroll the administrator or record engagement, fatigue, or audience stats; repeated tests replace the pending snapshot for that administrator/campaign. Unsaved edits block saved-state actions. Go Live permits scheduled in-app presentation; it does not dispatch notifications.
- DID CSV with a named `did` column or a single column, quoted CSV, prefix validation, stable deduplication, sequential chunks of 1000, progress, and stopping after the current request. Completed writes are retained. Read errors and invalid rows block the whole upload. The 10 MB file limit bounds local parsing.
- Network member search plus Fields/JSON controls for email addresses, account identifiers, boost recipients, credentialsSentBy (sender/listing/metadata/since), and inboxClaims source contracts. Email matching identifies existing accounts and is separate from email delivery.
- Preview/add eligible-match counts, paged stored membership, and `campaignsGetStats` polling every 30 seconds while mounted/visible. Polling stops on route exit; stats errors identify potentially stale values.

## Audience notification sending

For a saved live campaign with notification content and an active schedule, **Send Notifications**
loads `campaignsPreviewDispatch`. It counts stored audience members who satisfy the current
age policy and have no `notifiedAt`, using the delivery worker's eligibility predicate. The
confirmation shows eligible inbox recipients, total stored membership, and already-notified
members. Push is an attempt through the existing notification system; email is not included.

Confirm calls `campaignsDispatch(id, { expectedPreviewToken })`. The server rechecks the
campaign definition and eligible recipient identities under the campaign lock and consumes
the token once. A changed audience, changed content/status, or reused token requires reviewing
again. No-eligible-recipient confirmations cannot send. Cancelling only closes the review.

The worker still rechecks eligibility during paced delivery; counts are a point-in-time review,
not a promise of final inbox or device delivery. Success means dispatch started, and stats are
refetched and continue polling. Transport failures report that the request may have completed;
a fresh review is required before retrying. The existing receiver deduplication remains authoritative.

Search selection alone does not enroll or notify people: add the selected members first.
Dispatch targets the entire stored eligible audience, not just the currently selected search rows.

## Unsupported / deferred

- Email delivery controls or an emailed metric. Current delivery channels are only `inApp` and `notify`.
- Email is not a delivery channel. Inbox recipient counts do not guarantee push receipt; `notified` acknowledges inbox storage, not delivery to a device.
- Newly added counts and per-row `notFound` CSV results. Preview/add return `{count}` of eligible matches, including existing members. DID aliases can resolve to the same profile, so totals across chunks must not be called unique recipients.
- Notification tap routing: LC-2267. Native push receipt and email integration need separate device/service verification.
- The existing audience minor/DOB policy is preserved. Admin-only private tests bypass audience/status/schedule eligibility, while normal campaign delivery is unchanged. lca-api enum/dedupe must deploy before brain as documented by #1839; this implementation does not deploy anything.

## Verification

Run the focused model/component tests with `bun run --cwd apps/learn-card-app test -- src/pages/campaigns`. They cover access denial/failure, mutation errors, repeated clicks, unsaved navigation, optional field clearing, caller-only confirmation, local preview cleanup, CSV cancellation, source contracts and polling teardown.

Run `PW_MOCK_PORT=3027 PW_RECORD_VIDEO=true bun run --cwd apps/learn-card-app test-mock -- campaigns.mocked.spec.ts --workers=1` for the real UI against synthetic mocked services, including a 10,000-row upload and mobile layout. For local Chromium QA, run from the app directory: `PW_MOCK_PORT=3028 PW_RECORD_VIDEO=true bunx playwright test --config=playwright.campaigns.config.ts`. Never use recording mode or production notification endpoints for these tests. Network simulations are not proof of backend delivery.

The repository's full `lc verify` owned-stack gate requires Linux. On macOS use the secret-free LearnCard Verification workflow on the exact branch head, retaining its result separately from mocked browser evidence. The catalog does not yet include this new composer; do not describe a generic catalog pass as composer-specific end-to-end proof.

## Studio layout

The collection supports server-side status filters, desktop table rows and compact mobile cards.
The editor groups details, message JSON and schedule/eligibility beside a preview/testing panel.
The message overview is a text summary; **Preview message** opens the existing real renderer.
New drafts generate a stable ID automatically. **Advanced settings · Campaign ID** allows a
custom ID before saving; saved IDs remain immutable and campaign names stay editable.
Validation appears for edited fields, with JSON paths retained, rather than showing errors on
an untouched draft. The same shared schema still blocks invalid saves.

Desktop layout uses explicit 1200px/1440px variants because this app does not define `lg`/`xl`.
Secondary buttons declare solid borders to preserve them through Ionic's reset. The synthetic
browser suite checks these properties and captures desktop/mobile list and editor screenshots.
