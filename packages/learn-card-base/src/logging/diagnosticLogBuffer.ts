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
// The buffer has no dependency on logger.ts (which imports this module). Its
// attachment policy is intentionally stricter than the normal logger path.
// ---------------------------------------------------------------------------

export type DiagnosticLogLevel = 'info' | 'warning' | 'error';

export interface DiagnosticLogEntry {
    /** ISO-8601 timestamp of when the entry was recorded. */
    timestamp: string;
    level: DiagnosticLogLevel;
    /** Logger scope the entry originated from, when available. */
    scope?: string;
    /** Approved static event name, or a neutral redaction marker. */
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
const MAX_DIAGNOSTIC_COUNT = 10_000;

const SCRUBBED = '[scrubbed]';

let _entries: DiagnosticLogEntry[] = [];
let _collectionEnabled = true;

// ---------------------------------------------------------------------------
// String scrubbing
// ---------------------------------------------------------------------------

// Messages originate throughout the application, so pattern-based redaction
// is insufficient: relative claim paths and credential IDs have no reliable
// PII shape. Preserve only explicitly approved static event names.
const SAFE_EVENT_MESSAGES = new Set(['feedback.screenshot.capture_failed']);

const sanitizeEventMessage = (message: string): string =>
    SAFE_EVENT_MESSAGES.has(message) ? message : SCRUBBED;

// ---------------------------------------------------------------------------
// Value sanitization
// ---------------------------------------------------------------------------

/**
 * Feedback attachments are intentionally much stricter than normal logging.
 * Any string can be an identifier, credential body, claim URL, or free-form
 * user input, so structured data only retains a tiny, explicit allowlist of
 * bounded operational metadata. Values are never recursively traversed.
 */
const SAFE_BOOLEAN_KEYS = new Set(['enabled', 'connected', 'success', 'retryable']);
const SAFE_COUNT_KEYS = new Set(['count', 'attempt', 'retryCount', 'itemCount', 'statusCode']);
const SAFE_STATUS_VALUES = new Set([
    'success',
    'failure',
    'pending',
    'complete',
    'incomplete',
    'cancelled',
    'canceled',
    'timed_out',
    'unavailable',
    'offline',
    'online',
    'enabled',
    'disabled',
]);

type SafeDiagnosticData = Record<string, boolean | number | string>;

const sanitizeDiagnosticData = (value: unknown): SafeDiagnosticData | undefined => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;

    const safeData: SafeDiagnosticData = {};
    for (const [key, candidate] of Object.entries(value as Record<string, unknown>)) {
        if (SAFE_BOOLEAN_KEYS.has(key) && typeof candidate === 'boolean') {
            safeData[key] = candidate;
            continue;
        }

        if (
            SAFE_COUNT_KEYS.has(key) &&
            typeof candidate === 'number' &&
            Number.isSafeInteger(candidate) &&
            candidate >= 0 &&
            candidate <= MAX_DIAGNOSTIC_COUNT
        ) {
            safeData[key] = candidate;
            continue;
        }

        if (
            key === 'status' &&
            typeof candidate === 'string' &&
            SAFE_STATUS_VALUES.has(candidate)
        ) {
            safeData.status = candidate;
        }
    }

    return Object.keys(safeData).length > 0 ? safeData : undefined;
};

const sanitizeScope = (scope: string): string => {
    return /^[a-z][a-z0-9._-]{0,63}$/i.test(scope) ? scope : SCRUBBED;
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
        message: sanitizeEventMessage(input.message),
    };
    if (input.scope !== undefined) entry.scope = sanitizeScope(input.scope);
    const data = sanitizeDiagnosticData(input.data);
    if (data !== undefined) entry.data = data;

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
