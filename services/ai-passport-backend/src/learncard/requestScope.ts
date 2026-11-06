import { AsyncLocalStorage } from 'node:async_hooks';

import { LearnCardTimeoutError } from './errors';

// Request-scoped LearnCard state. Kept dependency-free so the consent, privacy
// and search modules can all read it without an import cycle.

type ConsentReadEntry = {
    readonly did: string;
    readonly startedAt: number;
    readonly data: Promise<unknown>;
};

type LearnCardRequestScope = {
    readonly signal?: AbortSignal;
    consentRead?: ConsentReadEntry;
};

const requestScope = new AsyncLocalStorage<LearnCardRequestScope>();

type AiCallConsentScope = { consentRead?: ConsentReadEntry };

const aiCallScope = new AsyncLocalStorage<AiCallConsentScope>();

/**
 * Run `callback` as one AI call. Consent checks that ask for `oncePerAiCall`
 * share the call's newest consent read instead of each reading the contract
 * again. Every call opens its own scope, so its first check always reads, and
 * a withdrawal made before a call starts blocks it. Nested calls get their own
 * scope.
 */
export const runInAiCallConsentScope = <Result>(callback: () => Result): Result =>
    aiCallScope.run({}, callback);

/**
 * Run `callback` as one request: every LearnCard call inside it is bounded by
 * `signal`, and the consent contract is read at most once (see
 * `reuseRequestConsentRead`).
 */
export const runWithLearnCardRequestScope = <Result>(
    options: { signal?: AbortSignal },
    callback: () => Result
): Result => requestScope.run({ signal: options.signal }, callback);

/**
 * Run `callback` with no request scope: nothing inside inherits a request's
 * signal or shares its consent read. For work shared across requests.
 */
export const runOutsideLearnCardRequestScope = <Result>(callback: () => Result): Result =>
    requestScope.exit(callback);

export const getLearnCardRequestSignal = (): AbortSignal | undefined =>
    requestScope.getStore()?.signal;

/** Longest a request may reuse one consent read before it must read again. */
export const CONSENT_READ_REUSE_MAX_MS = 10_000;

/**
 * Share one in-flight or settled consent read across a request. Outside a
 * request scope this always reads. A failed read is never reused, and a read
 * older than CONSENT_READ_REUSE_MAX_MS is replaced.
 *
 * `fresh` always reads and replaces the shared entry, so later fan-out reads
 * see the newer state. Use it where an operation is about to send data to a
 * provider or publish a result.
 *
 * `oncePerAiCall` with `fresh` reuses the current AI call's read (see
 * `runInAiCallConsentScope`) and reads fresh outside one. Every fresh read
 * made inside a call becomes that call's read, so boundary checks after a
 * dispatch or publication check see the newer state.
 */
export const reuseRequestConsentRead = <T>(
    did: string,
    read: () => Promise<T>,
    {
        fresh = false,
        oncePerAiCall = false,
        now = performance.now.bind(performance),
        snapshot,
    }: {
        fresh?: boolean;
        oncePerAiCall?: boolean;
        now?: () => number;
        /** Share plain reads through the per-learner consent snapshot. */
        snapshot?: ConsentSnapshotOptions<T>;
    } = {}
): Promise<T> => {
    const call = aiCallScope.getStore();
    const callRead = call?.consentRead;
    if (fresh && oncePerAiCall && callRead && callRead.did === did)
        return callRead.data as Promise<T>;
    // Every live read refreshes the snapshot once it succeeds, so a withdrawal
    // seen by a fresh check also reaches later plain reads.
    const live = (): Promise<T> => {
        const startedAt = now();
        const data = read();
        if (snapshot) writeConsentSnapshot(did, snapshot.contract, data, startedAt);
        return data;
    };
    const scope = requestScope.getStore();
    if (!scope) return rememberAiCallRead(call, did, live(), now);
    const existing = scope.consentRead;
    if (
        !fresh &&
        existing &&
        existing.did === did &&
        now() - existing.startedAt <= CONSENT_READ_REUSE_MAX_MS
    )
        return existing.data as Promise<T>;
    if (!fresh && snapshot) {
        // A snapshot read is never the AI call's read: oncePerAiCall checks that
        // gate a provider still read live.
        const shared = readConsentSnapshot(did, snapshot, now);
        const data = boundLearnCardCall(shared.data as Promise<T>, {
            signal: snapshot.signal,
        });
        // Keep the snapshot's start time so the request reuses it no longer than
        // CONSENT_READ_REUSE_MAX_MS after the underlying read began.
        const entry: ConsentReadEntry = { did, startedAt: shared.startedAt, data };
        scope.consentRead = entry;
        data.catch(() => {
            if (scope.consentRead === entry) scope.consentRead = undefined;
        });
        return data;
    }
    const data = rememberAiCallRead(call, did, live(), now);
    const entry: ConsentReadEntry = { did, startedAt: now(), data };
    scope.consentRead = entry;
    data.catch(() => {
        if (scope.consentRead === entry) scope.consentRead = undefined;
    });
    return data;
};

/*
 * Per-learner consent snapshot: one process-wide, single-flight contract read
 * keyed on learner + contract, shared by plain (non-fresh) reads across request
 * scopes (the opening search, the suggestion preload, the expansion warm-up).
 *
 * TTL 10 s: the same staleness plain reads inside one request already accept
 * (CONSENT_READ_REUSE_MAX_MS), so sharing across requests does not widen it,
 * and a request reusing a snapshot read counts from the snapshot's start.
 * Fresh checks (provider dispatch, publication, audit, guardrail) never read it.
 *
 * Failed reads are dropped, never cached. A caller holding a revision skips an
 * entry showing another revision (`accept`). Erasure clears the learner's
 * entries. The underlying read is detached from any one caller's signal; each
 * caller bounds only its own wait.
 */
