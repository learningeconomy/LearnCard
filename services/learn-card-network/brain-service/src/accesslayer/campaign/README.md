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

`sendTestToMe` always targets the authenticated caller. It ignores audience, status, dates,
and channels, but requires notification copy. Each explicit test gets a fresh test ID;
queue retries preserve it. Test sends neither enroll the caller nor increment `notified`.
`dispatch` requires a live, in-window campaign with the `notify` channel. The queue job
contains campaign ID, creation timestamp, dispatch ID and an optional profile-ID cursor.
The creation timestamp prevents old jobs from applying to a deleted/recreated campaign.

Audience pages are ordered by profile ID, reapply the existing age policy and default to
1000 recipients. Full pages schedule the next cursor after 60 seconds. Thus 2500 recipients
use three waves; an exact multiple can schedule an empty final page. The defaults are
configurable through `CAMPAIGN_DISPATCH_PAGE_SIZE` and `CAMPAIGN_DISPATCH_DELAY_SECONDS`.
A re-dispatch starts at the beginning, including newly added members with earlier IDs,
and skips recipients with `notifiedAt`.

Announcements include `metadata.campaignHasInApp`, true only for an enabled in-app
channel on an ordinary delivery. Notification-only campaigns, disabled messages,
and admin notification self-tests fall back to the inbox. Clients require an explicit
true flag before routing to `/m/:id` or showing the inbox card's View action. Older
stored announcements without the flag also stay in the inbox.

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

### Custom webhook compatibility

Audience selection does not exclude profiles with a custom `notificationsWebhook`.
Their endpoint takes precedence over the default lca-api webhook in hosted environments;
do not assume every audience member uses the LearnCard inbox. An arbitrary HTTP 2xx
response is not proof of durable storage for ANNOUNCEMENT notifications. Compatible
receivers must persist the notification before returning JSON `true`, or a boolean
`sent`, `success`, or `ok` flag set to `true` (also accepted under `data` or `result.data`).
An explicit `false` is a negative acknowledgement. Empty responses (including 204),
plain text, and unrecognized JSON such as `{"status":"ok"}` remain uncertain and retry;
they do not advance `notifiedAt`.

Custom receivers must deduplicate retries by sender DID, recipient DID, `campaignId`,
and `campaignCreatedAt`, adding `campaignTestId` for test sends. Return the same positive
acknowledgement for an already stored notification without repeating downstream effects.
Only lca-api's implementation is covered by the inbox/push deduplication guarantee above.
For a custom receiver, `notified` means its durable-storage acknowledgement was received,
not that a LearnCard inbox card or device push exists. Before including custom-webhook
profiles in a pilot, confirm this contract with the receiver owner using disposable test
profiles; exclude incompatible receivers from the pilot audience until adapted. Production
audiences and third-party implementations have not been inventoried by this change.

### Worker network access

The shared notifications worker uses `PrivateSubnetA` because campaign eligibility and
acknowledgement need private graph/cache access. This applies to all notification types.
`serverless.yml` declares the outbound path as `PrivateSubnetA` → `PrivateRouteTable`
→ `PrivateRoute` (`0.0.0.0/0`) → `NatGateway` in `PublicSubnetA` → `PublicRouteTable`
→ `PublicRoute` → `InternetGateway` attached to the VPC. The NAT has an Elastic IP;
`ServerlessSecurityGroup` uses AWS's default outbound allowance. A configuration
regression test protects this complete path.

Private connectivity does not authorize profile-selected HTTP destinations. All hosted
notification delivery (ordinary notifications, campaigns, explicit queue overrides and
the default configured webhook) goes through `notification-webhook-fetch.helpers.ts`.
It accepts HTTP(S) URLs without credentials, rejects nonpublic IP literals, and checks
every DNS answer before pinning the HTTP connection to a validated literal IP. HTTP Host,
TLS SNI and certificate verification retain the original hostname. Mixed public/private
answers and resolution errors fail closed; every attempt resolves again. The transport
never resolves the hostname a second time, preventing DNS rebinding.
The IPv6 policy permits global unicast only, excluding special-purpose, documentation
and transition ranges. Redirects are rejected, so neither the JWT nor notification body
can be forwarded to a redirect target. The explicit HTTP(S) transport avoids runtime fetch dispatcher differences
on Node and Bun, and caps acknowledgement bodies at 64 KiB. A blocked delivery does not advance `notifiedAt`; queue failures retain
the existing retry/dead-letter behavior.

Hosted custom webhooks must resolve exclusively to public addresses and respond directly
at the configured URL. Private default endpoints are also rejected; no profile or queued
payload can opt out. Only the trusted `IS_OFFLINE` runtime flag permits local development
destinations, with redirects still disabled. `NODE_ENV=test` is not an exemption.

This establishes the source configuration, not the deployed AWS state. Before rollout,
verify the target stack's subnet/route associations, available NAT and internet gateway,
and effective security-group/network-ACL egress, then exercise an operator-controlled
external webhook from that worker using a disposable profile. Check both an ordinary
notification and a campaign acknowledgement. Local and hosted CI do not prove live NAT
connectivity; no deployment or live delivery is performed by these tests.

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

### Concurrent authoring

