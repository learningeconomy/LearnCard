// ---------------------------------------------------------------------------
// PII scrubbing
// ---------------------------------------------------------------------------

const PII_FIELDS = [
    'email',
    'phone',
    'name',
    'did',
    'seed',
    'privateKey',
    'accessToken',
    'idToken',
];
const BEARER_RE = /^bearer /i;

// Replaces PII values with '[scrubbed]'. Two triggers:
//   1. Key name is in PII_FIELDS (e.g. "email", "did")
//   2. String value starts with "Bearer " (leaked auth header)
// Pass allowPii: true in meta to skip scrubbing for internal debug calls.
const scrub = (meta: Record<string, unknown>, allowPii = false): Record<string, unknown> => {
    if (allowPii) return meta;
    return Object.fromEntries(
        Object.entries(meta).map(([key, value]) => {
            const isPii =
                PII_FIELDS.includes(key) || (typeof value === 'string' && BEARER_RE.test(value));

            return [key, isPii ? '[scrubbed]' : value];
        })
    );
};

// ---------------------------------------------------------------------------
// Injectable Sentry transport — avoids adding @sentry/react as a dep here.
// The host app (learn-card-app, scouts) calls configureSentryTransport() once
// during Sentry.init(), and configureLoggerContext() whenever user preferences
// change (wired inside useSentryIdentify).
// ---------------------------------------------------------------------------

export type SentryLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export interface SentryTransport {
    captureException(
        err: unknown,
        tags?: Record<string, string>,
        extra?: Record<string, unknown>
    ): void;
    captureMessage(
        msg: string,
        level: 'warning' | 'error',
        tags?: Record<string, string>,
        extra?: Record<string, unknown>
    ): void;
    addBreadcrumb(opts: {
        category?: string;
        message: string;
        data?: Record<string, unknown>;
        level?: SentryLevel;
    }): void;
    withScope(
        fn: (scope: {
            setTag(k: string, v: string): void;
            setExtra(k: string, v: unknown): void;
        }) => void
    ): void;
}

// ---------------------------------------------------------------------------
// Module-level config
// ---------------------------------------------------------------------------

let _transport: SentryTransport | null = null; // null = dev mode, no Sentry forwarding
let _bugReportsEnabled = true; // mirrors user's bugReportsEnabled preference; default true so existing users without stored prefs are unaffected
let _tenantId: string | undefined; // included as a Sentry tag on every captured event

/** Call after Sentry.init() so the logger can forward events. */
export const configureSentryTransport = (t: SentryTransport | null): void => {
    _transport = t;
};

