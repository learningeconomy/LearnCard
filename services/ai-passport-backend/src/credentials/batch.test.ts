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
    markCredentialItemFailure,
    recordCredentialOutcome,
    settleCredentialBatch,
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
