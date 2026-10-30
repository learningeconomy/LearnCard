# Campaigns: setup, audiences and engagement (LC-2265)

This service stores campaign definitions, server-selected audiences, shared engagement
state and paced notification delivery. LC-2267 owns app rendering and tap routing. It does not require the in-app messages V2
branches: `message` uses the shared `InAppMessage` schema available in this checkout.

## Administration and lifecycle

Configure `CAMPAIGN_ADMIN_PROFILE_IDS` as a private, comma-separated profile allowlist.
It is empty by default. Every management operation requires both an allowlisted profile
and the `campaigns:admin` scope (or `*:*`). The authenticated `isAdmin` discovery query
returns a boolean, like App Store administration; it exposes no campaigns or audiences.
User queries need `campaigns:read`, and enrollment/events need `campaigns:write`.
SDK API tokens also need `profiles:read` for the plugin's profile check.

```ts
// `client` is an authenticated brain-client; campaignAdmin is allowlisted.
const campaign = await client.campaigns.create.mutate({
    id: 'transcript-pilot-v1',
    name: 'Transcript pilot',
    channels: ['inApp'],
    message: { title: 'Explore your next step', frequency: 'once' },
});
await client.campaigns.setStatus.mutate({ campaignId: campaign.id, status: 'live' });
```

IDs are immutable, lowercase `[a-z0-9-]{3,64}`, unique, and always replace `message.id`.
Creation defaults to `draft`, `excludeMinors: true`, `selfEnroll: false`. Supported statuses
are `draft`, `live`, `paused`, `archived`; archived campaigns cannot be edited or have
audience members added. Only drafts and archived campaigns can be deleted: archive a live or paused
campaign first. Live and paused campaigns cannot transition back to draft. Admin deletion removes
the campaign and its relationships.
Use a new ID for a new campaign; deleting/reusing an ID cannot clear clients' local seen state.

`channels` must contain `inApp`, `notify`, or both without duplicates. `notify` requires
`notification: { title, body }`, but sends only after an explicit test or dispatch. Dates are ISO
timestamps normalized to UTC; `startsAt` is inclusive and `endsAt` is exclusive. If both
exist, the end must follow the start. Partial updates preserve omitted fields; `null`
clears optional notification/start/end fields. Updates replace `message` as a whole.

## Audience sources

Preview is read-only. Adding an audience merges distinct profiles and preserves the first
membership's `addedAt` and `source`, including `selfEnrolled`. Both calls return
`{ count }`: the number of eligible matching profiles, **not** the number of new edges.
Overlapping or repeated additions therefore return their matched count without duplicating
membership. These are snapshots, not subscriptions to later credential claims/revocations.

```ts
import type { CampaignAudienceSource } from '@learncard/types';

const campaignId = 'transcript-pilot-v1';
const sources: CampaignAudienceSource[] = [
    { type: 'dids', dids: ['did:key:example'] },
    { type: 'emails', emails: ['learner@example.org'] },
    {
        type: 'credentialsSentBy',
        senderProfileId: 'university-transcripts',
        metadata: { kind: 'transcript' },
        since: '2026-01-01T00:00:00Z',
        includePending: false,
    },
    {
        type: 'credentialsSentBy',
        listingId: 'university-transcript-app',
        metadata: { kind: 'transcript' },
        includePending: false,
    },
    { type: 'inboxClaims', issuerDid: 'did:key:issuer', since: '2026-01-01T00:00:00Z' },
    {
        type: 'boostRecipients',
        boostUri: 'lc:network:network.example.org/trpc:boost:example',
        includePending: false,
    },
];

for (const source of sources) {
    const preview = await client.campaigns.previewAudience.query({ campaignId, source });
    // Review preview.count before adding. Counts can change if source data changes.
    await client.campaigns.addAudience.mutate({ campaignId, source });
}
const page = await client.campaigns.pageAudience.query({ campaignId, limit: 100 });
// Next request: { campaignId, limit: 100, cursor: page.cursor }, while page.hasMore.
```