/** Called by useSentryIdentify whenever preferences / tenantId change. */
export const configureLoggerContext = (opts: {
    bugReportsEnabled?: boolean;
    tenantId?: string;
}): void => {
    if (opts.bugReportsEnabled !== undefined) _bugReportsEnabled = opts.bugReportsEnabled;
    if (opts.tenantId !== undefined) _tenantId = opts.tenantId;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Structured metadata bag that may carry an opt-in PII bypass flag.
type Meta = Record<string, unknown> & { allowPii?: boolean };

// Guards against accidental Error objects being treated as metadata bags.
const isMeta = (x: unknown): x is Meta => {
    return typeof x === 'object' && x !== null && !(x instanceof Error);
};

// Normalises the overloaded second argument accepted by every log method.
// Accepts `unknown` so callers can pass a raw catch-block value without
// wrapping it themselves — the coercion to Error happens here, once.
//
//   log.error('msg', err)          → [err, {}, false]
//   log.error('msg', err, { key }) → [err, { key }, false]
//   log.error('msg', { key })      → [undefined, { key }, false]
//   log.error('msg', unknownValue) → [Error(String(unknownValue)), {}, false]
//
// Strips allowPii before returning so it never reaches Sentry as an extra field.
const parseMeta = (
    metaOrError?: unknown,
    meta?: Meta
): [Error | undefined, Record<string, unknown>, boolean] => {
    let err: Error | undefined;
    let raw: Record<string, unknown> = {};

    if (metaOrError instanceof Error) {
        err = metaOrError;
        raw = meta ?? {};
    } else if (metaOrError && isMeta(metaOrError)) {
        raw = metaOrError;
    } else if (metaOrError !== undefined) {
        // Auto-wrap primitives and non-Error objects thrown in catch blocks
        err = new Error(String(metaOrError));
        raw = meta ?? {};
    }

    const { allowPii, ...rest } = raw as Meta;
    return [err, scrub(rest, allowPii), allowPii ?? false];
};

// True only when a Sentry transport is registered AND the user has opted in.
// When false the logger falls back to console-only (dev mode or privacy gate active).
const sentryActive = (): boolean => _transport !== null && _bugReportsEnabled;

// Assembles the Sentry tags that are attached to every captured event.
// scope identifies which feature/module logged the event; tenantId enables per-tenant filtering.
const buildTags = (scope?: string): Record<string, string> => {
    const tags: Record<string, string> = {};
    if (scope) tags['scope'] = scope;
    if (_tenantId) tags['tenantId'] = _tenantId;
    return tags;
};

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

export interface Logger {
    debug(msg: string, metaOrError?: unknown, meta?: Meta): void;
    info(msg: string, metaOrError?: unknown, meta?: Meta): void;
    warn(msg: string, metaOrError?: unknown, meta?: Meta): void;
    error(msg: string, metaOrError?: unknown, meta?: Meta): void;
    breadcrumb(opts: {
        category: string;
        message: string;
        data?: Record<string, unknown>;
        level?: SentryLevel;
    }): void;
    withContext(
        fn: (scope: {
            setTag(k: string, v: string): void;
            setExtra(k: string, v: unknown): void;
        }) => void
    ): void;
}

const createLogger = (scope?: string): Logger => {
    const prefix = scope ? `[${scope}]` : ''; // log prefix
    const tags = () => buildTags(scope);

    return {
        debug(msg, metaOrError?, meta?) {
            // Dropped when Sentry transport is active (production)
            if (sentryActive()) return;
            const [err, extra] = parseMeta(metaOrError, meta);
            if (err) console.debug(prefix, msg, err, extra);
            else console.debug(prefix, msg, extra);
        },

        info(msg, metaOrError?, meta?) {
            const [err, extra] = parseMeta(metaOrError, meta);
            if (sentryActive()) {
                _transport!.addBreadcrumb({
                    category: scope,
                    message: msg,
                    data: { ...extra, ...(err ? { error: String(err) } : {}) },
                    level: 'info',
                });
            } else {
                if (err) console.info(prefix, msg, err, extra);
                else console.info(prefix, msg, extra);
            }
        },

        warn(msg, metaOrError?, meta?) {
            const [err, extra] = parseMeta(metaOrError, meta);
            // Always log to console so devs see warnings in both envs
            if (err) console.warn(prefix, msg, err, extra);
            else console.warn(prefix, msg, extra);
            if (sentryActive()) {
                _transport!.captureMessage(msg, 'warning', tags(), extra);
            }
        },

        error(msg, metaOrError?, meta?) {
            const [err, extra] = parseMeta(metaOrError, meta);
            if (err) console.error(prefix, msg, err, extra);
            else console.error(prefix, msg, extra);
            if (sentryActive()) {
                if (err) _transport!.captureException(err, tags(), extra);
                else _transport!.captureMessage(msg, 'error', tags(), extra);
            }
        },

        breadcrumb(opts) {
            if (sentryActive()) _transport!.addBreadcrumb(opts);
        },

        withContext(fn) {
            if (sentryActive()) _transport!.withScope(fn);
        },
    };
};

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/** Module-level logger — use for non-React contexts. */
export const logger = createLogger();

/**
 * Returns a logger whose messages are prefixed with `[scope]`.
 * Stable across renders since createLogger is pure and lightweight.
 *
 * Despite the `use` prefix this is NOT a React hook — it is a plain factory
 * and may be called at module level or inside components alike.
 *
 * @example
 * Module-level (outside any component)
 * const log = useLogger('auth-coordinator');
 *
 * log.debug('wallet ready');
 * → console.debug('[auth-coordinator]', 'wallet ready', {})   (dev only)
 *
 * log.info('profile loaded', { profileId: '123' });
 * → console.info('[auth-coordinator]', 'profile loaded', { profileId: '123' })
 * → Sentry breadcrumb { category: 'auth-coordinator', message: 'profile loaded', data: { profileId: '123' } }
 *
 * log.warn('token expiring soon', { expiresIn: 60 });
 * → console.warn('[auth-coordinator]', 'token expiring soon', { expiresIn: 60 })
 * → Sentry captureMessage('token expiring soon', 'warning', { scope: 'auth-coordinator' }, { expiresIn: 60 })

 * log.error('sign-in failed', error);
 * → console.error('[auth-coordinator]', 'sign-in failed', Error('...'), {})
 * → Sentry captureException(error, { scope: 'auth-coordinator' })
 *
 * PII fields are automatically scrubbed from meta objects
 * log.error('lookup failed', { email: 'user@example.com', code: 404 });
 * → Sentry extra: { email: '[scrubbed]', code: 404 }
 *
 * Pass a raw catch-block value — logger wraps it in Error() internally
 * try { ... } catch (e) { log.error('unexpected', e); }
 *
 * Opt out of PII scrubbing for internal debug calls (never use in prod paths)
 * log.warn('debug identity', { email: 'user@example.com', allowPii: true });
 * → Sentry extra: { email: 'user@example.com' }   // allowPii itself is stripped
 */
export const useLogger = (scope: string): Logger => createLogger(scope);
