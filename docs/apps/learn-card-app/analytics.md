# Analytics

The LearnCard App uses a provider-agnostic analytics abstraction layer. Application code tracks events through a single `useAnalytics()` hook — the underlying provider (Firebase, PostHog, or a no-op) is swapped via an environment variable without touching any component code.

---

## Architecture

```
Component
    └── useAnalytics()           ← single hook, no provider knowledge
            └── AnalyticsContext
                    └── AnalyticsProvider (interface)
                            ├── FirebaseProvider   (VITE_ANALYTICS_PROVIDER=firebase)
                            ├── PostHogProvider    (VITE_ANALYTICS_PROVIDER=posthog)
                            └── NoopProvider       (default / dev)
```

All providers implement the same interface: `init`, `identify`, `track`, `page`, `reset`, `setEnabled`.

Source files live in `apps/learn-card-app/src/analytics/`.

---

## Tracking an Event in a Component

```tsx
import { useAnalytics, AnalyticsEvents } from '@analytics';

function MyComponent() {
    const { track } = useAnalytics();

    const handleClaim = () => {
        track(AnalyticsEvents.CLAIM_BOOST, {
            method: 'Claim Modal',
            boostType: 'Achievement',
        });
    };
}
```

TypeScript enforces the correct payload shape for each event — passing wrong or missing properties is a compile error.

{% hint style="info" %}
When `VITE_ANALYTICS_PROVIDER` is not set, the NoopProvider is used and all calls are silent no-ops. No configuration is needed for local development.
{% endhint %}

---

## Adding a New Event

**Step 1.** Add a key to `AnalyticsEvents` in `apps/learn-card-app/src/analytics/events.ts`:

```ts
export const AnalyticsEvents = {
    // ... existing events ...

    MY_NEW_EVENT: 'my_new_event',
} as const;
```

**Step 2.** Add the payload type to `AnalyticsEventPayloads` in the same file:

```ts
export interface AnalyticsEventPayloads {
    // ... existing payloads ...

    [AnalyticsEvents.MY_NEW_EVENT]: {
        someRequiredProp: string;
        someOptionalProp?: number;
    };
}
```

**Step 3.** Call `track()` at the appropriate call site:

```ts
track(AnalyticsEvents.MY_NEW_EVENT, {
    someRequiredProp: 'value',
});
```

That's it — no provider-specific code needed.

---

## Providers

| Provider | `VITE_ANALYTICS_PROVIDER` value | When to use |
|----------|--------------------------------|-------------|
| **Noop** | _(unset)_ | Local development; logs to console in dev mode |
| **Firebase** | `firebase` | Production (current default) |
| **PostHog** | `posthog` | Production (requires `VITE_POSTHOG_KEY`) |

### Local development

To test event firing locally, set the provider in `apps/learn-card-app/.env.local`:

```env
VITE_ANALYTICS_PROVIDER=noop
```

The NoopProvider logs every call to the browser console:

```
[Analytics:Noop] track { event: 'claim_boost', properties: { method: 'Claim Modal' } }
[Analytics:Noop] identify { userId: 'did:key:...' }
```

### PostHog (when configured)

```env
VITE_ANALYTICS_PROVIDER=posthog
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com   # optional, defaults to posthog.com
```

The PostHog SDK is lazy-loaded and excluded from the initial bundle when `VITE_ANALYTICS_PROVIDER` is not `posthog`.

---

## Screen / Page Tracking

Page views are tracked globally. `SideMenu.tsx` calls `page(location.pathname)` on every route change, so no per-screen instrumentation is needed for basic navigation tracking.

For custom screen names, use the `page` method directly:

```ts
const { page } = useAnalytics();
page('/my-custom-screen');
```

---

## Age Gating (`useAnalyticsAgeGate`)

`useAnalyticsAgeGate` is wired into `AppRouter.tsx` and automatically calls `setEnabled(false)` for users who are under 18 or using a child profile. No per-component work is needed.

When LC-1594 (full privacy preferences system) ships, it will replace this hook by calling `setEnabled()` based on stored user preferences. The `setEnabled` method exists on all providers and is the intended integration surface.

---

## Event Catalog

