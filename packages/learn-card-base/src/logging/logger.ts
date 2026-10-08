import { isProductionEnvironment } from '../config/isProduction';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

import {
    clearDiagnosticLogs,
    recordDiagnosticLog,
    setDiagnosticLogCollectionEnabled,
} from './diagnosticLogBuffer';

interface Parsed {
    message: string;
    err?: Error;
    extra: Record<string, unknown>; // scrubbed, merged Meta bag
    values: unknown[]; // leftover args (primitives, arrays, extra strings, additional Errors)
}

// Structured metadata bag that may carry an opt-in PII bypass flag.
type Meta = Record<string, unknown> & { allowPii?: boolean };

// Guards against accidental Error objects and arrays being treated as metadata bags.
const isMeta = (x: unknown): x is Meta => {
    return typeof x === 'object' && x !== null && !(x instanceof Error) && !Array.isArray(x);
};

// Returns extra only when it has keys — avoids printing `{}` on every log line.
const extraOrNothing = (extra: Record<string, unknown>): [] | [Record<string, unknown>] =>
    Object.keys(extra).length > 0 ? [extra] : [];

// Builds the Sentry extra payload: merges scrubbed meta with any leftover values
// (single → { value }, multiple → { values: [...] }) so nothing collected at the
// call site gets dropped before reaching Sentry.
const sentryExtra = (p: Parsed): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...p.extra };
    if (p.values.length === 1) out.value = p.values[0];
    else if (p.values.length > 1) out.values = p.values;
    return out;
};

// Breadcrumb data: like sentryExtra, plus a stringified error when present.
const breadcrumbData = (p: Parsed): Record<string, unknown> => {
    const data = sentryExtra(p);
    if (p.err) data.error = String(p.err);
    return data;
};

// Diagnostic buffer payload: the scrubbed meta bag, leftover values, and the
// parsed error. Mirrors sentryExtra so feedback reports carry the same context
// the Sentry event does; recordDiagnosticLog then applies its forced
// sanitizer (scrubbing again is idempotent, and allowPii input stays scrubbed).
const diagnosticData = (p: Parsed): Record<string, unknown> | undefined => {
    const out: Record<string, unknown> = { ...p.extra };
    if (p.values.length === 1) out.value = p.values[0];
    else if (p.values.length > 1) out.values = p.values;
    if (p.err) out.error = p.err;
    return Object.keys(out).length > 0 ? out : undefined;
};

