import { afterEach, expect, mock, test } from 'bun:test';
import {
    clearKnownBadCredentials,
    clearVerifiedCredentials,
    forgetVerifiedCredential,
    getVerifiedCredential,
    rememberVerifiedCredential,
    VERIFIED_CREDENTIAL_TTL_MS,
    isKnownBadCredential,
    KNOWN_BAD_CREDENTIAL_TTL_MS,
    emptyBatchSkipCountsOf,
    markCredentialItemFailure,
    recordCredentialOutcome,
    settleCredentialBatch,
    credentialBatchConcurrency,
    isCredentialItemFailure,
} from './batch';
import { CredentialVerificationUnavailableError } from './verification';

const originalWarn = console.warn;
const originalInfo = console.info;
afterEach(() => {
    console.warn = originalWarn;
    console.info = originalInfo;
});
const quiet = () => {
    console.warn = mock(() => undefined);
    console.info = mock(() => undefined);
};

test('returns loaded items in order and skipped positions with codes', async () => {
    quiet();
    const result = await settleCredentialBatch(
        'thread_context',
        [
            async () => 'a',
            async () => {
                throw new CredentialVerificationUnavailableError('read_empty');
            },
            async () => {
                throw markCredentialItemFailure(new Error('private'));
            },
            async () => 'd',
        ],
        { concurrency: 2 }
    );
    expect(result).toEqual({
        loaded: ['a', 'd'],
        skipped: [
            { index: 1, code: 'credential_verification_unavailable' },
            { index: 2, code: 'unknown' },
        ],
        deferred: 0,
    });
});

test('an all-skipped batch remembers skip counts on the thrown error', async () => {
    quiet();
    const first = new CredentialVerificationUnavailableError('read_empty');
    await expect(
        settleCredentialBatch('context', [
            async () => Promise.reject(first),
            async () => Promise.reject(markCredentialItemFailure(new Error('private'))),
        ])
    ).rejects.toBe(first);
    expect(emptyBatchSkipCountsOf(first)).toEqual({
        credential_verification_unavailable: 1,
        unknown: 1,
    });
});

test('an unmarked failure still rejects the batch', async () => {
    quiet();
    const consent = new Error('consent revoked');
    await expect(
        settleCredentialBatch('thread_context', [
            async () => 'a',
            async () => {
                throw consent;
            },
        ])
    ).rejects.toBe(consent);
});

test('a marked failure after the caller aborted is fatal, not a skip', async () => {
    quiet();
    const controller = new AbortController();
    controller.abort(new DOMException('deadline', 'TimeoutError'));
    const failure = new CredentialVerificationUnavailableError('sdk_exception');
    await expect(
        settleCredentialBatch('context', [async () => 'a', async () => Promise.reject(failure)], {
            signal: controller.signal,
        })
    ).rejects.toBe(failure);
});

test('an empty batch loads nothing and does not log', async () => {
    const warn = mock(() => undefined);
    const info = mock(() => undefined);
    console.warn = warn;
    console.info = info;
    expect(await settleCredentialBatch('preload', [])).toEqual({
        loaded: [],
        skipped: [],
        deferred: 0,
    });
    expect(warn).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
});

const undefinedTerm = () =>
    new CredentialVerificationUnavailableError(
        'unrecognized_verifier_error',
        'undefined_jsonld_term'
    );
const invalid = () => markCredentialItemFailure(new Error('invalid'), 'credential_invalid');

test('allowEmpty resolves empty when every failure is permanent', async () => {
    quiet();
    expect(
        await settleCredentialBatch(
            'context',
            [async () => Promise.reject(undefinedTerm()), async () => Promise.reject(invalid())],
            { allowEmpty: true }
        )
    ).toEqual({
        loaded: [],
        skipped: [
            { index: 0, code: 'credential_verification_unavailable' },
            { index: 1, code: 'credential_invalid' },
        ],
        deferred: 0,
    });
});

