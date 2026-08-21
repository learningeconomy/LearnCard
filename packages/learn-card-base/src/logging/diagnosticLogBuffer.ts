// ---------------------------------------------------------------------------
// Memory-only diagnostic log buffer (LC-2086)
//
// A bounded, in-memory ring of recent log entries used to attach "what was
// happening" context to user-submitted feedback reports. The buffer is the
// privacy-safe sibling of the Sentry logger path:
//
//   - Sanitization is FORCED. The `allowPii` bypass flag is ignored and
//     stripped — buffer contents may be attached to user-visible reports, so
//     nothing sensitive may ever enter it, even for internal debug calls.
//   - Nothing is persisted. Entries live only for the lifetime of the module
//     (the page/app session) and are dropped on disable or clear.
//   - Capacity is hard-capped at MAX_DIAGNOSTIC_LOGS entries (oldest dropped).
//
// The buffer has no dependency on logger.ts (which imports this module), so
// the PII key patterns below mirror logger.ts's patterns. Both files' tests
// lock the behavior — keep them in sync when adding patterns.
// ---------------------------------------------------------------------------

export type DiagnosticLogLevel = 'info' | 'warning' | 'error';

export interface DiagnosticLogEntry {
    /** ISO-8601 timestamp of when the entry was recorded. */
    timestamp: string;
    level: DiagnosticLogLevel;
    /** Logger scope the entry originated from, when available. */
    scope?: string;
    /** Sanitized message (emails, DIDs, bearer/JWT tokens, URL queries redacted). */
    message: string;
    /** Sanitized structured context, when provided. */
    data?: unknown;
}

export interface DiagnosticLogInput {
    level: DiagnosticLogLevel;
    scope?: string;
    message: string;
    data?: unknown;
}

const MAX_DIAGNOSTIC_LOGS = 200;
const MAX_STRING_LENGTH = 1_000;
const MAX_DEPTH = 10;

const SCRUBBED = '[scrubbed]';
const SCRUBBED_EMAIL = '[scrubbed-email]';
const SCRUBBED_DID = '[scrubbed-did]';
const TRUNCATED = '[truncated]';
const CIRCULAR = '[circular]';

let _entries: DiagnosticLogEntry[] = [];
let _collectionEnabled = true;

// ---------------------------------------------------------------------------
// PII key patterns (mirrors logger.ts)
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

// ---------------------------------------------------------------------------
// String scrubbing
// ---------------------------------------------------------------------------

// URLs first: stripping query strings and fragments removes any tokens,
// claim codes, or emails embedded in them before other patterns can match.
const URL_RE = /https?:\/\/\S+/g;
const BEARER_STRING_RE = /\bbearer\s+\S+/gi;
// JWTs are three base64url segments; standard JOSE headers start with eyJ.
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const EMAIL_RE = /\S+@\S+\.\S+/g;
const DID_RE = /\bdid:[a-z0-9]+:\S+/gi;
const URL_QUERY_OR_HASH_RE = /[?#].*$/;

/** Redacts sensitive shapes embedded in strings and truncates overlong values. */
const scrubString = (value: string): string => {
    let out = value.replace(URL_RE, url => url.replace(URL_QUERY_OR_HASH_RE, ''));
    out = out.replace(BEARER_STRING_RE, SCRUBBED);
    out = out.replace(JWT_RE, SCRUBBED);
    out = out.replace(EMAIL_RE, SCRUBBED_EMAIL);
    out = out.replace(DID_RE, SCRUBBED_DID);
    if (out.length > MAX_STRING_LENGTH) out = `${out.slice(0, MAX_STRING_LENGTH)}${TRUNCATED}`;
    return out;
};

// ---------------------------------------------------------------------------
// Value sanitization
// ---------------------------------------------------------------------------

/**
 * Recursively sanitizes an arbitrary value into a plain, JSON-safe,
 * clone-safe structure:
 *
 *   - PII-matching keys → '[scrubbed]' (regardless of any allowPii flag)
 *   - `allowPii` keys are removed entirely — the bypass is never honored here
 *   - Bearer-prefixed string values → '[scrubbed]'
 *   - Errors → `{ name, message }` with a scrubbed message
 *   - Circular references → '[circular]'
 *   - Nesting beyond MAX_DEPTH → '[truncated]' (never passes raw values through)
 *   - Strings → scrubString (emails, DIDs, bearer/JWT, URL queries, truncation)
 */
const sanitizeValue = (value: unknown, depth: number, seen: Set<object>): unknown => {
    if (depth > MAX_DEPTH) return TRUNCATED;
    if (value === null || value === undefined) return value;

    switch (typeof value) {
        case 'string':
            return scrubString(value);
        case 'number':
        case 'boolean':
        case 'bigint':
            return value;
        case 'function':
            return '[function]';
        case 'symbol':
            return '[symbol]';
        case 'object':
            break;
        default:
            return String(value);
    }

    if (value instanceof Error) {
        return { name: value.name, message: scrubString(value.message) };
    }

    if (Array.isArray(value)) {
        if (seen.has(value)) return CIRCULAR;
        seen.add(value);
        return value.map(item => sanitizeValue(item, depth + 1, seen));
    }

    const obj = value as Record<string, unknown>;
    if (seen.has(obj)) return CIRCULAR;
    seen.add(obj);

    return Object.fromEntries(
        Object.entries(obj)
            .filter(([key]) => key !== 'allowPii')
            .map(([key, val]) => {
                if (isPiiKey(key)) return [key, SCRUBBED];
                if (typeof val === 'string' && BEARER_RE.test(val)) return [key, SCRUBBED];
                return [key, sanitizeValue(val, depth + 1, seen)];
            })
    );
};

// ---------------------------------------------------------------------------
// Copy-on-read deep clone
// ---------------------------------------------------------------------------

// Entries are sanitized at record time, so stored values are already plain
// (objects, arrays, strings, numbers, booleans, null). A manual walk gives
// structuredClone-equivalent copies without depending on browser/runtime APIs.
const cloneValue = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, cloneValue(v)])
        );
    }
    return value;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Records one sanitized entry in the diagnostic buffer. A no-op while
 * collection is disabled. Oldest entries are dropped once the buffer holds
 * MAX_DIAGNOSTIC_LOGS entries.
 */
export const recordDiagnosticLog = (input: DiagnosticLogInput): void => {
    if (!_collectionEnabled) return;

    const entry: DiagnosticLogEntry = {
        timestamp: new Date().toISOString(),
        level: input.level,
        message: scrubString(input.message),
    };
    if (input.scope !== undefined) entry.scope = scrubString(input.scope);
    if (input.data !== undefined) entry.data = sanitizeValue(input.data, 0, new Set());

    _entries.push(entry);
    if (_entries.length > MAX_DIAGNOSTIC_LOGS) {
        _entries.splice(0, _entries.length - MAX_DIAGNOSTIC_LOGS);
    }
};

/**
 * Returns deep copies of the buffered entries, oldest first. Mutating the
 * returned array or its contents never affects the buffer.
 */
export const getDiagnosticLogs = (): DiagnosticLogEntry[] =>
    _entries.map(entry => cloneValue(entry) as DiagnosticLogEntry);

/** Empties the buffer. */
export const clearDiagnosticLogs = (): void => {
    _entries = [];
};

/**
 * Enables or disables collection. Disabling also clears the buffer so
 * previously recorded entries are dropped as soon as the user opts out.
 */
export const setDiagnosticLogCollectionEnabled = (enabled: boolean): void => {
    _collectionEnabled = enabled;
    if (!enabled) _entries = [];
};
