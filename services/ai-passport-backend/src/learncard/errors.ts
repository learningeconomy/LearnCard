// LearnCard network failures reach Passport as tRPC client errors. Classify them
// from structured fields only; never log the message, path or response.

/** tRPC error codes. Anything else is dropped rather than logged. */
export const LEARNCARD_TRPC_CODES = [
    'PARSE_ERROR',
    'BAD_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'METHOD_NOT_SUPPORTED',
    'TIMEOUT',
    'CONFLICT',
    'PRECONDITION_FAILED',
    'PAYLOAD_TOO_LARGE',
    'UNPROCESSABLE_CONTENT',
    'TOO_MANY_REQUESTS',
    'CLIENT_CLOSED_REQUEST',
    'INTERNAL_SERVER_ERROR',
    'NOT_IMPLEMENTED',
    'BAD_GATEWAY',
    'SERVICE_UNAVAILABLE',
    'GATEWAY_TIMEOUT',
] as const;
export type LearnCardTrpcCode = (typeof LEARNCARD_TRPC_CODES)[number];

/** Class names we report. Anything else becomes "Error" or "unknown". */
export const LEARNCARD_ERROR_CLASSES = [
    'TRPCClientError',
    'TypeError',
    'SyntaxError',
    'AbortError',
    'TimeoutError',
    'LearnCardUnavailableError',
    'Error',
    'unknown',
] as const;
export type LearnCardErrorClass = (typeof LEARNCARD_ERROR_CLASSES)[number];

/**
 * Whether the cause's message said the service identity is misconfigured,
 * matched here and then dropped. The message itself can carry a URL or DID,
 * so only this enum is kept. It decides retry vs fail for the init.
 */
export const LEARNCARD_CAUSE_KINDS = ['key_mismatch', 'did_not_found', 'other'] as const;
export type LearnCardCauseKind = (typeof LEARNCARD_CAUSE_KINDS)[number];

/**
 * Kinds that mean the service identity is misconfigured, not that the network
 * blipped: retrying the init cannot help until SEED or LEARNCARD_DID_WEB
 * changes.
 */
const IDENTITY_CAUSE_KINDS: ReadonlySet<LearnCardCauseKind> = new Set([
    'key_mismatch',
    'did_not_found',
]);

/** Highest initAttempts we log; the loader makes at most a few. */
export const MAX_LEARNCARD_INIT_ATTEMPTS = 10;

/**
 * The safe part of a LearnCard failure. Every field is an enum, a status number
 * or a runtime errno-style code, so none of them can carry a message, URL, DID,
 * seed or env value.
 */
export type LearnCardFailureDetail = {
    /** Class of the underlying failure, not of the wrapper. */
    errorClass?: LearnCardErrorClass;
    trpcCode?: LearnCardTrpcCode;
    httpStatus?: number;
    /** e.g. ECONNREFUSED, ETIMEDOUT, or Bun's ConnectionRefused. */
    causeErrno?: string;
    causeKind?: LearnCardCauseKind;
    /** Init attempts the loader made before giving up. */
    initAttempts?: number;
};

export type LearnCardFailureCode =
    | 'learncard_subject_not_found'
    | 'learncard_unauthorized'
    | 'learncard_timeout'
    | 'learncard_unavailable';

export class LearnCardUnavailableError extends Error {
    readonly detail: Readonly<LearnCardFailureDetail>;

    constructor(
        detail: LearnCardFailureDetail = {},
        message = 'LearnCard service initialization unavailable'
    ) {
        super(message);
        this.name = 'LearnCardUnavailableError';
        this.detail = Object.freeze({ ...detail });
    }
}

/** Our own bound on a LearnCard call. Named TimeoutError so callers treat it as one. */
export class LearnCardTimeoutError extends Error {
    readonly learnCardTimeout = true;

    constructor(message = 'LearnCard call timed out') {
        super(message);
        this.name = 'TimeoutError';
    }
}

