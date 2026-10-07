# Partner Connect SDK

> Promise-based JavaScript SDK for secure cross-origin communication between partner apps and LearnCard

{% hint style="info" %}
**The runtime types in `packages/learn-card-partner-connect-sdk/src/types.ts` and the Zod validators in `@learncard/types` (`packages/learn-card-types/src/lcn.ts`) are the source of truth.**
{% endhint %}

The Partner Connect SDK transforms complex `postMessage` communication into clean, modern Promise-based functions. It handles the entire cross-origin message lifecycle, including request queuing, origin validation, and timeout management.

### On this section

This page covers setup, configuration, and mock mode. For the rest of the SDK, see:

- **[Methods](methods.md)** — the full API reference: every method, its parameters, and examples
- **[Errors, Types & Migration](errors-and-types.md)** — error codes, advanced configuration, the migration guide, and TypeScript types

## Features

- **🔒 Secure**: Multi-layered origin validation prevents unauthorized access
- **🎯 Type-safe**: Full TypeScript support with comprehensive type definitions
- **⚡ Promise-based**: Modern async/await API eliminates callback complexity
- **🧹 Clean**: Abstracts away all postMessage implementation details
- **📦 Lightweight**: Zero runtime dependencies, ~8KB minified
- **🛡️ Robust**: Built-in timeout handling and structured error management
- **🧪 Standalone-ready**: Runs and demos on its own via automatic mock mode — no host required

## Installation

{% tabs %}
{% tab title="npm" %}

```bash
npm install @learncard/partner-connect
```

{% endtab %}

{% tab title="Bun" %}

```bash
bun add @learncard/partner-connect
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @learncard/partner-connect
```

{% endtab %}
{% endtabs %}

## Quick Start

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});

// Request user identity (SSO)
try {
    const identity = await learnCard.requestIdentity();
    console.log('User DID:', identity.user.did);
    console.log('JWT Token:', identity.token);
} catch (error) {
    if (error.code === 'LC_UNAUTHENTICATED') {
        console.log('User is not logged in');
    }
}
```

## Standalone / Mock Mode

The SDK only does real work when it's embedded inside LearnCard — that's what answers its requests. Run your app on its own (local dev, a preview deploy, tests) and there's nothing to answer. Standalone calls that aren't mocked reject immediately with `LC_NOT_EMBEDDED` (instead of hanging until the request timeout), plus a one-time console hint.

Mock mode fixes this automatically in local development. Whenever no LearnCard host is present and your app runs on a local dev host (`localhost`, `127.0.0.1`, `[::1]`, `*.localhost`, `*.local`), the SDK stands in for LearnCard so your app stays fully usable:

- **Every method shows a branded toast** describing what would happen once embedded — e.g. `sendCredential` → _"✅ In LearnCard, the user would receive **[name]** here"_, `incrementCounter` → _"Counter **coins** → **10**"_, `launchFeature` → _"Would open **/wallet**"_. Strong, visible feedback for every call.
- `requestConsent(...)` grants automatically and shows a "mock consent" toast; counters (`incrementCounter` / `getCounter` / `getCounters`) save to the browser and survive reloads.
- Identical or polled calls coalesce into one toast with a ×N counter, so nothing spams the screen.
- `requestIdentity`, notifications, learner context, and sync status return sensible placeholder data.
- Everything is also logged to the console with a `[LearnCard SDK · MOCK]` prefix.

No flags, no separate build in local dev. Your app is demo-able locally and behaves exactly the same against the real host once embedded.

{% hint style="warning" %}
**`'auto'` never mocks on production or remote preview origins.** A real user opening your app's URL directly must never receive a fabricated identity or auto-granted consent. For remote deploy previews (Netlify, Lovable, Vercel, …) that should demo standalone anywhere but use the real host once embedded, opt in with `mock: 'standalone'`. For CI and tests that should always mock, use `mock: true`.
{% endhint %}

| `mock`             | Standalone, local dev | Standalone, remote origin     | Embedded in LearnCard |
| ------------------ | --------------------- | ----------------------------- | --------------------- |
| `'auto'` (default) | mock                  | fail fast (`LC_NOT_EMBEDDED`) | real host             |
| `'standalone'`     | mock                  | mock                          | real host             |
| `true`             | mock                  | mock                          | mock                  |
| `false`            | fail fast             | fail fast                     | real host             |

If your app is embedded in something that isn't LearnCard (a cross-origin Storybook canvas, a preview shell), calls don't hang: the SDK mocks on local dev hosts and otherwise rejects fast with `LC_NOT_EMBEDDED`. When the parent can't be identified (Firefox, or a same-origin localhost wrapper), a one-time side-effect-free presence probe decides — the SDK only mocks if no host answers within `hostProbeTimeout` (default 1500 ms).

Every mocked call shows a labeled toast and a `[LearnCard SDK · MOCK]` console log, so it's clear the SDK is simulating rather than talking to a real host. For a production build meant to run only inside LearnCard, set `mock: false` — standalone calls then reject immediately with `LC_NOT_EMBEDDED`.

```typescript
// Mocks in local dev when standalone; real host when embedded in LearnCard.
const learnCard = createPartnerConnect();

