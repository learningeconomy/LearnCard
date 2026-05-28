// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Structured metadata bag that may carry an opt-in PII bypass flag.
type Meta = Record<string, unknown> & { allowPii?: boolean };

// Guards against accidental Error objects and arrays being treated as metadata bags.
const isMeta = (x: unknown): x is Meta => {
    return typeof x === 'object' && x !== null && !(x instanceof Error) && !Array.isArray(x);
};

// Normalises the overloaded second argument accepted by every log method.
// Accepts `unknown` so callers can pass any value without wrapping it first.
// Primitives and arrays are surfaced as-is for console output and wrapped in
// { value } for Sentry — no object wrapper required at the call site.
//
//   log.error('msg', err)          → [err,       {},      undefined]
//   log.error('msg', err, { key }) → [err,       { key }, undefined]
//   log.error('msg', { key })      → [undefined, { key }, undefined]
//   log.info('flag', false)        → [undefined, {},      false]
//   log.info('items', [1, 2])      → [undefined, {},      [1, 2]]
//
// Strips allowPii before returning so it never reaches Sentry as an extra field.
const parseMeta = (
    metaOrError?: unknown,
    meta?: Meta
): [Error | undefined, Record<string, unknown>, unknown?] => {
    let err: Error | undefined;
    let raw: Record<string, unknown> = {};
    let primitive: unknown;

    if (metaOrError instanceof Error) {
        err = metaOrError;
        raw = meta ?? {};
    } else if (isMeta(metaOrError)) {
        raw = metaOrError;
    } else if (metaOrError !== undefined) {
        // Primitive (boolean, number, string, bigint) or array — display directly
        primitive = metaOrError;
        raw = meta ?? {};
    }

    const { allowPii: allowPiiFromRaw, ...rest } = raw as Meta;
    const allowPii = allowPiiFromRaw ?? (meta as Meta | undefined)?.allowPii;
    return [err, scrub(rest, allowPii), primitive];
};

// Returns extra only when it has keys — avoids printing `{}` on every log line.
const extraOrNothing = (extra: Record<string, unknown>): [] | [Record<string, unknown>] =>
    Object.keys(extra).length > 0 ? [extra] : [];

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
// PII scrubbing
// ---------------------------------------------------------------------------

// Keys are checked case-insensitively as substrings, catching common variants:
//   email → userEmail, emailAddress   phone → phoneNumber, mobilePhone
//   name  → firstName, lastName       token → accessToken, bearerToken, authToken
const PII_SUBSTRINGS = [
    'email',
    'phone',
    'name',
    'seed',
    'password',
    'privatekey',
    'accesstoken',
    'idtoken',
    'token',
];
// 'did' is too short for safe substring matching (would match "additional", "edited"), so exact only.
const PII_EXACT_LC = new Set(['did']);
const BEARER_RE = /^bearer /i;

const isPiiKey = (key: string): boolean => {
    const lc = key.toLowerCase();
    return PII_EXACT_LC.has(lc) || PII_SUBSTRINGS.some(sub => lc.includes(sub));
};

// Recursively replaces PII values with '[scrubbed]'. Three triggers:
//   1. Key name matches a PII pattern (isPiiKey)
//   2. String value starts with "Bearer " (leaked auth header)
//   3. Nested object/array contains either of the above
// Uses a seen-set to guard against circular references and a depth cap of 10.
// Pass allowPii: true in meta to skip scrubbing for internal debug calls.
const scrubValue = (value: unknown, depth: number, seen: Set<object>): unknown => {
    if (depth > 10) return value;
    if (Array.isArray(value)) {
        if (seen.has(value)) return '[circular]';
        seen.add(value);
        return value.map(item => scrubValue(item, depth + 1, seen));
    }
    if (typeof value === 'object' && value !== null && !(value instanceof Error)) {
        if (seen.has(value)) return '[circular]';
        seen.add(value);
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => {
                if (isPiiKey(k) || (typeof v === 'string' && BEARER_RE.test(v)))
                    return [k, '[scrubbed]'];
                return [k, scrubValue(v, depth + 1, seen)];
            })
        );
    }
    return value;
};

