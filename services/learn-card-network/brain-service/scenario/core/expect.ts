/**
 * Errors and assertions shared by both drivers. A driver turns whatever its transport
 * throws (a tRPC HTTP error body, an in-process TRPCError, a refused socket) into one
 * `ScenarioError`, so steps assert on `code` and `message` and never on transport details.
 */

export type ScenarioErrorInit = {
    /** tRPC code (FORBIDDEN, UNAUTHORIZED, ...) or a transport code (ECONNREFUSED, HTTP_401). */
    code: string;
    message: string;
    /** tRPC procedure path or URL path, when known. */
    path?: string;
    httpStatus?: number;
};

export class ScenarioError extends Error {
    readonly code: string;
    readonly path?: string;
    readonly httpStatus?: number;

    constructor({ code, message, path, httpStatus }: ScenarioErrorInit) {
        super(message);
        this.name = 'ScenarioError';
        this.code = code;
        this.path = path;
        this.httpStatus = httpStatus;
    }
}

/** A step's own assertion failed. */
export class AssertionFailure extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AssertionFailure';
    }
}

export const check: (condition: unknown, message: string) => asserts condition = (
    condition,
    message
) => {
    if (!condition) throw new AssertionFailure(message);
};

/** Either the operation's result or the refusal it produced. */
export type Outcome<T> = { ok: true; result: T } | { ok: false; error: ScenarioError };

const record = (value: unknown): Record<string, unknown> | undefined =>
    value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

const stringField = (value: unknown, key: string): string | undefined => {
    const field = record(value)?.[key];
    return typeof field === 'string' ? field : undefined;
};

const numberField = (value: unknown, key: string): number | undefined => {
    const field = record(value)?.[key];
    return typeof field === 'number' ? field : undefined;
};

/**
 * Parses a tRPC v11 HTTP error envelope: `{ error: { message, data: { code, httpStatus, path } } }`
 * (or a one-element batch of it). Returns undefined when the body is not one.
 */
export const parseTrpcError = (
    body: unknown,
    fallbackStatus?: number
): ScenarioError | undefined => {
    const envelope = Array.isArray(body) ? body[0] : body;
    const error = record(record(envelope)?.error);
    if (!error) return undefined;
    // Older shapes wrap the error in `json`.
    const shaped = record(error.json) ?? error;
    const data = record(shaped.data);

    return new ScenarioError({
        code: stringField(data, 'code') ?? 'UNKNOWN',
        message: stringField(shaped, 'message') ?? 'Request failed',
        path: stringField(data, 'path'),
        httpStatus: numberField(data, 'httpStatus') ?? fallbackStatus,
    });
};

/** Normalises anything a driver call threw. Recognises TRPCError by shape so core stays transport-free. */
export const toScenarioError = (error: unknown): ScenarioError => {
    if (error instanceof ScenarioError) return error;

    const name = stringField(error, 'name');
    const code = stringField(error, 'code');
    const message = error instanceof Error ? error.message : String(error);

    if (name === 'TRPCError' && code) return new ScenarioError({ code, message });

    // Node/undici put the socket error on `cause`.
    const causeCode = stringField(record(error)?.cause, 'code');
    if (causeCode === 'ECONNREFUSED' || code === 'ECONNREFUSED') {
        return new ScenarioError({ code: 'ECONNREFUSED', message });
    }

    return new ScenarioError({ code: code ?? 'ERROR', message });
};

/** Runs an operation that may legitimately be refused. */
export const attempt = async <T>(operation: () => Promise<T>): Promise<Outcome<T>> => {
    try {
        return { ok: true, result: await operation() };
    } catch (error) {
        return { ok: false, error: toScenarioError(error) };
    }
};

/**
 * Asserts a refusal. `reason` matches the error message exactly (brain puts the
 * record-release reason, e.g. CONSENT_DENIED, in the message); `code` optionally pins the
 * tRPC code. Returns the error for further checks.
 */
export const expectDenied = <T>(
    outcome: Outcome<T>,
    reason: string | string[],
    code?: string
): ScenarioError => {
    const reasons = Array.isArray(reason) ? reason : [reason];
    if (outcome.ok) {
        throw new AssertionFailure(`expected a refusal (${reasons.join(' | ')}), got success`);
    }
    const { error } = outcome;
    if (!reasons.includes(error.message)) {
        throw new AssertionFailure(
            `expected ${reasons.join(' | ')}, got ${error.code} '${error.message}'`
        );
    }
    if (code && error.code !== code) {
        throw new AssertionFailure(`expected ${code} '${error.message}', got ${error.code}`);
    }
    return error;
};

/** Unwraps a success, failing the step with the refusal otherwise. */
export const expectOk = <T>(outcome: Outcome<T>, what: string): T => {
    if (!outcome.ok) throw outcome.error;
    check(outcome.result !== undefined, `${what} returned nothing`);
    return outcome.result;
};

export type AuditEventLike = { action: string; timestamp: string };

/** One expected position in the trail; an array accepts any of its actions. */
export type ExpectedAudit = string | readonly string[];

export type AuditSubsequenceResult =
    | { ok: true; matched: AuditEventLike[] }
    | { ok: false; missing: ExpectedAudit; matched: AuditEventLike[]; seen: string[] };

const describeExpected = (expected: ExpectedAudit): string =>
    typeof expected === 'string' ? expected : expected.join('|');

/**
 * Checks that `expected` appears, in order, among the events at or after `sinceRunStart`.
 * Events sharing a timestamp (written in one transaction, e.g. BINDING_APPROVED and
 * BINDING_ACTIVATED) are treated as unordered among themselves.
 */
export const matchAuditSubsequence = (
    events: readonly AuditEventLike[],
    expected: readonly ExpectedAudit[],
    sinceRunStart: string
): AuditSubsequenceResult => {
    const since = Date.parse(sinceRunStart);
    const chronological = events
        .filter(event => Date.parse(event.timestamp) >= since)
        .map((event, index) => ({ event, index, at: Date.parse(event.timestamp) }))
        .sort((a, b) => a.at - b.at || a.index - b.index);
    const used = new Set<number>();
    const matched: AuditEventLike[] = [];
    let floor = Number.NEGATIVE_INFINITY;

    for (const want of expected) {
        const accepts = typeof want === 'string' ? [want] : want;
        const hit = chronological.find(
            candidate =>
                candidate.at >= floor &&
                !used.has(candidate.index) &&
                accepts.includes(candidate.event.action)
        );
        if (!hit) {
            return {
                ok: false,
                missing: want,
                matched,
                seen: chronological.map(candidate => candidate.event.action),
            };
        }
        used.add(hit.index);
        matched.push(hit.event);
        floor = hit.at;
    }

    return { ok: true, matched };
};

export const expectAuditSubsequence = (
    events: readonly AuditEventLike[],
    expected: readonly ExpectedAudit[],
    sinceRunStart: string
): AuditEventLike[] => {
    const result = matchAuditSubsequence(events, expected, sinceRunStart);
    if (!result.ok) {
        throw new AssertionFailure(
            `audit trail is missing ${describeExpected(result.missing)} after ${
                result.matched.map(event => event.action).join(' → ') || 'run start'
            }; saw ${result.seen.join(', ') || 'nothing'}`
        );
    }
    return result.matched;
};