await learnCard.sendCredential({ templateAlias: 'course-completion' });
```

**Overrides:**

```typescript
createPartnerConnect({ mock: 'standalone' }); // mock when no host, on any origin; real when embedded
createPartnerConnect({ mock: true }); // always mock, even embedded (CI, tests)
createPartnerConnect({ mock: false }); // never mock (standalone → LC_NOT_EMBEDDED)
createPartnerConnect({
    mockOptions: {
        ui: true, // toasts/banners (default true)
        log: true, // console logging (default true)
        persist: true, // save counters to the browser (default true)
        namespace: 'my-app-mock', // storage namespace for mock data
        // Seed data for demos / happy-path UI:
        identity: { did: 'did:web:example.com:me', name: 'Ada' },
        credentials: [{ templateAlias: 'course-completion', name: 'Algebra 101' }],
        counters: { coins: 50 },
    },
});
```

Use `learnCard.isMocked()` to check whether an instance is currently mocking.

The mock keeps a small session store, so **reads reflect writes**: after
`sendCredential(...)`, calls like `checkUserHasCredential`, `getTemplateRecipients`,
`requestLearnerContext`, and `askCredentialSearch` return that credential — so
happy-path UI actually lights up standalone. Use `mockOptions.credentials` /
`identity` / `counters` to pre-populate state without performing an action first.
Mock credentials are marked `_mock: true` and are never cryptographically valid.

## Security Model

The Partner Connect SDK implements comprehensive security measures:

### Origin Validation

**Strict Enforcement:**

- Incoming messages must exactly match the configured host origin
- No wildcard (`*`) origins are ever used
- Query parameter overrides are validated against whitelist

**Configuration Hierarchy:**

1. **Default**: `https://learncard.app` (security anchor)
2. **Query Parameter Override**: `?lc_host_override=https://staging.learncard.app`
3. **Configured Origin**: From `hostOrigin` option

**Example:**

```typescript
// Production configuration
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});
// Uses: https://learncard.app
// Override: ?lc_host_override=X (not validated, warning logged)

// Staging configuration with whitelist
const learnCard = createPartnerConnect({
    hostOrigin: ['https://learncard.app', 'https://staging.learncard.app'],
});
// Default: https://learncard.app
// Override: ?lc_host_override=https://staging.learncard.app ✅
// Override: ?lc_host_override=https://evil.com ❌
```

### Message Security

- **Protocol Verification**: Messages must match expected protocol version
- **Request ID Tracking**: Only tracked requests are processed
- **Timeout Protection**: Requests automatically timeout to prevent hanging
- **Cleanup on Destroy**: Pending requests are properly rejected

## Browser Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile**: iOS Safari 14+, Android Chrome 90+

**Required APIs:**

- `postMessage`
- `Promise`
- `URLSearchParams`
- `addEventListener`

## Related Documentation

- [Build an App Inside LearnCard](../../how-to-guides/publish-your-app.md) - Step-by-step guide for App Store credential issuance
- [LearnCard Core SDK](/sdks/learncard-core/) - Backend credential operations
- [LearnCard Network](/sdks/learncard-network/) - Network integration
- [Connect a User's LearnCard to Your Platform](../../tutorials/create-a-consentflow.md) - Integration guide
- [App Store Development](/apps/learn-card-app/) - LearnCard app ecosystem