- DID/email lists accept 1–1000 entries per call. DIDs match stored DIDs or this network's
  canonically encoded `did:web:<domain>:users:<profileId>` alias. Emails are trimmed/lowercased
  and only verified contact methods qualify; the profile's display email is not used.
- `credentialsSentBy` requires exactly one sender profile or listing. All metadata entries
  must match exactly on `CREDENTIAL_SENT.metadata.*`; `since` filters the send date. Metadata is
  limited to 20 keys, with values of at most 2048 characters.
  Keys are validated and values are bound parameters, never interpolated into Cypher.
- `inboxClaims` matches the stored issuer DID and filters the **claim** timestamp.
- Boost URIs must identify a boost on this network. Credential sources exclude revoked
  sends/receipts even with `includePending: true`. Unaccepted sends and pending receipts
  only qualify when that option is true. Recipient matching uses each send's `to` profile.
- Paging uses ascending profile IDs and reapplies the campaign's current minor policy.
  `getStats().audience` counts stored membership, which may exceed currently eligible paging
  results if the profile or campaign age policy changes.

Issuers should use a **dedicated sending profile or listing** for transcripts and attach
`metadata: { kind: 'transcript' }` when calling `sendCredential`. The server cannot inspect
encrypted credential contents; a metadata label is not proof of CLR type or ownership.

## Two-layer targeting and self-enrollment

The server narrows the audience from visible metadata. In the later app-integration slice,
the device must still confirm a rule such as issuer X **and** `vcTypes: ['ClrCredential']`
on the same credential before displaying the campaign. This backend does not import the
V2 targeting engine, evaluate those rules, or send decrypted credentials to the server.

`getMyCampaigns` returns live, in-window, enabled `inApp` campaigns for audience members,
plus eligible campaigns with `selfEnroll: true`, joined to the caller's engagement state.
Malformed legacy campaign definitions are logged and skipped per record so one bad campaign cannot
break discovery for every profile.
Discoverability is not enrollment: `recordEvent` is a no-op until membership exists.
After a local match, the client can call `enroll({ campaignId })`. Enrollment requires a
live, in-window, enabled `inApp` campaign with self-enrollment enabled and is idempotent.
Only profiles with a known adult birthday can self-enroll, even when the campaign has
`excludeMinors: false`.

**Privacy disclosure:** enrollment tells the server only that this profile matched a
campaign. That membership can itself reveal sensitive information. Authors must write
rules that reveal no more than needed. No credential content or targeting evidence is
accepted by the enrollment/event endpoints, and campaign routes disable Sentry input capture.

**Product/legal sign-off is still required for the age policy.** The implemented policy
excludes missing, empty, and non-date-format birthdays from every audience, including when
`excludeMinors: false`. It also excludes `type: 'child'`, guardian-managed human profiles, and
known under-18 birthdays when `excludeMinors` is enabled. Managed service/organization profiles
remain age-exempt unless explicitly typed as a child. Age uses UTC calendar dates; a Feb 29 birthday
reaches the cutoff on March 1 in a non-leap year. No policy approval or production rollout is implied
by this PR.

## Engagement and SDK

`recordEvent({ campaignId, event })` accepts `shown`, `clicked`, `dismissed`, `converted`.
It returns `false` without profile-lock or engagement writes for missing campaigns, nonmembers,
age-ineligible profiles, and campaigns that are not currently live and in-window.
`shown` sets `firstShownAt` once, updates `lastShownAt`, and increments `shownCount`.
Other events store their latest timestamp. Per-profile transactional locking prevents
duplicate state edges and lost increments under concurrent devices. Repeated requests
are separate events, not transport-idempotent retries.

Stats count distinct profiles, not impressions; `enrolled` counts memberships originally
created by self-enrollment. `notified` counts durable inbox acknowledgements and is not client-writable.
All user/discovery calls share a 60-call/profile/minute rate limit; admin operations do not.