| Constant | Event string | Description |
|----------|-------------|-------------|
| `CLAIM_BOOST` | `claim_boost` | User claims a credential via any method |
| `BOOST_CMS_PUBLISH` | `boostCMS_publish` | Admin publishes a boost (draft or live) |
| `BOOST_CMS_ISSUE_TO` | `boostCMS_issue_to` | Admin selects recipients in CMS |
| `BOOST_CMS_CONFIRMATION` | `boostCMS_confirmation` | Admin confirms issuance in CMS |
| `BOOST_CMS_DATA_ENTRY` | `boostCMS_data_entry` | Admin enters data in CMS form |
| `GENERATE_SHARE_LINK` | `generate_share_link` | User generates a share link for a credential |
| `GENERATE_CLAIM_LINK` | `generate_claim_link` | User generates a claim link |
| `SELF_BOOST` | `self_boost` | User sends a boost to themselves |
| `SEND_BOOST` | `send_boost` | User sends a boost to another user |
| `SCREEN_VIEW` | `screen_view` | Manual screen view (auto-tracked via `page()`) |
| `LOGIN` | `login` | User completes authentication |
| `AI_CHAT_SESSION_STARTED` | `ai_chat_session_started` | User starts a new AI chat session (internal or external app) |
| `AI_INSIGHTS_TAB_SWITCHED` | `ai_insights_tab_switched` | User switches tabs on the AI Insights page |
| `ONBOARDING_COMPLETED` | `onboarding_completed` | New user completes onboarding and creates a profile |
| `CONSENT_FLOW_STARTED` | `consent_flow_started` | User lands on a consent flow page |
| `CONSENT_FLOW_ACCEPTED` | `consent_flow_accepted` | User clicks Continue on the consent flow landing page |
| `LAUNCHPAD_APP_CLICKED` | `launchpad_app_clicked` | User clicks Connect or Open on a LaunchPad app card |
| `LAUNCHPAD_QUICKNAV_ACTION_CLICKED` | `launchpad_quicknav_action_clicked` | User clicks an action button in the LaunchPad quick navigation modal |
| `LAUNCHPAD_APP_INSTALLED` | `launchpad_app_installed` | User installs an app from the App Store detail page |

For payload types, see `apps/learn-card-app/src/analytics/events.ts`.

---

## LC-1853: Profile-Building Analytics

These events answer five PM questions about how users build their LearnCard profile:

1. **Time-to-build** a profile (time-to-value)
2. **Which methods** people use to add data (channel attribution)
3. **Per-method duration** (efficiency)
4. **Activation threshold** for AI features (how much data before users engage?)
5. **Sub-flow timing**: time to import all credentials; Skills Profile self-articulation funnel

### Design Decisions

- **Two-event model**: `profile_item_added` fires **alongside** existing `CLAIM_BOOST` / `SELF_BOOST` (does NOT replace them). Existing dashboards keep working.
- **Snapshot-before-mutation**: The `useProfileSnapshot()` hook reads credential count _before_ any mutation. Consumers must capture into a ref before calling the mutation, then compute `totalItemsAfter = snapshotRef.current.credentialCount + 1` arithmetically (do NOT re-read after mutation — LearnCloud index may lag).
- **Privacy gate**: All analytics calls are already gated by the app-level `usePrivacyGate` / `AnalyticsContextProvider`. No per-call gates needed.

### New Events

| Constant | Event string | Description |
|----------|-------------|-------------|
| `ACCOUNT_CREATED` | `account_created` | Fires once per user (localStorage gate). Marks signup/return |
| `PROFILE_ITEM_ADDED` | `profile_item_added` | Fires alongside existing claim/self-boost events at each method site |
| `ENGAGEMENT_SIGNAL` | `engagement_signal` | Fires when user engages with AI features or returns after >24h |
| `SKILL_PROFILE_STEP_STARTED` | `skill_profile_step_started` | Skills Profile step funnel: step loaded |
| `SKILL_PROFILE_STEP_COMPLETED` | `skill_profile_step_completed` | Skills Profile step funnel: step completed |
| `SKILL_PROFILE_COMPLETED` | `skill_profile_completed` | Skills Profile fully completed (after step 5) |
| `SKILL_PROFILE_ABANDONED` | `skill_profile_abandoned` | Skills Profile step abandoned (unmount without completion) |

### New Types

**`ProfileBuildMethod`** enum (used by `profile_item_added.method`):