/** Node errno (ECONNREFUSED), undici (UND_ERR_*) or Bun (ConnectionRefused) codes. */
export const CAUSE_ERRNO_PATTERN =
    /^(?:E[A-Z0-9_]{2,31}|UND_ERR_[A-Z_]{2,31}|[A-Z][a-z]+(?:[A-Z][a-z]+){1,5})$/;

const ownValue = (value: unknown, key: string): unknown =>
    value !== null && typeof value === 'object'
        ? Object.getOwnPropertyDescriptor(value, key)?.value
        : undefined;

const getTrpcData = (error: unknown): unknown => ownValue(error, 'data');

const toErrorClass = (error: unknown): LearnCardErrorClass => {
    if (!(error instanceof Error) && !(error instanceof DOMException)) return 'unknown';
    const name = error.name;
    return (LEARNCARD_ERROR_CLASSES as readonly string[]).includes(name)
        ? (name as LearnCardErrorClass)
        : 'Error';
};

const findCauseErrno = (error: unknown): string | undefined => {
    let current: unknown = error;
    for (let depth = 0; depth < 4 && current; depth += 1) {
        for (const key of ['code', 'errno']) {
            const value = ownValue(current, key);
            if (typeof value === 'string' && CAUSE_ERRNO_PATTERN.test(value)) return value;
        }
        current = ownValue(current, 'cause');
    }
    return undefined;
};

const CAUSE_KIND_PATTERNS: ReadonlyArray<[LearnCardCauseKind, RegExp]> = [
    // DIDKit signing the DID-auth JWT, when no verification method in the
    // LEARNCARD_DID_WEB document holds SEED's key.
    ['key_mismatch', /\bkey mismatch\b/i],
    // DIDKit resolving LEARNCARD_DID_WEB, when the network has no such profile.
    ['did_not_found', /^notFound$/],
];

const messageOf = (error: unknown): string | undefined => {
    if (typeof error === 'string') return error;
    const message = ownValue(error, 'message');
    if (typeof message === 'string') return message;
    return error instanceof Error ? error.message : undefined;
};

const toCauseKind = (error: unknown): LearnCardCauseKind | undefined => {
    let current: unknown = error;
    let kind: LearnCardCauseKind | undefined;
    for (let depth = 0; depth < 3 && current !== undefined; depth += 1) {
        // Bounded, and never stored: only the enum below leaves this function.
        const message = messageOf(current)?.slice(0, 2_048);
        if (message) {
            const match = CAUSE_KIND_PATTERNS.find(([, pattern]) => pattern.test(message));
            if (match) return match[0];
            kind = 'other';
        }
        current = ownValue(current, 'cause');
    }
    return kind;
};

/** Read only the safe structured fields off a LearnCard SDK or network failure. */
export const describeLearnCardFailure = (error: unknown): LearnCardFailureDetail => {
    if (error instanceof LearnCardUnavailableError) return { ...error.detail };
    const data = getTrpcData(error);
    const trpcCode = ownValue(data, 'code');
    const httpStatus = ownValue(data, 'httpStatus');
    const causeErrno = findCauseErrno(error);
    return {
        errorClass: toErrorClass(error),
        ...(typeof trpcCode === 'string' &&
        (LEARNCARD_TRPC_CODES as readonly string[]).includes(trpcCode)
            ? { trpcCode: trpcCode as LearnCardTrpcCode }
            : {}),
        ...(typeof httpStatus === 'number' &&
        Number.isInteger(httpStatus) &&
        httpStatus >= 100 &&
        httpStatus <= 599
            ? { httpStatus }
            : {}),
        ...(causeErrno ? { causeErrno } : {}),
    };
};

/**
 * describeLearnCardFailure for a failed service init, plus whether its message
 * named a misconfigured identity (no retry) and how many attempts the loader
 * made.
 */
