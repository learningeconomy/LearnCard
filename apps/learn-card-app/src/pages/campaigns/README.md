# Private campaign composer

LC-2270 provides URL-only `/admin/campaigns` and `/admin/campaigns/:id` routes. `/admin/campaigns/new` creates a draft. `campaignsIsAdmin` must succeed before list/editor data loads; denied users see a generic not-found page. Each account/network session owns a non-persisted query cache. Server authorization remains authoritative for every operation.

## Supported

- Paginated list and editor; immutable saved ID; shared `CreateCampaignInputValidator` validation with JSON field paths.
- `inApp` and `notify` channels, optional start/end times entered in the browser's local timezone and stored as ISO timestamps, notification title/body, `excludeMinors` and `selfEnroll`.
- Preview via `setInAppMessageOverride` and the existing real renderer. The existing override path suppresses dismissal storage/engagement telemetry and never calls a campaign dispatch API. Message buttons remain interactive, including navigation; leaving the editor clears the override.
- Create draft, update, confirmed live/pause/archive transitions, and confirmed `campaignsSendTestToMe` for the saved notification. Unsaved edits block saved-state actions. Go Live permits scheduled in-app presentation; it does not dispatch notifications.
- DID CSV with a named `did` column or a single column, quoted CSV, prefix validation, stable deduplication, sequential chunks of 1000, progress, and stopping after the current request. Completed writes are retained. Read errors and invalid rows block the whole upload. The 10 MB file limit bounds local parsing.
- Boost recipients with include-pending; validated advanced JSON for the existing emails, credentialsSentBy (sender/listing/metadata/since), and inboxClaims source contracts. Email matching identifies existing accounts and is separate from email delivery.
- Preview/add eligible-match counts, paged stored membership, and `campaignsGetStats` polling every 30 seconds while mounted/visible. Polling stops on route exit; stats errors identify potentially stale values.

## Unsupported / deferred

- Email delivery controls or an emailed metric. Current delivery channels are only `inApp` and `notify`.
- Full-audience Send Notifications remains disabled. The backend has dispatch SDK support, but no exact eligible per-channel count for the required confirmation. There is no `getAudienceSize` endpoint. `stats.audience` is stored membership; it must never be labeled an exact send count. `notified` acknowledges inbox storage, not delivery to a device.
- Newly added counts and per-row `notFound` CSV results. Preview/add return `{count}` of eligible matches, including existing members. DID aliases can resolve to the same profile, so totals across chunks must not be called unique recipients.
- Notification tap routing: LC-2267. Native push receipt and email integration need separate device/service verification.
- No backend policy changes. The existing minor/DOB policy is preserved. lca-api enum/dedupe must deploy before brain as documented by #1839; this implementation does not deploy anything.

## Verification

Run the focused model/component tests with `bun run --cwd apps/learn-card-app test -- src/pages/campaigns`. They cover access denial/failure, mutation errors, repeated clicks, unsaved navigation, optional field clearing, caller-only confirmation, local preview cleanup, CSV cancellation, source contracts and polling teardown.

Run `PW_MOCK_PORT=3027 PW_RECORD_VIDEO=true bun run --cwd apps/learn-card-app test-mock -- campaigns.mocked.spec.ts --workers=1` for the real UI against synthetic mocked services, including a 10,000-row upload and mobile layout. For local Chromium QA, run from the app directory: `PW_MOCK_PORT=3028 PW_RECORD_VIDEO=true bunx playwright test --config=playwright.campaigns.config.ts`. Never use recording mode or production notification endpoints for these tests. Network simulations are not proof of backend delivery.

The repository's full `lc verify` owned-stack gate requires Linux. On macOS use the secret-free LearnCard Verification workflow on the exact branch head, retaining its result separately from mocked browser evidence. The catalog does not yet include this new composer; do not describe a generic catalog pass as composer-specific end-to-end proof.