The network plugin exposes `learnCard.invoke.getMyCampaigns()`,
`recordCampaignEvent(campaignId, event)`, `enrollInCampaign(campaignId)`, and the admin
methods `campaignsIsAdmin`, `campaignsCreate`, `campaignsUpdate`, `campaignsGet`,
`campaignsList`, `campaignsDelete`, `campaignsSetStatus`, `campaignsPreviewAudience`,
`campaignsAddAudience`, `campaignsPageAudience`, `campaignsGetStats`. The brain-client
derives these routes from `AppRouter`; there is no separate hand-written client schema.

## Verification

```bash
cd services/learn-card-network/brain-service
bun run test:campaigns
```

This starts a disposable Neo4j testcontainer, uses synthetic accounts/configuration, and
does not read the developer's database. Docker is required. The suite covers all source
types, permissions, injection rejection, minor rules, paging, lifecycle, enrollment and
concurrent shared state. Schema tests live in `@learncard/types`; SDK forwarding tests
live in `@learncard/network-plugin`. Hosted CI runs the Neo4j suite separately from the
service's default unit suite. No app UI or device QA is claimed. Delivery coverage is described below.

The hosted Linux verification workflow also runs `test/verification/campaigns.ts` via
`lc verify script` after the full catalog: real signed SDK calls prove non-admin denial
and user isolation over HTTP. The default stack grants no admin access, so positive
administration and graph mutations are covered by the dedicated Neo4j suite instead.

## Notification delivery (LC-2266)

```ts
// Allowlisted administrator, with campaigns:admin scope.
await learnCard.invoke.campaignsSendTestToMe('transcript-pilot-v1');
await learnCard.invoke.campaignsSetStatus('transcript-pilot-v1', 'live');
const { dispatchId } = await learnCard.invoke.campaignsDispatch('transcript-pilot-v1');
```

`sendTestToMe` always targets the authenticated administrator and tests the selected channels.
It ignores audience, status and dates. `notify` uses the saved notification copy and existing
notification queue; `inApp` stores a private snapshot on a `CAMPAIGN_TEST` relationship.
In-app JSON is optional for notification-only campaigns, and notification copy is optional
for in-app-only campaigns. At least one channel and its corresponding content are required.
Each explicit test gets a fresh test ID; notification queue retries preserve it.

