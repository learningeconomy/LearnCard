# Logging

Central logger for all LearnCard apps. Provides structured, PII-safe logging with an injectable Sentry transport — `learn-card-base` never imports `@sentry/react` directly.

## Quick start

```ts
import { getLogger } from 'learn-card-base';

const log = getLogger('my-feature');

log.debug('wallet ready');
log.info('profile loaded', { profileId: '123' });
log.warn('cache miss', { key });
log.error('sign-in failed', err);
```

---

## API

### `getLogger(scope: string): Logger`

Returns a logger that prefixes every console output with `[scope]` and attaches a `scope` tag to every Sentry event.

```ts
const log = getLogger('auth-coordinator');
```

### `logger`

Module-level singleton with no scope prefix. Use when a scope doesn't add value.

```ts
import { logger } from 'learn-card-base';

logger.info('app boot');
```

---

## Log levels

| Method                | Dev / staging   | Production (`NODE_ENV === 'production'`)                        |
| --------------------- | --------------- | --------------------------------------------------------------- |
| `log.debug(msg, ...)` | `console.debug` | **dropped** — never reaches Sentry or console                   |
| `log.info(msg, ...)`  | `console.info`  | Sentry breadcrumb (timeline context)                            |
| `log.warn(msg, ...)`  | `console.warn`  | `console.warn` + Sentry `captureMessage`                        |
| `log.error(msg, ...)` | `console.error` | `console.error` + Sentry `captureException` or `captureMessage` |

> `debug` is silenced only in production builds (`NODE_ENV === 'production'`). Staging builds with a Sentry transport configured still show debug output in devtools. Use `info` if you need the event to appear in Sentry's breadcrumb trail.

---

## Second argument

The second argument is flexible — pass whatever you have without wrapping:

| What you pass                             | Console output  | Sentry                        |
| ----------------------------------------- | --------------- | ----------------------------- |
| `Error` object                            | logged directly | `captureException(err)`       |
| Plain object `{ key: value }`             | logged directly | attached as `extra`           |
| Primitive — `boolean`, `number`, `string` | logged directly | wrapped as `{ value: x }`     |
| Array                                     | logged directly | wrapped as `{ value: [...] }` |
| Nothing                                   | empty `{}`      | no extra                      |

### Examples

```ts
// Error object
log.error('wallet init failed', err);

// Plain object (structured context)
log.warn('slow request', { ms: 450, endpoint: '/trpc/getProfile' });

// Error + extra context together
log.error('sign-in failed', err, { userId, provider: 'firebase' });

// Primitives — no object wrapper needed
const isEnabled = false;
log.info('feature flag', isEnabled); // ✓ logs false directly
log.info('retry count', 3); // ✓ logs 3 directly
log.info('active flags', ['a', 'b']); // ✓ logs array directly

// Raw catch block value — logger coerces it internally
try {
    await riskyOperation();
} catch (e) {
    log.error('operation failed', e); // ✓ pass e directly, no wrapping needed
}
```

---

## PII scrubbing

Field names are matched **case-insensitively as substrings**, so common variants are caught automatically:

| Keyword matched | Examples scrubbed                                          |
| --------------- | ---------------------------------------------------------- |
| `email`         | `email`, `userEmail`, `emailAddress`, `contactEmail`       |
| `phone`         | `phone`, `phoneNumber`, `mobilePhone`                      |
| `name`          | `name`, `firstName`, `lastName`, `displayName`, `fullName` |
| `did`           | `did` (exact match only — too short for safe substring)    |
| `seed`          | `seed`                                                     |
| `password`      | `password`, `hashedPassword`                               |
| `privatekey`    | `privateKey`, `privatekey`                                 |
| `accesstoken`   | `accessToken`, `accesstoken`                               |
| `idtoken`       | `idToken`, `idtoken`                                       |
| `token`         | `token`, `bearerToken`, `authToken`, `refreshToken`        |

Scrubbing is **recursive** — nested objects and arrays are walked automatically, with a depth cap of 10 and cycle detection. Any string **value** starting with `Bearer ` (case-insensitive) is also scrubbed regardless of key name.

```ts
// Top-level field
log.error('lookup failed', { email: 'user@example.com', code: 404 });
// Sentry extra → { email: '[scrubbed]', code: 404 }

// Nested field — also scrubbed
log.error('lookup failed', { user: { email: 'user@example.com' }, code: 404 });
// Sentry extra → { user: { email: '[scrubbed]' }, code: 404 }

// Variant key name — also scrubbed
log.error('lookup failed', { userEmail: 'user@example.com', code: 404 });
// Sentry extra → { userEmail: '[scrubbed]', code: 404 }

// Bypass scrubbing for internal debug tooling only
log.warn('debug identity', { email: 'user@example.com', allowPii: true });
// Sentry extra → { email: 'user@example.com' }  (allowPii itself is stripped)
```

> Never use `allowPii: true` in production code paths.

---

## Privacy gate

When `bugReportsEnabled` is `false` (user opted out), **no events reach Sentry**. Console output is unaffected. The gate is wired automatically — `useSentryIdentify` calls `configureLoggerContext({ bugReportsEnabled })` whenever user preferences change.

---

## Sentry setup (apps)

Both `learn-card-app` and `scouts` wire up the transport in `constants/sentry.ts` immediately after `Sentry.init()`:

```ts
import { configureSentryTransport } from 'learn-card-base';

Sentry.init({ ... });

configureSentryTransport({
    captureException: (err, tags, extra) =>
        Sentry.withScope(scope => {
            if (tags) Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
            if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
            Sentry.captureException(err);
        }),
    captureMessage: (msg, level, tags, extra) =>
        Sentry.withScope(scope => {
            if (tags) Object.entries(tags).forEach(([k, v]) => scope.setTag(k, v));
            if (extra) Object.entries(extra).forEach(([k, v]) => scope.setExtra(k, v));
            Sentry.captureMessage(msg, level);
        }),
    addBreadcrumb: opts => Sentry.addBreadcrumb(opts),
    withScope: fn => Sentry.withScope(scope => fn({ setTag: scope.setTag.bind(scope), setExtra: scope.setExtra.bind(scope) })),
});
```

---

## Do / Don't

| Do                                         | Don't                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `log.error('wallet.init.failed', err)`     | `console.error('wallet init failed', err)` in app src                                     |
| `log.info('isEnabled', isEnabled)`         | `log.info('isEnabled', { isEnabled })` — primitives work directly                         |
| `log.error('failed', e)` in catch blocks   | `log.error('failed', e instanceof Error ? e : new Error(String(e)))` — handled internally |
| `log.warn('...', { key })`                 | `Sentry.captureException(err)` directly                                                   |
| `{ allowPii: true }` in debug tooling only | Log raw PII fields without the flag                                                       |

---

## ESLint

`no-console: 'warn'` is enabled for `apps/learn-card-app/src/**` and `apps/scouts/src/**`. Any remaining `console.*` call in those directories will surface as a lint warning until migrated to the logger.