export const describeLearnCardInitFailure = (
    cause: unknown,
    initAttempts: number
): LearnCardFailureDetail => {
    const causeKind = toCauseKind(cause);
    return {
        ...describeLearnCardFailure(cause),
        ...(causeKind ? { causeKind } : {}),
        ...(initAttempts > 0
            ? { initAttempts: Math.min(initAttempts, MAX_LEARNCARD_INIT_ATTEMPTS) }
            : {}),
    };
};

const isUnauthorized = ({ trpcCode, httpStatus }: LearnCardFailureDetail) =>
    trpcCode === 'UNAUTHORIZED' ||
    trpcCode === 'FORBIDDEN' ||
    httpStatus === 401 ||
    httpStatus === 403;

/** tRPC codes worth one more try: the network or a proxy in front of it blipped. */
const TRANSIENT_TRPC_CODES: ReadonlySet<LearnCardTrpcCode> = new Set([
    'TIMEOUT',
    'CLIENT_CLOSED_REQUEST',
    'TOO_MANY_REQUESTS',
    'INTERNAL_SERVER_ERROR',
    'BAD_GATEWAY',
    'SERVICE_UNAVAILABLE',
    'GATEWAY_TIMEOUT',
]);

/**
 * True when retrying could succeed: no tRPC answer at all (a dropped
 * connection, or DIDKit failing to fetch a did:web document, which it throws
 * as a bare string) or a 5xx-style tRPC code. A rejected identity, a
 * misconfigured one (key_mismatch, did_not_found), a missing profile or a bad
 * request is not transient.
 */
export const isTransientLearnCardFailure = (detail: LearnCardFailureDetail): boolean => {
    if (isUnauthorized(detail)) return false;
    if (detail.causeKind && IDENTITY_CAUSE_KINDS.has(detail.causeKind)) return false;
    if (detail.trpcCode) return TRANSIENT_TRPC_CODES.has(detail.trpcCode);
    return detail.httpStatus === undefined || detail.httpStatus >= 500;
};

/**
 * True when a remembered init failure is worth one fresh init for a caller
 * that cannot do without LearnCard (a consent gate): transient, and not our
 * own init timeout, which would make that caller wait the whole bound again.
 */
export const isRetryableCachedLearnCardFailure = (detail: LearnCardFailureDetail): boolean =>
    detail.errorClass !== 'TimeoutError' && isTransientLearnCardFailure(detail);

/**
 * Map a LearnCard SDK or network failure to a safe log code.
 *
 * NOT_FOUND is what the network returns when the subject DID has no LearnCard
 * profile, which also means it cannot hold an AI consent grant. UNAUTHORIZED and
 * FORBIDDEN mean the service identity itself was rejected (for example a SEED
 * that does not control LEARNCARD_DID_WEB), so they get their own code.
 */
export const classifyLearnCardFailure = (error: unknown): LearnCardFailureCode | undefined => {
    if (error instanceof LearnCardTimeoutError) return 'learncard_timeout';
    if (!(error instanceof Error)) return undefined;
    if (error instanceof LearnCardUnavailableError)
        return isUnauthorized(error.detail) ? 'learncard_unauthorized' : 'learncard_unavailable';
    if (error.name !== 'TRPCClientError') return undefined;
    const detail = describeLearnCardFailure(error);
    if (detail.trpcCode === 'NOT_FOUND') return 'learncard_subject_not_found';
    return isUnauthorized(detail) ? 'learncard_unauthorized' : 'learncard_unavailable';
};

/** Safe log fields for a LearnCard failure, ready for logSafeEvent. */
export const learnCardFailureLogFields = (
    error: unknown
): {
    learncardErrorClass?: LearnCardErrorClass;
    trpcCode?: LearnCardTrpcCode;
    httpStatus?: number;
    causeErrno?: string;
    causeKind?: LearnCardCauseKind;
    initAttempts?: number;
} => {
    const { errorClass, ...rest } = describeLearnCardFailure(error);
    return {
        ...(errorClass ? { learncardErrorClass: errorClass } : {}),
        ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)),
    };
};