The existing `getMyCampaigns` endpoint includes pending private snapshots only for their
requesting administrator, with a `testId`. Reading does not consume a test. After the real
renderer presents it, `recordEvent` with `{ campaignId, event: 'shown', testId } removes that
snapshot without writing engagement state. A stale acknowledgement cannot remove a newer
snapshot. The latest test replaces the pending one for that administrator/campaign; deleting
the campaign deletes its pending tests. LearnCard App fetches on entry/return outside the
composer, keeps tests account/network-scoped, and does not send their events to analytics.
Test sends neither enroll the caller nor increment campaign stats.
`dispatch`requires a live, in-window campaign with the`notify` channel. The queue job
contains campaign ID, creation timestamp, dispatch ID and an optional profile-ID cursor.
The creation timestamp prevents old jobs from applying to a deleted/recreated campaign.

Audience pages are ordered by profile ID, reapply the existing age policy and default to
1000 recipients. Full pages schedule the next cursor after 60 seconds. Thus 2500 recipients
use three waves; an exact multiple can schedule an empty final page. The defaults are
configurable through `CAMPAIGN_DISPATCH_PAGE_SIZE` and `CAMPAIGN_DISPATCH_DELAY_SECONDS`.
A re-dispatch starts at the beginning, including newly added members with earlier IDs,
and skips recipients with `notifiedAt`.

The worker sends ANNOUNCEMENT via the existing notification queue. Each recipient is
checked again before enqueue and before webhook delivery. Paused, archived, expired,
deleted, no-longer-notify and age-ineligible campaigns/recipients stop future delivery;
a send already in flight at a pause can still complete. Resume with an explicit dispatch.
The local fallback awaits all waves and their delays and loses unfinished work on process
exit; use a small page size/delay during development and SQS for production.

### Retry and statistics boundary

Enqueue and Neo4j are separate systems: duplicate queue messages are expected after a
lost enqueue response, concurrent dispatches, worker retries or acknowledgement failure.
There is deliberately no pre-send `notifiedAt` marker that could silently lose deliveries.
lca-api atomically inserts one inbox record using its Mongo `_id` uniqueness constraint,
keyed by sender, recipient, campaign ID and creation timestamp (plus test ID for tests).
Only the inserting request attempts push. Retries preserve existing read/archive state
and copy. This is a narrowly approved extension of the ticket's original enum-only scope;
it leaves the existing FCM delivery path intact.

After lca-api acknowledges durable storage, brain records `notifiedAt` under the same
profile lock as engagement writes. Queue acceptance alone is not counted. If that graph
write fails, the notification retries; lca-api returns success for the existing record
without another push attempt. Stats measure acknowledged inbox storage, **not** device
receipt. FCM remains best effort: a crash between inbox insertion and push, or a push
failure, can leave an inbox card without push. There is no exactly-once device guarantee.
Receiver deduplication lasts while the inbox record exists; hard-deleting it before an
unacknowledged retry can permit reinsertion. Production pilot QA must include this existing
notification retention limitation.

### Deployment and proof

Deploy lca-api (enum plus campaign deduplication), then brain, then the separate app
integration. Pilot with draft → audience preview → test-to-me → live → dispatch. This
implementation does not authorize deployment or any real audience send. Preserve LC-2265's
age policy and obtain its documented product/legal sign-off before a pilot.

Focused tests cover three-wave paging, delays, eligibility, stable retry identities,
receiver deduplication and acknowledgement failures. The Neo4j campaign suite covers
admin denial, caller-only tests, concurrent state acknowledgements and stats. The lca-api
notification integration suite covers concurrent receiver storage and push suppression.
Hosted `lc verify` additionally exercises SDK authorization; it does not provision FCM
or prove iOS/Android device receipt. Those require separately authorized device QA.

## Reviewed dispatch from the composer

`campaigns.previewDispatch` is an admin-only, read-only query taking `{ campaignId }`.
The SDK exposes it as `learnCard.invoke.campaignsPreviewDispatch(campaignId)`.
It returns `audienceCount`, `alreadyNotifiedCount`, `recipientCount`, `previewToken`,
and an optional `blockedReason` (`not_live`, `notify_disabled`, `not_started`, `ended`,
`no_recipients`). Recipient counts use the same minor/date-of-birth policy as delivery
and exclude profiles with `notifiedAt`. They count inbox recipients; push receipt is
not guaranteed, and no email count is claimed.

After reviewing the count, pass `{ expectedPreviewToken: preview.previewToken }` as
the second argument to `learnCard.invoke.campaignsDispatch`. The route accepts that
optional field alongside `campaignId`. Legacy dispatch callers can omit it; the composer
always supplies it. Under the campaign node lock, the server recomputes a digest over
the definition, mutation revision, and sorted eligible profile IDs, rejects stale previews
with `CONFLICT`, and advances the revision to consume the confirmation once. This catches
same-count recipient changes as well as ordinary audience edits. No recipients or invalid
status/schedule/channel is rejected before enqueue. Preview does not mark anyone notified.

The count query collects eligible profile IDs internally to fingerprint the recipient set;
those IDs are not returned by the API. Its memory use scales with eligible audience size.
The confirmation lock is released before queue/network work. Later waves still use current
eligibility and audience semantics, so the reviewed count is a snapshot rather than a frozen
send list. Existing queue retries and receiver deduplication remain unchanged. If enqueue
fails or the HTTP response is lost, review again before retrying; never reuse the old token.
