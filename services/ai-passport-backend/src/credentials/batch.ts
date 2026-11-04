import { logSafeEvent, type SafeLogMetrics } from '../logging';
import { classifyLearnCardFailure, learnCardFailureLogFields } from '../learncard/errors';
import { getLearnCardRequestSignal } from '../learncard/requestScope';
import { CredentialVerificationUnavailableError } from './verification';

/*
 * Per-credential isolation. One credential whose read or verify fails is
 * skipped and logged on its own; the rest of the batch still loads. Only a
 * batch where nothing loaded fails, with that credential's own error, as
 * before. Deadlines, aborts, consent and everything else still fail the batch.
 */

export type CredentialBatchName = 'preload' | 'context' | 'thread_context' | 'ingestion';

type FailureCode = NonNullable<SafeLogMetrics['failureCode']>;

export type CredentialBatchResult<Item> = {
    loaded: Item[];
    skipped: { index: number; code: FailureCode }[];
};

const isObject = (value: unknown): value is object =>
    value !== null && (typeof value === 'object' || typeof value === 'function');

/* Marked read/verify failures, with a fixed code when the error has none. */
const itemFailures = new WeakMap<object, FailureCode | undefined>();

/* Mark a read or verify failure of one credential. Returns the same error. */
export const markCredentialItemFailure = <Failure>(error: Failure, code?: FailureCode): Failure => {
    if (isObject(error)) itemFailures.set(error, code);
    return error;
};

export const isCredentialItemFailure = (
    error: unknown,
    options: { signal?: AbortSignal; deadlineAt?: number } = {}
): boolean => {
    /* Once the caller's deadline or abort fired, every failure is that. */
    if (options.signal?.aborted || getLearnCardRequestSignal()?.aborted) return false;
    if (options.deadlineAt !== undefined && performance.now() >= options.deadlineAt) return false;
    if (error instanceof Error && error.name === 'AbortError') return false;
    return (
        error instanceof CredentialVerificationUnavailableError ||
        (isObject(error) && itemFailures.has(error))
    );
};

export const credentialFailureCodeOf = (error: unknown): FailureCode =>
    error instanceof CredentialVerificationUnavailableError
        ? 'credential_verification_unavailable'
        : ((isObject(error) ? itemFailures.get(error) : undefined) ??
          classifyLearnCardFailure(error) ??
          'unknown');

/* A completed verify that found the credential invalid (bad signature, revoked,
 * subject mismatch...). Its stored rows are deleted, so nothing stands in. */
export const isConfirmedInvalidCredentialFailure = (error: unknown): boolean =>
    isObject(error) && itemFailures.get(error) === 'credential_invalid';

/*
 * A failure that retrying will not fix: a confirmed-invalid credential, or one
 * whose contexts leave a term undefined. Timeouts, outages, resolver and other
 * verifier failures are transient.
 */
export const isPermanentCredentialFailure = (error: unknown): boolean =>
    error instanceof CredentialVerificationUnavailableError
        ? error.verifierErrorKind === 'undefined_jsonld_term'
        : isConfirmedInvalidCredentialFailure(error);

/*
 * Known-bad credentials, per process: DID + URI of a permanent failure, kept
 * for a short TTL so the chat context does not re-read and re-verify them.
 * "invalid" is a confirmed-invalid credential; "unverifiable" is one the
 * verifier cannot finish (an undefined JSON-LD term), whose stored ingest-time
 * text may still stand in. Filled by every verified resolution (preload and
 * context). Never logged.
 */
export type KnownBadCredentialKind = 'invalid' | 'unverifiable';
export const KNOWN_BAD_CREDENTIAL_TTL_MS = 15 * 60_000;
const KNOWN_BAD_CREDENTIAL_MAX = 10_000;
const knownBadCredentials = new Map<string, { expiresAt: number; kind: KnownBadCredentialKind }>();
const knownBadKey = (did: string, uri: string) => `${did}\n${uri}`;