export const CONSENT_SNAPSHOT_TTL_MS = 10_000;

export type ConsentSnapshotOptions<T> = {
    contract: string;
    /** The shared read; must not depend on one caller's signal. */
    read: () => Promise<T>;
    /** Bounds this caller's wait. Defaults to the request scope's signal. */
    signal?: AbortSignal;
    /** False rejects a settled entry (e.g. another revision). */
    accept?: (value: T) => boolean;
};

type ConsentSnapshotEntry = ConsentReadEntry & {
    readonly contract: string;
    settled?: { value: unknown };
};

const consentSnapshots = new Map<string, ConsentSnapshotEntry>();
// Bumped by erasure: a live read that started before it never writes back.
let snapshotEpoch = 0;
const snapshotKey = (did: string, contract: string): string => JSON.stringify([did, contract]);

const storeConsentSnapshot = (
    did: string,
    contract: string,
    data: Promise<unknown>,
    startedAt: number
): ConsentSnapshotEntry => {
    const key = snapshotKey(did, contract);
    const entry: ConsentSnapshotEntry = { did, contract, startedAt, data };
    consentSnapshots.set(key, entry);
    data.then(
        value => {
            entry.settled = { value };
        },
        () => {
            if (consentSnapshots.get(key) === entry) consentSnapshots.delete(key);
        }
    );
    return entry;
};

// A live read replaces the snapshot only once it succeeds, and only if no
// newer read has started since; its failure never evicts a good entry.
const writeConsentSnapshot = (
    did: string,
    contract: string,
    data: Promise<unknown>,
    startedAt: number
): void => {
    const epoch = snapshotEpoch;
    data.then(
        value => {
            if (epoch !== snapshotEpoch) return;
            const current = consentSnapshots.get(snapshotKey(did, contract));
            if (current && current.startedAt > startedAt) return;
            storeConsentSnapshot(did, contract, Promise.resolve(value), startedAt);
        },
        () => undefined
    );
};

const readConsentSnapshot = <T>(
    did: string,
    snapshot: ConsentSnapshotOptions<T>,
    now: () => number
): ConsentSnapshotEntry => {
    const existing = consentSnapshots.get(snapshotKey(did, snapshot.contract));
    if (
        existing &&
        now() - existing.startedAt <= CONSENT_SNAPSHOT_TTL_MS &&
        (!existing.settled || !snapshot.accept || snapshot.accept(existing.settled.value as T))
    )
        return existing;
    return storeConsentSnapshot(did, snapshot.contract, snapshot.read(), now());
};

/** Start (or join) the learner's snapshot read; failures are swallowed. */
export const prefetchConsentSnapshot = <T>(
    did: string,
    contract: string,
    read: () => Promise<T>,
    now: () => number = performance.now.bind(performance)
): Promise<void> => {
    try {
        return readConsentSnapshot(did, { contract, read }, now).data.then(
            () => undefined,
            () => undefined
        );
    } catch {
        return Promise.resolve();
    }
};

/** Tests: drop every snapshot entry. */
export const resetConsentSnapshots = (): void => {
    snapshotEpoch += 1;
    consentSnapshots.clear();
};

/** Erasure: drop every snapshot entry for this learner. */
export const clearConsentSnapshots = (did: string): void => {
    snapshotEpoch += 1;
    for (const [key, entry] of consentSnapshots)
        if (entry.did === did) consentSnapshots.delete(key);
};

// A read made inside an AI call becomes the call's read. A failed read is
// dropped so the call's next check reads again.
const rememberAiCallRead = <T>(
    call: AiCallConsentScope | undefined,
    did: string,
    data: Promise<T>,
    now: () => number
): Promise<T> => {
    if (!call) return data;
    const entry: ConsentReadEntry = { did, startedAt: now(), data };
    call.consentRead = entry;
    data.catch(() => {
        if (call.consentRead === entry) call.consentRead = undefined;
    });
    return data;
};

const abortReason = (signal: AbortSignal): unknown =>
    signal.reason ?? new DOMException('LearnCard call aborted', 'AbortError');

/**
 * Stop waiting on a LearnCard call once `timeoutMs` passes or `signal` aborts.
 * The SDK takes no AbortSignal, so the request itself may still finish in the
 * background; the caller is released either way. The signal defaults to the
 * request scope's signal unless `detached` is set.
 */
export const boundLearnCardCall = <T>(
    work: Promise<T>,
    options: {
        signal?: AbortSignal;
        timeoutMs?: number;
        /** Ignore the request scope's signal; only `signal` and `timeoutMs` apply. */
        detached?: boolean;
    } = {}
): Promise<T> => {
    const signal = options.detached
        ? options.signal
        : (options.signal ?? getLearnCardRequestSignal());
    const { timeoutMs } = options;
    if (signal?.aborted) {
        work.catch(() => undefined);
        return Promise.reject(abortReason(signal));
    }
    if (!signal && timeoutMs === undefined) return work;

    return new Promise<T>((resolve, reject) => {
        let settled = false;
        const finish = (complete: () => void): void => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            complete();
        };
        const onAbort = (): void => finish(() => reject(abortReason(signal!)));
        const timer =
            timeoutMs === undefined || !Number.isFinite(timeoutMs)
                ? undefined
                : setTimeout(
                      () => finish(() => reject(new LearnCardTimeoutError())),
                      Math.max(0, timeoutMs)
                  );
        signal?.addEventListener('abort', onAbort, { once: true });
        work.then(
            value => finish(() => resolve(value)),
            (error: unknown) => finish(() => reject(error))
        );
    });
};
