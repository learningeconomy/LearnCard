# Private campaign composer

LC-2270 provides URL-only `/admin/campaigns` and `/admin/campaigns/:id` routes. `/admin/campaigns?create=1` creates a draft. `campaignsIsAdmin` must succeed before list/editor data loads; denied users see a generic not-found page. Each account/network session owns a non-persisted query cache. Server authorization remains authoritative for every operation.

## Concurrent edits

Content saves send the loaded `updatedAt` revision and never send lifecycle status.
The backend checks that revision under its campaign write lock. A pause or another
editor's save makes an older form conflict instead of overwriting the newer definition.
The editor preserves unsaved fields and asks the administrator to copy them before
reloading and reconciling. It never silently retries a stale form with a fresh revision.
Status changes remain explicit confirmed actions.

## Supported

- Paginated list and editor; immutable saved ID; shared `CreateCampaignInputValidator` validation with JSON field paths.
- Independently selectable `inApp`, `notify` and `email` channels (at least one required). Only selected channels require content: in-app JSON, notification title/body, or email subject/heading/body/button text with an optional HTTPS image URL. Email uses the shared server schema and locally rendered tenant-branded template. Also supports optional start/end times entered in the browser's local timezone and stored as ISO timestamps, `excludeMinors` and `selfEnroll`.
- Preview via `setInAppMessageOverride` and the existing real renderer. The existing override path suppresses dismissal storage/engagement telemetry and never calls a campaign dispatch API. Message buttons remain interactive, including navigation; leaving the editor clears the override.
- Create draft, update, confirmed live/pause/archive transitions, and confirmed `campaignsSendTestToMe` for the saved selected channels. Notification tests use the existing inbox/push queue. In-app tests persist a private snapshot for the requesting administrator and appear on the next app visit outside the editor via `getMyCampaigns`. The real renderer acknowledges presentation through `recordCampaignEvent` with a test ID. Tests do not enroll the administrator or record engagement, fatigue, or audience stats; repeated tests replace the pending snapshot for that administrator/campaign. Unsaved edits block saved-state actions. Go Live permits scheduled in-app presentation; it does not dispatch notifications.
- DID CSV with a named `did` column or a single column, quoted CSV, prefix validation, stable deduplication, sequential chunks of 1000, progress, and stopping after the current request. Completed writes are retained. Read errors and invalid rows block the whole upload. The 10 MB file limit bounds local parsing.
- Network member search plus Fields/JSON controls for email addresses, account identifiers, boost recipients, credentialsSentBy (sender/listing/metadata/since), and inboxClaims source contracts. Email matching identifies existing accounts and is separate from email delivery.
- Preview/add eligible-match counts, paged stored membership, and `campaignsGetStats` polling every 30 seconds while mounted/visible. Polling stops on route exit; stats errors identify potentially stale values.

- Audience results return `{count, added, notFound}`: eligible matches, profiles newly enrolled in this request, and input DIDs with no matching profile. Preview never adds members. Age exclusions are not reported as missing profiles; existing matches may include aliases across batches.

## Audience notification sending

For a saved live campaign with notification content and an active schedule, **Send Notifications**
loads `campaignsPreviewDispatch`. Email campaigns use **Send campaign**. Review shows separate email and inbox counts, with a distinct-profile total. It counts stored audience members who satisfy the current
age policy and have no `notifiedAt`, using the delivery worker's eligibility predicate. The
confirmation modal shows eligible inbox recipients, total stored membership, and already-notified
members. Push is an attempt through the existing notification system. Email counts require adults with exactly one valid verified primary email, email announcements enabled, and no previous email claim or acceptance. The review digest includes email addresses so changing a primary address requires a fresh review.

Confirm calls `campaignsDispatch(id, { expectedPreviewToken })`. The server rechecks the
campaign definition and eligible recipient identities under the campaign lock and consumes
the token once. A changed audience, changed content/status, or reused token requires reviewing
again. No-eligible-recipient confirmations cannot send. Cancel, Escape and the backdrop close
the review without sending. The shared modal restores focus to the send button; editing the
campaign or leaving the editor dismisses its stale review.

The worker still rechecks eligibility during paced delivery; counts are a point-in-time review,
not a promise of final inbox or device delivery. Success means dispatch started, and stats are
refetched and continue polling. Transport failures report that the request may have completed;
a fresh review is required before retrying. The existing receiver deduplication remains authoritative.

Search selection alone does not enroll or notify people: add the selected members first.
Dispatch targets the entire stored eligible audience, not just the currently selected search rows.

## Unsupported / deferred

- Inbox recipient counts do not guarantee push receipt; `notified` acknowledges inbox storage, not delivery to a device. `emailed` means provider acceptance, not inbox receipt.
- Native push receipt and email integration need separate device/service verification. Campaign notification routing is supplied by the LC-2267 parent layer.
- The existing audience minor/DOB policy is preserved. Admin-only private tests bypass audience/status/schedule eligibility, while normal campaign delivery is unchanged. lca-api enum/dedupe must deploy before brain as documented by #1839; this implementation does not deploy anything.

## Verification

### Deployed email configuration

Manage `POSTMARK_BROADCAST_STREAM` (default `broadcast`) and
`CAMPAIGN_UNSUBSCRIBE_SECRET` (stable random secret, at least 32 bytes) in the
**LearnCard Runtime** Infisical project, `/learncard/brain-service/runtime`, for
`staging` and `prod`. The existing sync and `RUNTIME_SECRETS_ID` load them into
Brain's API, email worker and unsubscribe handler. No new GitHub environment
mapping is needed in bundle mode. Confirm sync, then recycle/redeploy Brain to
reload warm functions. Rotating the signing secret invalidates old unsubscribe links.
See [campaign email runtime settings](../../../../../environment-variables.md#campaign-email-runtime-settings-brain-service)
for tenant paths, precedence and the separate local `.env` source.

### Local Docker email test

Configure `POSTMARK_API_KEY`, `POSTMARK_BROADCAST_STREAM` and a dedicated
`CAMPAIGN_UNSUBSCRIBE_SECRET` in the private Brain `.env`, then recreate the
existing stack's `brain` service to reload its environment. No environment values
belong in screenshots or test fixtures. The Postmark sender must be verified.

1. Open `/admin/campaigns?create=1` as an allowlisted local administrator.
2. Select Email, fill its subject, heading, plain-text body and button text, and save.
3. Click Send Test to Me, review the selected channels, then confirm. Email tests
   require an eligible adult account, exactly one verified primary email and email
   announcements enabled. They do not require a live campaign or audience membership.
4. Check the test inbox and Postmark stream Activity. Provider acceptance is not
   proof of inbox receipt. In-app tests appear after leaving the editor.

Local Compose overrides `DOMAIN_NAME` with localhost. Email receipt can be tested,
but externally usable one-click unsubscribe needs a public HTTPS Brain endpoint.
CTA and browser unsubscribe URLs use the tenant's email branding app URL, not the
current browser origin. A local renderer preview still previews only in-app content;
use the private email test to inspect the actual branded email.

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

## Stack integration

The composer sits above LC-2267, which sits above LC-2266 delivery. The app supplies
both the ordinary campaign source and private test delivery to the same
`InAppMessageHost`. Ordinary campaign fetching excludes entries with `testId`;
those snapshots stay in the account-bound private test path and cannot enroll
or report ordinary engagement. LaunchDarkly messages continue through the shared
selector. Announcement cards retain their authored copy and read/archive/restore
controls, while **View** marks the card read and enters the shared `/m/:id` route.