/* A success forgets the URI, a permanent failure remembers it; others no-op. */
export const recordCredentialOutcome = (
    did: string,
    uri: string,
    error?: unknown,
    now = Date.now()
): void => {
    const key = knownBadKey(did, uri);
    if (error === undefined) {
        knownBadCredentials.delete(key);
        return;
    }
    if (!isPermanentCredentialFailure(error)) return;
    knownBadCredentials.delete(key);
    if (knownBadCredentials.size >= KNOWN_BAD_CREDENTIAL_MAX) {
        const oldest = knownBadCredentials.keys().next().value;
        if (oldest !== undefined) knownBadCredentials.delete(oldest);
    }
    knownBadCredentials.set(key, {
        expiresAt: now + KNOWN_BAD_CREDENTIAL_TTL_MS,
        kind: isConfirmedInvalidCredentialFailure(error) ? 'invalid' : 'unverifiable',
    });
};

export const knownBadCredentialKind = (
    did: string,
    uri: string,
    now = Date.now()
): KnownBadCredentialKind | undefined => {
    const key = knownBadKey(did, uri);
    const entry = knownBadCredentials.get(key);
    if (entry === undefined) return undefined;
    if (now < entry.expiresAt) return entry.kind;
    knownBadCredentials.delete(key);
    return undefined;
};

export const isKnownBadCredential = (did: string, uri: string, now = Date.now()): boolean =>
    knownBadCredentialKind(did, uri, now) !== undefined;

/* Tests only. */
export const clearKnownBadCredentials = (): void => knownBadCredentials.clear();

/*
 * Verified credentials, per process: DID + URI + consent revision of a
 * successful read and verify, kept for a short TTL so the chat context can
 * reuse what the preload just verified instead of reading and verifying it
 * again. Callers still check consent and its revision on every use. Filled by
 * every verified resolution, dropped on any later failure and on erasure.
 */
export const VERIFIED_CREDENTIAL_TTL_MS = 5 * 60_000;
const VERIFIED_CREDENTIAL_MAX = 10_000;
const verifiedCredentials = new Map<string, { value: unknown; expiresAt: number }>();
const verifiedKey = (did: string, uri: string, revision: string) => `${did}\n${uri}\n${revision}`;

export const rememberVerifiedCredential = <Value>(
    did: string,
    uri: string,
    revision: string,
    value: Value,
    now = Date.now()
): void => {
    const key = verifiedKey(did, uri, revision);
    verifiedCredentials.delete(key);
    if (verifiedCredentials.size >= VERIFIED_CREDENTIAL_MAX) {
        const oldest = verifiedCredentials.keys().next().value;
        if (oldest !== undefined) verifiedCredentials.delete(oldest);
    }
    verifiedCredentials.set(key, {
        value,
        expiresAt: now + VERIFIED_CREDENTIAL_TTL_MS,
    });
};

export const getVerifiedCredential = <Value>(
    did: string,
    uri: string,
    revision: string,
    now = Date.now()
): Value | undefined => {
    const key = verifiedKey(did, uri, revision);
    const entry = verifiedCredentials.get(key);
    if (!entry) return undefined;
    if (now < entry.expiresAt) return entry.value as Value;
    verifiedCredentials.delete(key);
    return undefined;
};

export const forgetVerifiedCredential = (did: string, uri: string, revision: string): void => {
    verifiedCredentials.delete(verifiedKey(did, uri, revision));
};

/* Forget one owner's entries (data erasure), or every entry when no DID. */
export const clearVerifiedCredentials = (did?: string): void => {
    if (did === undefined) return verifiedCredentials.clear();
    for (const key of verifiedCredentials.keys())
        if (key.startsWith(`${did}\n`)) verifiedCredentials.delete(key);
};

/* Log one skipped credential: its position and failure code only. */
export const logCredentialSkip = (
    batch: CredentialBatchName,
    index: number,
    count: number,
    error: unknown
): FailureCode => {
    const failureCode = credentialFailureCodeOf(error);
    logSafeEvent('warn', 'credential_skipped', {
        credentialBatch: batch,
        index,
        count,
        failureCode,
        ...(error instanceof CredentialVerificationUnavailableError
            ? {
                  ...(error.verificationSubreason
                      ? { verificationSubreason: error.verificationSubreason }
                      : {}),
                  ...(error.verifierErrorKind
                      ? { verifierErrorKind: error.verifierErrorKind }
                      : {}),
              }
            : learnCardFailureLogFields(error)),
    });
    return failureCode;
};

export const logCredentialBatch = (
    batch: CredentialBatchName,
    loadedCount: number,
    skippedCount: number
): void => {
    if (loadedCount + skippedCount === 0) return;
    logSafeEvent(skippedCount > 0 ? 'warn' : 'info', 'credential_batch_completed', {
        credentialBatch: batch,
        count: loadedCount + skippedCount,
        loadedCount,
        skippedCount,
    });
};