test('allowEmpty is ignored when any failure is transient', async () => {
    quiet();
    const transient = [
        new CredentialVerificationUnavailableError('unrecognized_verifier_error', 'jsonld_context'),
        new CredentialVerificationUnavailableError('sdk_timeout'),
        markCredentialItemFailure(new Error('read'), 'learncard_timeout'),
    ];
    for (const failure of transient)
        await expect(
            settleCredentialBatch(
                'context',
                [async () => Promise.reject(invalid()), async () => Promise.reject(failure)],
                { allowEmpty: true }
            )
        ).rejects.toBeInstanceOf(Error);
});

test('allowEmpty does not turn a passed deadline into an empty batch', async () => {
    quiet();
    await expect(
        settleCredentialBatch('context', [async () => Promise.reject(undefinedTerm())], {
            allowEmpty: true,
            deadlineAt: performance.now() - 1,
        })
    ).rejects.toBeInstanceOf(CredentialVerificationUnavailableError);
});

test('the known-bad cache keeps permanent failures for the TTL only', () => {
    clearKnownBadCredentials();
    const now = 1_000_000;
    recordCredentialOutcome('did:a', 'uri:1', undefinedTerm(), now);
    recordCredentialOutcome('did:a', 'uri:2', invalid(), now);
    recordCredentialOutcome(
        'did:a',
        'uri:3',
        new CredentialVerificationUnavailableError('sdk_timeout'),
        now
    );
    expect(isKnownBadCredential('did:a', 'uri:1', now + 1)).toBe(true);
    expect(isKnownBadCredential('did:a', 'uri:2', now + 1)).toBe(true);
    expect(isKnownBadCredential('did:a', 'uri:3', now + 1)).toBe(false);
    expect(isKnownBadCredential('did:b', 'uri:1', now + 1)).toBe(false);
    expect(isKnownBadCredential('did:a', 'uri:1', now + KNOWN_BAD_CREDENTIAL_TTL_MS)).toBe(false);
    /* A later transient failure keeps the entry; a success clears it. */
    recordCredentialOutcome('did:a', 'uri:2', new Error('other'), now);
    expect(isKnownBadCredential('did:a', 'uri:2', now + 1)).toBe(true);
    recordCredentialOutcome('did:a', 'uri:2', undefined, now);
    expect(isKnownBadCredential('did:a', 'uri:2', now + 1)).toBe(false);
    clearKnownBadCredentials();
});

test('the verified cache is keyed on owner, credential and consent revision', () => {
    clearVerifiedCredentials();
    const now = 1_000_000;
    rememberVerifiedCredential('did:a', 'uri:1', 'rev-1', 'projection', now);
    expect(getVerifiedCredential<unknown>('did:a', 'uri:1', 'rev-1', now + 1)).toBe('projection');
    expect(getVerifiedCredential<unknown>('did:a', 'uri:1', 'rev-2', now + 1)).toBe(undefined);
    expect(getVerifiedCredential<unknown>('did:b', 'uri:1', 'rev-1', now + 1)).toBe(undefined);
    expect(getVerifiedCredential<unknown>('did:a', 'uri:2', 'rev-1', now + 1)).toBe(undefined);
    forgetVerifiedCredential('did:a', 'uri:1', 'rev-1');
    expect(getVerifiedCredential<unknown>('did:a', 'uri:1', 'rev-1', now + 1)).toBe(undefined);
});

test('the verified cache expires after its TTL and clears on erasure', () => {
    clearVerifiedCredentials();
    const now = 1_000_000;
    rememberVerifiedCredential('did:a', 'uri:1', 'rev', 'a1', now);
    expect(
        getVerifiedCredential<unknown>(
            'did:a',
            'uri:1',
            'rev',
            now + VERIFIED_CREDENTIAL_TTL_MS - 1
        )
    ).toBe('a1');
    expect(
        getVerifiedCredential<unknown>('did:a', 'uri:1', 'rev', now + VERIFIED_CREDENTIAL_TTL_MS)
    ).toBe(undefined);

    rememberVerifiedCredential('did:a', 'uri:1', 'rev', 'a1', now);
    rememberVerifiedCredential('did:a', 'uri:2', 'rev', 'a2', now);
    rememberVerifiedCredential('did:ab', 'uri:1', 'rev', 'ab1', now);
    clearVerifiedCredentials('did:a');
    expect(getVerifiedCredential<unknown>('did:a', 'uri:1', 'rev', now + 1)).toBe(undefined);
    expect(getVerifiedCredential<unknown>('did:a', 'uri:2', 'rev', now + 1)).toBe(undefined);
    // Another owner, even one whose DID shares a prefix, keeps its entries.
    expect(getVerifiedCredential<unknown>('did:ab', 'uri:1', 'rev', now + 1)).toBe('ab1');
    clearVerifiedCredentials();
});