const scrub = (meta: Record<string, unknown>, allowPii = false): Record<string, unknown> => {
    if (allowPii) return meta;
    return scrubValue(meta, 0, new Set()) as Record<string, unknown>;
};

// Parse flexible arguments (like console.log) to extract message, error, metadata, and primitives.
// Intelligently handles any combination: log.error(error), log.error('msg'), log.error('msg', error, {meta})
const parseAllArgs = (
    arg1?: unknown,
    arg2?: unknown,
    arg3?: unknown
): { message: string; metaOrError?: unknown; meta?: Meta } => {
    const args = [arg1, arg2, arg3].filter(a => a !== undefined);
    let message = '';
    let metaOrError: unknown;
    let meta: Meta | undefined;

    for (const arg of args) {
        // Error: extract as error
        if (arg instanceof Error) {
            if (!message) message = arg.message;
            if (metaOrError === undefined) metaOrError = arg;
            else if (meta === undefined) meta = arg as unknown as Meta;
        }
        // String: use as message if we don't have one
        else if (typeof arg === 'string') {
            if (!message) message = arg;
            // If we already have a message, treat this string as meta
            else if (metaOrError === undefined) metaOrError = arg;
            else if (meta === undefined) meta = arg as unknown as Meta;
        }
        // Object (not array, not error): treat as metadata
        else if (isMeta(arg)) {
            if (metaOrError === undefined) metaOrError = arg;
            else if (meta === undefined) meta = arg;
            else if (!message) message = String(arg);
        }
        // Primitive or array: can be message or meta
        else {
            if (metaOrError === undefined) metaOrError = arg;
            else if (meta === undefined) meta = arg as unknown as Meta;
        }
    }

    return { message, metaOrError, meta };
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

/** Called by useSentryIdentify whenever preferences / tenantId change. Pass null to clear tenantId (e.g. on logout). */
export const configureLoggerContext = (opts: {
    bugReportsEnabled?: boolean;
    tenantId?: string | null;
}): void => {
    if (opts.bugReportsEnabled !== undefined) _bugReportsEnabled = opts.bugReportsEnabled;
    if (opts.tenantId !== undefined) _tenantId = opts.tenantId ?? undefined;
};

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

export interface Logger {
    debug(arg1?: unknown, arg2?: unknown, arg3?: unknown): void;
    info(arg1?: unknown, arg2?: unknown, arg3?: unknown): void;
    warn(arg1?: unknown, arg2?: unknown, arg3?: unknown): void;
    error(arg1?: unknown, arg2?: unknown, arg3?: unknown): void;
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
    const prefix = scope ? `[${scope}]` : '';
    const tags = () => buildTags(scope);

    return {
        debug(arg1, arg2, arg3) {
            // Dropped in production (transport active + non-dev environment) to avoid noise.
            if (sentryActive() && process.env.NODE_ENV === 'production') return;
            const { message, metaOrError, meta } = parseAllArgs(arg1, arg2, arg3);
            const [err, extra, primitive] = parseMeta(metaOrError, meta);
            if (err && message) console.debug(prefix, message, err, ...extraOrNothing(extra));
            else if (err) console.debug(prefix, err, ...extraOrNothing(extra));
            else if (primitive !== undefined && message) console.debug(prefix, message, primitive);
            else if (primitive !== undefined) console.debug(prefix, primitive);
            else if (message) console.debug(prefix, message, ...extraOrNothing(extra));
            else console.debug(prefix, ...extraOrNothing(extra));
        },

        info(arg1, arg2, arg3) {
            const { message, metaOrError, meta } = parseAllArgs(arg1, arg2, arg3);
            const [err, extra, primitive] = parseMeta(metaOrError, meta);
            if (sentryActive()) {
                _transport!.addBreadcrumb({
                    category: scope,
                    message: message || 'info',
                    data: {
                        ...(primitive !== undefined ? { value: primitive } : extra),
                        ...(err ? { error: String(err) } : {}),
                    },
                    level: 'info',
                });
            } else {
                if (err && message) console.info(prefix, message, err, ...extraOrNothing(extra));
                else if (err) console.info(prefix, err, ...extraOrNothing(extra));
                else if (primitive !== undefined && message)
                    console.info(prefix, message, primitive);
                else if (primitive !== undefined) console.info(prefix, primitive);
                else if (message) console.info(prefix, message, ...extraOrNothing(extra));
                else console.info(prefix, ...extraOrNothing(extra));
            }
        },

        warn(arg1, arg2, arg3) {
            const { message, metaOrError, meta } = parseAllArgs(arg1, arg2, arg3);
            const [err, extra, primitive] = parseMeta(metaOrError, meta);
            // Always log to console so devs see warnings in both envs
            if (err && message) console.warn(prefix, message, err, ...extraOrNothing(extra));
            else if (err) console.warn(prefix, err, ...extraOrNothing(extra));
            else if (primitive !== undefined && message) console.warn(prefix, message, primitive);
            else if (primitive !== undefined) console.warn(prefix, primitive);
            else if (message) console.warn(prefix, message, ...extraOrNothing(extra));
            else console.warn(prefix, ...extraOrNothing(extra));
            if (sentryActive()) {
                _transport!.captureMessage(
                    message || 'warning',
                    'warning',
                    tags(),
                    primitive !== undefined ? { value: primitive } : extra
                );
            }
        },

        error(arg1, arg2, arg3) {
            const { message, metaOrError, meta } = parseAllArgs(arg1, arg2, arg3);
            const [err, extra, primitive] = parseMeta(metaOrError, meta);
            if (err && message) console.error(prefix, message, err, ...extraOrNothing(extra));
            else if (err) console.error(prefix, err, ...extraOrNothing(extra));
            else if (primitive !== undefined && message) console.error(prefix, message, primitive);
            else if (primitive !== undefined) console.error(prefix, primitive);
            else if (message) console.error(prefix, message, ...extraOrNothing(extra));
            else console.error(prefix, ...extraOrNothing(extra));
            if (sentryActive()) {
                if (err) _transport!.captureException(err, tags(), extra);
                else
                    _transport!.captureMessage(
                        message || 'error',
                        'error',
                        tags(),
                        primitive !== undefined ? { value: primitive } : extra
                    );
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
 * May be called at module level or inside components alike.
 *
 * @example
 * Module-level (outside any component)
 * const log = getLogger('auth-coordinator');
 *
 * log.debug('wallet ready');
 * → console.debug('[auth-coordinator]', 'wallet ready')   (dev only)
 *
 * log.info('profile loaded', { profileId: '123' });
 * → console.info('[auth-coordinator]', 'profile loaded', { profileId: '123' })
 * → Sentry breadcrumb { category: 'auth-coordinator', message: 'profile loaded', data: { profileId: '123' } }
 *
 * log.warn('token expiring soon', { expiresIn: 60 });
 * → console.warn('[auth-coordinator]', 'token expiring soon', { expiresIn: 60 })
 * → Sentry captureMessage('token expiring soon', 'warning', { scope: 'auth-coordinator' }, { expiresIn: 60 })
 *
 * log.error('sign-in failed', error);
 * → console.error('[auth-coordinator]', 'sign-in failed', Error('...'))
 * → Sentry captureException(error, { scope: 'auth-coordinator' })
 *
 * PII fields are automatically scrubbed from meta objects (including nested)
 * log.error('lookup failed', { email: 'user@example.com', code: 404 });
 * → Sentry extra: { email: '[scrubbed]', code: 404 }
 *
 * Primitives and arrays are displayed as-is — no object wrapper needed
 * log.info('isEnabled::', false)   → console.info('[scope]', 'isEnabled::', false)
 * log.info('count::', 42)          → console.info('[scope]', 'count::', 42)
 * log.info('items::', [1, 2, 3])   → console.info('[scope]', 'items::', [1, 2, 3])
 * → Sentry breadcrumb data: { value: false / 42 / [...] }
 *
 * Pass a raw catch-block value — logger handles it internally
 * try { ... } catch (e) { log.error('unexpected', e); }
 *
 * Opt out of PII scrubbing for internal debug calls (never use in prod paths)
 * log.warn('debug identity', { email: 'user@example.com', allowPii: true });
 * → Sentry extra: { email: 'user@example.com' }   // allowPii itself is stripped
 */
export const getLogger = (scope: string): Logger => createLogger(scope);