// Console output: prefix, then message, error, leftover values, and the meta
// bag (only if non-empty). Mirrors console.log argument order.
const renderConsole = (prefix: string, p: Parsed): unknown[] => {
    const out: unknown[] = [prefix];
    if (p.message) out.push(p.message);
    if (p.err) out.push(p.err);
    if (p.values.length > 0) out.push(...p.values);
    return [...out, ...extraOrNothing(p.extra)];
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

// Walks an arbitrary arg list (console.log-style) and classifies each entry.
// First Error wins the err slot; first string wins the message slot; Meta
// objects are merged into a single extras bag (allowPii is honored from any).
// Everything else — additional Errors, additional strings, primitives, arrays —
// collects into `values` so nothing is silently dropped or char-spread.
//
//   log.error('msg', err)                 → { message: 'msg', err, values: [] }
//   log.error('msg', err, { key })        → { message: 'msg', err, extra: { key } }
//   log.error('msg', boostUri, err)       → { message: 'msg', err, values: [boostUri] }
//   log.warn('msg', a, 'got', b)          → { message: 'msg', values: [a, 'got', b] }
//   log.info('flag::', false)             → { message: 'flag::', values: [false] }
//   log.error(err)                        → { message: err.message, err }
//
// Strips allowPii before returning so it never reaches Sentry as an extra field.
const parseArgs = (args: unknown[]): Parsed => {
    let err: Error | undefined;
    let message = '';
    const metaRaw: Record<string, unknown> = {};
    let allowPii = false;
    const values: unknown[] = [];

    for (const arg of args) {
        if (arg === undefined) continue;
        if (arg instanceof Error) {
            const safeError = redactErrorMessage(arg);
            if (!err) err = safeError;
            else values.push(safeError);
        } else if (typeof arg === 'string') {
            if (!message) message = arg;
            else values.push(arg);
        } else if (isMeta(arg)) {
            const m = arg as Meta;
            if (m.allowPii) allowPii = true;
            const { allowPii: _drop, ...rest } = m;
            Object.assign(metaRaw, rest);
        } else {
            values.push(arg);
        }
    }

    if (!message && err) message = err.message;

    return {
        message: redactSecretShapes(message),
        err,
        extra: scrub(metaRaw, allowPii),
        values: values.map(value => redactPositionalValue(value, 0, new Set())),
    };
};

// ---------------------------------------------------------------------------
// PII and secret scrubbing
// ---------------------------------------------------------------------------

// PII may be exposed by explicitly setting allowPii for internal tooling.
const PII_SUBSTRINGS = ['email', 'phone', 'name'];
// 'did' is too short for safe substring matching (would match "additional", "edited"), so exact only.
const PII_EXACT_LC = new Set(['did']);

// Secrets are never exposed, including when allowPii is true. Some entries are
// intentionally redundant with `token` / `share` to keep the policy explicit.
const SECRET_SUBSTRINGS = [
    'seed',
    'password',
    'privatekey',
    'accesstoken',
    'idtoken',
    'token',
    'share',
    'authshare',
    'deviceshare',
    'recoveryshare',
    'encryptedshare',
    'recoverykey',
    'mnemonic',
    'phrase',
];
const SCRUBBED = '[scrubbed]';
const REDACTED = '[REDACTED]';
const BEARER_RE = /^bearer\s/i;
const BEARER_VALUE_RE = /bearer\s+\S+/gi;
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const LONG_HEX_RE = /(^|[^A-Za-z0-9_-])([A-Fa-f0-9]{32,})(?=$|[^A-Za-z0-9_-])/g;
const LONG_BASE64URL_RE = /(^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{40,})(?=$|[^A-Za-z0-9_-])/g;

const isPiiKey = (key: string): boolean => {
    const lc = key.toLowerCase();
    return PII_EXACT_LC.has(lc) || PII_SUBSTRINGS.some(sub => lc.includes(sub));
};

const isSecretKey = (key: string): boolean => {
    const lc = key.toLowerCase();
    return SECRET_SUBSTRINGS.some(sub => lc.includes(sub));
};

const redactSecretShapes = (value: string): string =>
    value
        .replace(BEARER_VALUE_RE, REDACTED)
        .replace(JWT_RE, REDACTED)
        .replace(LONG_HEX_RE, `$1${REDACTED}`)
        .replace(LONG_BASE64URL_RE, `$1${REDACTED}`);

const redactErrorMessage = (error: Error): Error => {
    const safeMessage = redactSecretShapes(error.message);
    const safeStack = error.stack ? redactSecretShapes(error.stack) : undefined;

    if (safeMessage === error.message && safeStack === error.stack) return error;

    const safeError = new Error(safeMessage);
    safeError.name = error.name;
    safeError.stack = safeStack;
    return safeError;
};

const redactPositionalValue = (value: unknown, depth: number, seen: Set<object>): unknown => {
    if (typeof value === 'string') return redactSecretShapes(value);
    if (value instanceof Error) return redactErrorMessage(value);
    if (depth > 10 || !Array.isArray(value)) return value;
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    return value.map(item => redactPositionalValue(item, depth + 1, seen));
};

// Recursively replaces protected values. Three triggers:
//   1. Secret key name matches (never bypassable)
//   2. PII key name matches and allowPii is false
//   3. String value contains an obvious secret shape
// Uses a seen-set to guard against circular references and a depth cap of 10.
const scrubValue = (
    value: unknown,
    depth: number,
    seen: Set<object>,
    allowPii: boolean
): unknown => {
    if (depth > 10) return value;
    if (typeof value === 'string') return redactSecretShapes(value);
    if (value instanceof Error) return redactErrorMessage(value);
    if (Array.isArray(value)) {
        if (seen.has(value)) return '[circular]';
        seen.add(value);
        return value.map(item => scrubValue(item, depth + 1, seen, allowPii));
    }
    if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[circular]';
        seen.add(value);
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => {
                if (
                    isSecretKey(k) ||
                    (!allowPii && isPiiKey(k)) ||
                    (typeof v === 'string' && BEARER_RE.test(v))
                ) {
                    return [k, SCRUBBED];
                }
                return [k, scrubValue(v, depth + 1, seen, allowPii)];
            })
        );
    }
    return value;
};

const scrub = (meta: Record<string, unknown>, allowPii = false): Record<string, unknown> => {
    return scrubValue(meta, 0, new Set(), allowPii) as Record<string, unknown>;
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
    ): string | undefined;
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
// Preserve the pre-LC-2086 crash-reporting default for signed-out, onboarding,
// and preferences-loading surfaces. Feedback diagnostics have a separate,
// fail-closed gate below.
let _bugReportsEnabled = true;
let _tenantId: string | undefined; // included as a Sentry tag on every captured event
let _diagnosticIdentity: string | null | undefined;