Content editors should pass the loaded campaign's `updatedAt` as `expectedUpdatedAt`
to `campaignsUpdate`, and leave lifecycle status changes to `campaignsSetStatus`.
The server compares the token after acquiring the campaign write lock and rejects
stale saves with `CONFLICT`. Reload the latest definition before reconciling edits;
never automatically retry a full stale form against a fresh token. Successful
writes advance the timestamp monotonically, including same-millisecond writes.
Legacy SDK callers may omit the optional token; those callers retain existing
last-write behavior and do not receive optimistic concurrency protection.

## Announcement email (LC-2268)

Campaigns can include `email` alongside `inApp` and `notify`. Supply `email.subject`,
`title`, `body`, and `ctaLabel`; `heroImageUrl` is optional and must be HTTPS. Body
copy is plain text, escaped by React. Keep announcement copy free of private learner
or credential data. Create records capture the request's resolved tenant; queued
waves use that stored tenant for branding and `/m/<id>?utm_source=email&utm_campaign=<id>`.
Legacy records without a tenant use the configured default tenant.
The CTA origin comes from the deployment-owned `CAMPAIGN_APP_ORIGINS` JSON map.
Stage configs map LearnCard staging to `staging.learncard.ai`, VetPass staging to
`staging.vetpass.app`, and ScoutPass staging to `staging.pass.scout.org`. Production
configs supply their corresponding production origins. Queued sends do not use
request headers to choose an app origin. Custom deployments must configure a map;
missing, malformed, credential-bearing or non-origin URLs fail preparation before
the durable email claim. HTTP is allowed only for loopback development origins.

Email dispatch requires `POSTMARK_API_KEY`, `DOMAIN_NAME` (the public Brain host),
`POSTMARK_BROADCAST_STREAM` (default `broadcast`) and `CAMPAIGN_UNSUBSCRIBE_SECRET`
(a dedicated random secret of at least 32 bytes). The adapter checks the actual
Postmark stream type is `Broadcasts`; transactional streams are rejected. Provisioning
these values, enabling a stream, deployment and live sends are separate operator
steps. No production configuration is included here. `CAMPAIGN_EMAIL_PAGE_SIZE`
defaults to 500 (1–1000); email and notification jobs keep independent cursors and
use `CAMPAIGN_DISPATCH_DELAY_SECONDS` between waves.

Email requires exactly one valid primary verified ContactMethod email, a known adult
profile under the existing campaign adult policy, and no announcement email opt-out.
Email waves filter adult eligibility and opt-outs before pagination, then recheck both
under the profile lock before reserving a send. Audience management still lists opted-out members.
Unknown ages, children, managed non-service profiles and minors fail closed even if
`excludeMinors` is false. Parent age-policy sign-off is still outstanding: this does
not authorize marketing to minors. Self-tests bypass audience/status only; they retain
email eligibility and preferences and do not change production statistics.

A profile lock serializes durable `emailClaimedAt` reservations. A claim commits before
provider I/O; accepted sends set `emailedAt` and contribute to `getStats().emailed`.
Retries, concurrent workers and redispatch cannot resend a reserved recipient. This
is **at-most-once attempt**, not guaranteed delivery: a crash before sending or lost
provider acknowledgement leaves a reservation with no `emailedAt`. There is no automatic
lease expiry/replay; an operator must investigate delivery with the provider before any
future recovery design permits another send. Never clear claims blindly. Provider
acceptance is not proof of inbox delivery. Archive/pause, generation, membership,
age, contact and opt-out state are checked at the reservation boundary.

Browser unsubscribe links use the sending Brain service's anonymous
`/campaigns/unsubscribe/browser?token=...` confirmation page, including ScoutPass.
GET renders a form; POST applies the opt-out and renders confirmation. This page
uses no external assets or analytics, sends no-store/no-referrer/CSP headers, and
supports English, Spanish, French and Arabic using the browser language.
The `List-Unsubscribe` header uses the Brain HTTPS
`/campaigns/unsubscribe?token=...` endpoint: it accepts the actual RFC 8058
`application/x-www-form-urlencoded` POST `List-Unsubscribe=One-Click`, without login,
cookies, redirects or JavaScript. GET does not mutate. Both POST paths verify the same
purpose-separated HMAC token, then idempotently set the profile's email opt-out.
Version 2 tokens bind to a unique, durable `campaignUnsubscribeId` allocated under
the recipient lock before sending. Renaming a profile preserves its links; reusing
or deleting a profile name never transfers those links to another account. Legacy
name-based tokens are rejected because their original recipient cannot be resolved
safely after a rename. Generate a new test email to replace an old test link.
Links remain valid after campaign archive/deletion; rotating the secret invalidates
old links. Tokens are bearer authority for opt-out only, not authentication. Do not
log token URLs or capture them in analytics; ingress/proxy access-log redaction for
this endpoint must be checked at deployment. The public endpoint returns no profile data.

Authenticated `getAnnouncementPreferences` and `updateAnnouncementPreferences` return
and patch `announcementEmailOptOut` / `announcementPushOptOut`. SDK methods use these
same names, plus anonymous `unsubscribeFromAnnouncements(token)`. Preference fields
are private graph properties, omitted from public profile projections. Push opt-out
suppresses both campaign push and inbox at enqueue/delivery checks; in-app selection
is unaffected. Partial patches leave the other choice unchanged.

Before rollout, use mocked adapter/HTTP tests and the campaign Neo4j suite. Separately
verify real broadcast receipt and headers, configured public POST ingress, and cold/warm
`/m/` universal-link handoff on web, iOS and Android in an authorized environment.
The composer still needs its email controls, counts/wiring and CSV result follow-up.
