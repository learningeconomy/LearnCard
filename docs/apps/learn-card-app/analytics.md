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

For payload types, see `apps/learn-card-app/src/analytics/events.ts`.