/** Call after Sentry.init() so the logger can forward events. */
export const configureSentryTransport = (t: SentryTransport | null): void => {
    _transport = t;
};

/** Called by useSentryIdentify whenever preferences / tenantId change. Pass null to clear tenantId (e.g. on logout). */
export const configureLoggerContext = (opts: {
    bugReportsEnabled?: boolean;
    diagnosticLogCollectionEnabled?: boolean;
    tenantId?: string | null;
    /** Opaque owner key for the process-global diagnostic buffer. */
    diagnosticIdentity?: string | null;
}): void => {
    if (opts.diagnosticIdentity !== undefined) {
        if (_diagnosticIdentity !== undefined && _diagnosticIdentity !== opts.diagnosticIdentity) {
            clearDiagnosticLogs();
        }
        _diagnosticIdentity = opts.diagnosticIdentity;
    }
    if (opts.bugReportsEnabled !== undefined) {
        _bugReportsEnabled = opts.bugReportsEnabled;
    }
    if (opts.diagnosticLogCollectionEnabled !== undefined) {
        setDiagnosticLogCollectionEnabled(opts.diagnosticLogCollectionEnabled);
    }
    if (opts.tenantId !== undefined) _tenantId = opts.tenantId ?? undefined;
};

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

export interface Logger {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    /** Returns the Sentry event id when an exception was captured, otherwise undefined. */
    error(...args: unknown[]): string | undefined;
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
        debug(...args) {
            // Dropped in production (transport active + non-dev environment) to avoid noise.
            if (sentryActive() && isProductionEnvironment()) return;
            const p = parseArgs(args);
            recordDiagnosticLog({
                level: 'info',
                scope,
                message: p.message,
                data: diagnosticData(p),
            });
            console.debug(...renderConsole(prefix, p));
        },

        info(...args) {
            const p = parseArgs(args);
            recordDiagnosticLog({
                level: 'info',
                scope,
                message: p.message,
                data: diagnosticData(p),
            });
            if (sentryActive()) {
                _transport!.addBreadcrumb({
                    category: scope,
                    message: p.message || 'info',
                    data: breadcrumbData(p),
                    level: 'info',
                });
            } else {
                console.info(...renderConsole(prefix, p));
            }
        },

        warn(...args) {
            const p = parseArgs(args);
            recordDiagnosticLog({
                level: 'warning',
                scope,
                message: p.message,
                data: diagnosticData(p),
            });
            // Always log to console so devs see warnings in both envs
            console.warn(...renderConsole(prefix, p));
            if (sentryActive()) {
                // warn never promotes to captureException; surface any Error
                // as a stringified extra so it is not silently dropped.
                const extra = sentryExtra(p);
                if (p.err) extra.error = String(p.err);
                _transport!.captureMessage(p.message || 'warning', 'warning', tags(), extra);
            }
        },

        error(...args) {
            const p = parseArgs(args);
            recordDiagnosticLog({
                level: 'error',
                scope,
                message: p.message,
                data: diagnosticData(p),
            });
            console.error(...renderConsole(prefix, p));
            if (sentryActive()) {
                if (p.err) return _transport!.captureException(p.err, tags(), sentryExtra(p));
                _transport!.captureMessage(p.message || 'error', 'error', tags(), sentryExtra(p));
                return undefined;
            }
            return undefined;
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
 * Accepts any number of arguments in any order — first Error becomes the
 * captured exception, first string becomes the message, plain objects are
 * merged into the meta bag, and everything else (primitives, arrays, extra
 * strings) is forwarded so nothing is silently dropped.
 *
 * @example
 * const log = getLogger('auth-coordinator');
 *
 * log.debug('wallet ready');
 * log.info('profile loaded', { profileId: '123' });
 * log.warn('token expiring soon', { expiresIn: 60 });
 * log.error('sign-in failed', error);
 * log.warn('failed to fetch', uri, error);   // err + extra value both captured
 * log.error(error);                          // uses error.message as the title
 * log.info('flag::', false);                 // primitives forwarded as-is
 *
 * PII fields are automatically scrubbed from meta objects. Pass { allowPii: true }
 * to expose PII in internal tooling; secrets are always redacted and cannot be bypassed.
 */
export const getLogger = (scope?: string): Logger => createLogger(scope);