| Value | Description |
|-------|-------------|
| `notification` | Claimed via notification card |
| `claim_link` | Claimed via claim link URL |
| `dashboard` | Claimed from dashboard |
| `vc_api_request` | Accepted via VC-API exchange |
| `self_issue` | Self-issued boost |
| `received_boost` | Auto-accepted inbox credential |
| `self_articulation` | Self-articulated skill |
| `skills_profile_data` | Skills profile step data saved |
| `consent_flow` | Accepted consent flow |
| `resume_import` | Imported from resume (future) |

**Note**: The existing `CLAIM_BOOST.method` uses PascalCase strings (`'Claim Modal'`, `'Dashboard'`, `'VC-API Request'`, `'Notification'`). These are kept for backwards compatibility. The new `ProfileBuildMethod` enum uses snake_case and is for `profile_item_added` only.

### Retrofitted Fields

`msSinceMethodStarted` (optional `number`) has been added to:

- `CLAIM_BOOST` — ms from component mount to successful claim
- `SELF_BOOST` — ms from component mount to successful self-boost
- `SEND_BOOST` — ms from component mount to successful send
- `ONBOARDING_COMPLETED` — ms from component mount to onboarding completion

These are additive (optional) fields. Existing dashboards are unaffected.

### PM Questions → Events Mapping

| PM Question | Events | Key Properties |
|-------------|--------|----------------|
| Q1 Time-to-build | `account_created` → first `profile_item_added` | `msSinceAccountCreated` |
| Q2 Which methods | `profile_item_added` | `method` breakdown |
| Q3 Per-method duration | `profile_item_added` + retrofitted `CLAIM_BOOST` etc. | `msSinceMethodStarted` |
| Q4 Activation threshold | `engagement_signal` | `profileSnapshot.credentialCount` cohorts |
| Q5a Time to import | `profile_item_added` filtered to `itemType='credential'` | `msSinceAccountCreated` |
| Q5b Skills funnel | `skill_profile_step_started/completed/abandoned` | step transitions, `stepDurationMs` |

### PostHog Dashboard Recipes

#### Dashboard 1: Time-to-Value
- **Events**: `account_created` → first `profile_item_added`
- **Formula**: `$timestamp(first profile_item_added) - $timestamp(account_created)`
- **Insight**: Histogram of `msSinceAccountCreated` on `profile_item_added`
- **Cohort**: Group by signup week

#### Dashboard 2: Method Attribution
- **Events**: `profile_item_added`
- **Breakdown**: `method` (10 ProfileBuildMethod values)
- **Insight**: Bar chart of method frequency; pie chart of method share
- **Filter**: `itemType = 'credential'` for credential-specific attribution

#### Dashboard 3: Per-Method Efficiency
- **Events**: `claim_boost`, `self_boost`, `send_boost` (with new `msSinceMethodStarted`)
- **Insight**: Median `msSinceMethodStarted` by `method`
- **Correlation**: Compare with `profile_item_added.msSinceMethodStarted` (available on the new event too)

#### Dashboard 4: Activation Threshold
- **Events**: `engagement_signal`
- **Breakdown**: `profileSnapshot.credentialCount` (bucketed: 0, 1, 2-5, 6-10, 11+)
- **Insight**: Funnel — users with N credentials who engaged with AI features
- **Correlation**: `engagement_signal.signal` = `ai_chat | ai_insights | ai_pathway`

#### Dashboard 5: Skills Profile Funnel
- **Events**: `skill_profile_step_started` → `skill_profile_step_completed` / `skill_profile_step_abandoned`
- **Funnel**: Step 1 → 2 → 3 → 4 → 5 → `skill_profile_completed`
- **Duration**: Average `stepDurationMs` per step
- **Abandonment**: Drop-off rate at each step

### Key Files

| File | Purpose |
|------|----------|
| `analytics/events.ts` | Event catalog + payload types |
| `analytics/useProfileSnapshot.ts` | Snapshot hook (credential count, skills, days since signup) |
| `analytics/useAccountCreatedAndReturningSession.ts` | Once-per-user account_created + returning_session |
| `ai-pathways-skill-profile/useTrackProfileDataAdded.ts` | Shared helper for SkillsProfileData method |
| `ai-pathways-skill-profile/useSkillProfileStepFunnel.ts` | Shared hook for step lifecycle tracking |
