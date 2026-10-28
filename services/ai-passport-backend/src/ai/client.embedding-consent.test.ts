import { beforeEach, expect, mock, test } from 'bun:test';

import { reuseRequestConsentRead, runWithLearnCardRequestScope } from '../learncard/requestScope';

// One embedding AI call against the real request and AI call read caches: the
// audit check reads live when the call begins, the pre-dispatch check shares
// that read, and the result check reads live again. Each "remote" read is one
// LearnCard consent round trip, the cost that ran the opening out of budget.
// No real LearnCard, provider or network is involved.
const DID = 'did:example:learner';
let remoteGranted = true;
let remoteReads = 0;
const readRemote = async () => {
    remoteReads += 1;
    return remoteGranted;
};
const assertCurrentAiConsent = mock(
    async (_purpose: string, options: { fresh?: boolean; oncePerAiCall?: boolean } = {}) => {
        const granted = await reuseRequestConsentRead(DID, readRemote, {
            fresh: options.fresh,
            oncePerAiCall: options.oncePerAiCall,
        });
        if (!granted) throw new Error('consent revoked');
    }
);

const embeddingCreate = mock(async () => ({
    data: [{ index: 0, embedding: [0.1, 0.2] }],
}));

class TestOpenAi {
    embeddings = { create: embeddingCreate };
}

mock.module('openai', () => ({ default: TestOpenAi }));
mock.module('./privacy', () => ({
    assertCurrentAiConsent,
    getCurrentAiSubject: () => DID,
    getCurrentAiPersonalFields: () => ({}),
    getCurrentAiCredentialUris: () => [],
    bindAiConsentRevision: () => true,
}));
// The production audit check: fresh, once per AI call.
mock.module('./audit', () => ({
    withAiAudit: async (operation: { purpose: string }, callback: () => Promise<unknown>) => {
        await assertCurrentAiConsent(operation.purpose, {
            fresh: true,
            oncePerAiCall: true,
        });
        return callback();
    },
}));
mock.module('./provider-circuit', () => ({
    withAiProviderCircuit: async (_provider: string, callback: () => Promise<unknown>) =>
        callback(),
}));
mock.module('./pseudonymization', () => ({
    pseudonymizeProviderInput: async (input: unknown) => input,
    restoreProviderOutput: async (output: unknown) => output,
}));

const { embeddingAiCall } = await import('./client');

const inRequest = <T>(callback: () => Promise<T>): Promise<T> =>
    runWithLearnCardRequestScope({}, callback);

beforeEach(() => {
    remoteGranted = true;
    remoteReads = 0;
    embeddingCreate.mockClear();
});

test('one embedding call reads consent live twice: when it begins and after the result', async () => {
    expect(await inRequest(() => embeddingAiCall(['topic'], undefined, 'query'))).toEqual([
        [0.1, 0.2],
    ]);
    expect(embeddingCreate).toHaveBeenCalledTimes(1);
    // Was three: audit, pre-dispatch and result each read the contract.
    expect(remoteReads).toBe(2);
});

test('a withdrawal before the call starts: the provider is never called', async () => {
    remoteGranted = false;
    await expect(inRequest(() => embeddingAiCall(['topic'], undefined, 'query'))).rejects.toThrow(
        'consent revoked'
    );
    expect(embeddingCreate).not.toHaveBeenCalled();
    expect(remoteReads).toBe(1);
});

test('a withdrawal during the provider call: no vector is returned', async () => {
    embeddingCreate.mockImplementationOnce(async () => {
        remoteGranted = false;
        return { data: [{ index: 0, embedding: [0.1, 0.2] }] };
    });
    await expect(inRequest(() => embeddingAiCall(['topic'], undefined, 'query'))).rejects.toThrow(
        'consent revoked'
    );
    expect(embeddingCreate).toHaveBeenCalledTimes(1);
    expect(remoteReads).toBe(2);
});

test('each embedding call reads again: a withdrawal between calls blocks the next dispatch', async () => {
    await inRequest(async () => {
        await embeddingAiCall(['first'], undefined, 'query');
        remoteGranted = false;
        await expect(embeddingAiCall(['second'], undefined, 'query')).rejects.toThrow(
            'consent revoked'
        );
    });
    expect(embeddingCreate).toHaveBeenCalledTimes(1);
    expect(remoteReads).toBe(3);
});
