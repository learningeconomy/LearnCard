# Logging

Central logger for all LearnCard apps. Provides structured, PII-safe logging with an injectable Sentry transport — `learn-card-base` never imports `@sentry/react` directly.

## Quick start

```ts
import { getLogger } from 'learn-card-base';

const log = getLogger('my-feature');
```

> **Node.js / tsx scripts** (e.g. `apps/learn-card-app/scripts/`): import from the specific file to avoid loading the full React barrel:
> ```ts
> import { getLogger } from 'learn-card-base/src/logging/logger';
> ```

```ts
const log = getLogger('my-feature');

log.debug('wallet ready');
log.info('profile loaded', { profileId: '123' });
log.warn('cache miss', { key });
log.error(err);  // just the error — uses error.message
log.error('sign-in failed', err);  // message + error
log.info(isEnabled);  // just a value
log.info('feature', isEnabled, { userId: '123' });  // any combination
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

## Flexible arguments (like `console.log`)

All methods accept up to **3 flexible arguments**. The logger intelligently parses **any combination** of errors, messages, objects, primitives, and arrays:

| Argument type | Handling |
| --- | --- |
| **Error** object | Extracted and sent to `captureException` (if Sentry active); message derived from `error.message` |
| **String** | Used as the log message |
| **Plain object** `{ key: value }` | Treated as metadata, attached to Sentry as `extra` |
| **Primitive** — `boolean`, `number`, `string`, `bigint` | Logged as-is to console; wrapped as `{ value: x }` for Sentry |
| **Array** | Logged as-is to console; wrapped as `{ value: [...] }` for Sentry |

### Examples

```ts
// Just a message
log.debug('wallet ready');

// Just an error (uses error.message as the log message)
try {
    await riskyOperation();
} catch (e) {
    log.error(e);  // ✓ uses e.message; sends captureException
}

// Just a primitive — no wrapping needed
const isEnabled = false;
log.info(isEnabled);  // ✓ outputs false directly
log.info(42);  // ✓ outputs 42 directly
log.info(['a', 'b']);  // ✓ outputs array directly

// Just an object
log.debug({ userId: '123', code: 404 });

// Message + error
log.error('wallet init failed', err);  // ✓ message + captured exception

// Message + metadata (object)
log.warn('slow request', { ms: 450, endpoint: '/trpc/getProfile' });

// Error + metadata
log.error(err, { userId: '123', provider: 'firebase' });

// Message + primitive
log.info('retryCount', 3);
log.info('flags', [true, false]);

// All three: message, error, metadata
log.error('sign-in failed', err, { userId, provider: 'firebase' });
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

| Do | Don't |
| --- | --- |
| `log.error(err)` or `log.error('msg', err)` | `console.error('wallet init failed', err)` in app src |
| `log.info(isEnabled)` | `log.info('isEnabled', { isEnabled })` — primitives work directly |
| In catch: `log.error(e)` or `log.error('context', e)` | `log.error('failed', e instanceof Error ? e : new Error(String(e)))` — handled internally |
| `log.warn('...', { key })` | `Sentry.captureException(err)` directly |
| `{ allowPii: true }` in debug tooling only | Log raw PII fields without the flag |

---

## ESLint

`no-console: 'warn'` is enabled for `apps/learn-card-app/src/**` and `apps/scouts/src/**`. Any remaining `console.*` call in those directories will surface as a lint warning until migrated to the logger.