type BatchOptions = {
    concurrency?: number;
    /* Resolve empty, not reject, when every failure is permanent. */
    allowEmpty?: boolean;
    signal?: AbortSignal;
    deadlineAt?: number;
};
type Settled<Item> = {
    results: ({ value: Item } | undefined)[];
    failures: { index: number; error: unknown }[];
};

/* At most `concurrency` tasks at once; a fatal failure stops new starts. */
const runTasks = async <Item>(
    tasks: readonly (() => Promise<Item>)[],
    options: BatchOptions
): Promise<Settled<Item>> => {
    const settled: Settled<Item> = { results: [], failures: [] };
    const limit = Math.max(
        1,
        Math.min(Math.floor(options.concurrency ?? tasks.length) || 1, tasks.length)
    );
    let nextIndex = 0;
    let failed = false;
    const worker = async (): Promise<void> => {
        while (!failed && nextIndex < tasks.length) {
            const index = nextIndex;
            nextIndex += 1;
            try {
                settled.results[index] = { value: await tasks[index]!() };
            } catch (error) {
                if (!isCredentialItemFailure(error, options)) {
                    failed = true;
                    throw error;
                }
                settled.failures.push({ index, error });
            }
        }
    };
    await Promise.all(Array.from({ length: tasks.length ? limit : 0 }, worker));
    return settled;
};

/**
 * Run one task per credential and skip the ones that fail with a credential
 * read or verify failure. Any other failure rejects the batch straight away,
 * the same as Promise.all. If nothing loaded, the first skip's error rejects,
 * unless allowEmpty is set and every failure is permanent.
 */
export const settleCredentialBatch = async <Item>(
    batch: CredentialBatchName,
    tasks: readonly (() => Promise<Item>)[],
    options: BatchOptions = {}
): Promise<CredentialBatchResult<Item>> => {
    const { results, failures } = await runTasks(tasks, options);
    failures.sort((left, right) => left.index - right.index);
    const skipped = failures.map(({ index, error }) => ({
        index,
        code: logCredentialSkip(batch, index, tasks.length, error),
    }));
    const loaded = results.flatMap(result => (result ? [result.value] : []));
    logCredentialBatch(batch, loaded.length, skipped.length);
    if (
        loaded.length === 0 &&
        failures[0] &&
        !(options.allowEmpty && failures.every(({ error }) => isPermanentCredentialFailure(error)))
    )
        throw failures[0].error;
    return { loaded, skipped };
};

/*
 * Owners whose chat start is reading credential context right now. The
 * credential preload yields to it: uncached reads wait until the context read
 * ends (or a bounded pause passes), so the two don't contend for LearnCard,
 * verification and the event loop at the moment the chat is starting.
 */
export const PRELOAD_PAUSE_MAX_MS = 30_000;
const activeContextReads = new Map<string, number>();
const contextIdleWaiters = new Map<string, Set<() => void>>();

/** Mark a context read for `did`; the returned function ends it (once). */
export const beginCredentialContextRead = (did: string): (() => void) => {
    activeContextReads.set(did, (activeContextReads.get(did) ?? 0) + 1);
    let ended = false;
    return () => {
        if (ended) return;
        ended = true;
        const remaining = (activeContextReads.get(did) ?? 1) - 1;
        if (remaining > 0) return void activeContextReads.set(did, remaining);
        activeContextReads.delete(did);
        const waiters = contextIdleWaiters.get(did);
        contextIdleWaiters.delete(did);
        waiters?.forEach(wake => wake());
    };
};

/** Resolve once no context read is active for `did`, on abort, or after `maxMs`. */
export const waitForCredentialContextIdle = (
    did: string,
    options: { signal?: AbortSignal; maxMs?: number } = {}
): Promise<void> => {
    if (!activeContextReads.has(did) || options.signal?.aborted) return Promise.resolve();
    return new Promise<void>(resolve => {
        const waiters = contextIdleWaiters.get(did) ?? new Set<() => void>();
        contextIdleWaiters.set(did, waiters);
        const wake = (): void => {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', wake);
            waiters.delete(wake);
            resolve();
        };
        const timer = setTimeout(wake, options.maxMs ?? PRELOAD_PAUSE_MAX_MS);
        options.signal?.addEventListener('abort', wake, { once: true });
        waiters.add(wake);
    });
};