test('the verified cache stays bounded', () => {
    clearVerifiedCredentials();
    const now = 1_000_000;
    for (let index = 0; index <= 10_000; index += 1)
        rememberVerifiedCredential('did:a', `uri:${index}`, 'rev', index, now);
    expect(getVerifiedCredential<unknown>('did:a', 'uri:0', 'rev', now + 1)).toBe(undefined);
    expect(getVerifiedCredential<unknown>('did:a', 'uri:10000', 'rev', now + 1)).toBe(10_000);
    clearVerifiedCredentials();
});

test('without an explicit concurrency a batch runs at most the configured limit at once', async () => {
    quiet();
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 40 }, (_, index) => async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise(resolve => setTimeout(resolve, 1));
        active -= 1;
        return index;
    });
    const { loaded } = await settleCredentialBatch('context', tasks);
    expect(loaded).toHaveLength(40);
    expect(maxActive).toBe(credentialBatchConcurrency());
    expect(credentialBatchConcurrency()).toBe(4);
});

test('shouldStart stops new starts, counts the rest as deferred, and logs one line', async () => {
    quiet();
    const lines: unknown[] = [];
    console.warn = ((...data: unknown[]) => {
        lines.push(...data);
    }) as typeof console.warn;
    let started = 0;
    const result = await settleCredentialBatch(
        'context',
        Array.from({ length: 10 }, (_, index) => async () => {
            started += 1;
            return index;
        }),
        { concurrency: 2, shouldStart: () => started < 3 }
    );
    expect(result).toEqual({ loaded: [0, 1, 2], skipped: [], deferred: 7 });
    expect(lines).toEqual([
        expect.objectContaining({
            event: 'credential_batch_completed',
            count: 10,
            loadedCount: 3,
            skippedCount: 0,
            deferredCount: 7,
        }),
    ]);
});

test('a budget spent before anything loaded fails as an item failure with skip counts', async () => {
    quiet();
    const error = await settleCredentialBatch('context', [async () => 1, async () => 2], {
        shouldStart: () => false,
    }).catch((caught: unknown) => caught);
    expect(isCredentialItemFailure(error)).toBe(true);
    expect(emptyBatchSkipCountsOf(error)).toEqual({ credential_budget_exhausted: 2 });
});

test('maxLoaded returns as soon as that many loaded; running tasks are deferred', async () => {
    quiet();
    let started = 0;
    const slow = () => new Promise<string>(resolve => setTimeout(() => resolve('slow'), 500));
    const tasks = Array.from({ length: 10 }, (_, index) => async () => {
        started += 1;
        if (index < 2) return `fast-${index}`;
        return slow();
    });
    const startedAt = performance.now();
    const result = await settleCredentialBatch('thread_context', tasks, {
        concurrency: 4,
        maxLoaded: 2,
    });
    expect(performance.now() - startedAt).toBeLessThan(250);
    expect(result.loaded).toEqual(['fast-0', 'fast-1']);
    expect(result.skipped).toEqual([]);
    expect(result.deferred).toBe(8);
    expect(started).toBeLessThanOrEqual(6);
});

test('stopAt returns by the stop with what settled; a hung task is deferred, not awaited', async () => {
    quiet();
    const tasks = [
        async () => 'a',
        () => new Promise<string>(() => undefined),
        async () => {
            throw markCredentialItemFailure(new Error('bad'), 'credential_invalid');
        },
        async () => 'd',
    ];
    const startedAt = performance.now();
    const result = await settleCredentialBatch('thread_context', tasks, {
        concurrency: 2,
        stopAt: performance.now() + 100,
    });
    expect(performance.now() - startedAt).toBeLessThan(400);
    expect(result.loaded).toEqual(['a', 'd']);
    expect(result.skipped.map(item => item.index)).toEqual([2]);
    expect(result.deferred).toBe(1);
});
