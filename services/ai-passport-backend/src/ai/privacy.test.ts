import { expect, mock, test } from 'bun:test';

const loadActiveAiConsentData = mock(async () => {
    throw new Error('Consent lookup must not run without an authenticated owner');
});

class TestAiConsentError extends Error {}

mock.module('../learncard/consent', () => ({
    AiConsentError: TestAiConsentError,
    loadActiveAiConsentData,
}));

const { boundLearnCardCall } = await import('../learncard/requestScope');
let learnCardReady: Promise<unknown> = Promise.resolve({ fake: true });
const getLearnCard = mock((options: { signal?: AbortSignal } = {}) =>
    boundLearnCardCall(learnCardReady, options)
);
mock.module('../learncard', () => ({ getLearnCard }));
mock.module('../services/dataErasure', () => ({
    assertOwnerOperationActive: async () => undefined,
}));

const {
    assertCurrentAiConsent,
    bindAiConsentRevision,
    getCurrentAiSubject,
    getCurrentAiPersonalFields,
    runWithAiPrivacyContext,
} = await import('./privacy');

test('requires an authenticated subject before consent lookup', async () => {
    await expect(assertCurrentAiConsent('model-inference')).rejects.toBeInstanceOf(
        TestAiConsentError
    );

    expect(loadActiveAiConsentData).not.toHaveBeenCalled();
});

test('an operation cannot change owners or grants while concurrent operations remain isolated', async () => {
    const owner = 'did:example:learner';
    await Promise.all(
        ['grant-a', 'grant-b'].map(revision =>
            runWithAiPrivacyContext(owner, async () => {
                expect(getCurrentAiSubject()).toBe(owner);
                expect(bindAiConsentRevision(owner, revision)).toBe(true);
                await Promise.resolve();
                expect(bindAiConsentRevision('did:example:other', revision)).toBe(false);
                expect(bindAiConsentRevision(owner, 'changed-grant')).toBe(false);
                expect(bindAiConsentRevision(owner, revision)).toBe(true);
            })
        )
    );
    expect(getCurrentAiSubject()).toBeUndefined();
});

test('known identities stay owner and consent revision bound', async () => {
    await runWithAiPrivacyContext('did:example:owner', async () => {
        expect(bindAiConsentRevision('did:example:owner', 'r1', { name: 'Alice' })).toBe(true);
        expect(bindAiConsentRevision('did:example:owner', 'r2', { name: 'Mallory' })).toBe(false);
        expect(getCurrentAiPersonalFields()).toEqual({ name: 'Alice' });
        await runWithAiPrivacyContext('did:example:other', async () => {
            expect(getCurrentAiPersonalFields()).toEqual({});
        });
        expect(getCurrentAiPersonalFields()).toEqual({ name: 'Alice' });
    });
    expect(getCurrentAiPersonalFields()).toEqual({});
});

test('a consent check stops waiting on a hung LearnCard init when its signal aborts', async () => {
    learnCardReady = new Promise(() => {});
    const controller = new AbortController();
    const deadline = new DOMException('deadline', 'TimeoutError');
    setTimeout(() => controller.abort(deadline), 20);
    const startedAt = performance.now();

    await runWithAiPrivacyContext('did:example:learner', async () => {
        await expect(
            assertCurrentAiConsent('model-inference', { signal: controller.signal })
        ).rejects.toBe(deadline);
    });

    expect(performance.now() - startedAt).toBeLessThan(500);
    expect(loadActiveAiConsentData).not.toHaveBeenCalled();
});

test('a consent check passes its signal to the consent read', async () => {
    learnCardReady = Promise.resolve({ fake: true });
    const receipt = { revision: 'r1', credentialUris: [] };
    loadActiveAiConsentData.mockImplementationOnce(
        async () =>
            ({
                records: [],
                receipt,
            }) as never
    );
    const controller = new AbortController();

    await runWithAiPrivacyContext('did:example:learner', async () => {
        expect(
            await assertCurrentAiConsent('model-inference', {
                signal: controller.signal,
            })
        ).toBe(receipt as never);
    });

    expect(loadActiveAiConsentData).toHaveBeenCalledWith(
        { fake: true },
        'did:example:learner',
        'model-inference',
        { signal: controller.signal }
    );
});

test('a consent check asks LearnCard to retry a transient init failure rather than serve the cached one', async () => {
    learnCardReady = Promise.resolve({ fake: true });
    getLearnCard.mockClear();
    loadActiveAiConsentData.mockImplementationOnce(
        async () =>
            ({
                records: [],
                receipt: { revision: 'r1', credentialUris: [] },
            }) as never
    );

    await runWithAiPrivacyContext('did:example:learner', () =>
        assertCurrentAiConsent('model-inference', { fresh: true })
    );

    expect(getLearnCard).toHaveBeenCalledWith({
        signal: undefined,
        retryTransientFailure: true,
    });
});
