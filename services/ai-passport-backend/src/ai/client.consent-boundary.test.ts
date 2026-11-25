import { beforeEach, expect, mock, test } from 'bun:test';
import { z } from 'zod';

import { reuseRequestConsentRead, runWithLearnCardRequestScope } from '../learncard/requestScope';

// Consent is modelled on the real request-scoped read cache: a non-fresh check
// reuses the request's shared read, a fresh one reads the "remote" contract.
// No real LearnCard, provider or network is involved.
const DID = 'did:example:learner';
let remoteGranted = true;
let remoteReads = 0;
const readRemote = async () => {
    remoteReads += 1;
    return remoteGranted;
};
const assertCurrentAiConsent = mock(async (_purpose: string, options: { fresh?: boolean } = {}) => {
    const granted = await reuseRequestConsentRead(DID, readRemote, {
        fresh: options.fresh,
    });
    if (!granted) throw new Error('consent revoked');
});

const providerCall = mock(async () => ({ answer: 'synthetic answer' }));
const providerStreamingCall = mock(async () => 'synthetic answer');

class TestProvider {
    call = providerCall;
    streamingCall = providerStreamingCall;
}

mock.module('./bedrock-responses', () => ({
    BedrockResponsesProvider: TestProvider,
}));
mock.module('./privacy', () => ({
    assertCurrentAiConsent,
    getCurrentAiSubject: () => DID,
    getCurrentAiPersonalFields: () => ({}),
    getCurrentAiCredentialUris: () => [],
    bindAiConsentRevision: () => true,
}));
mock.module('./audit', () => ({
    withAiAudit: async (_operation: unknown, callback: () => Promise<unknown>) => callback(),
}));
mock.module('./provider-circuit', () => ({
    withAiProviderCircuit: async (_provider: string, callback: () => Promise<unknown>) =>
        callback(),
}));
mock.module('./pseudonymization', () => ({
    pseudonymizeProviderInput: async (input: unknown) => input,
    restoreProviderOutput: async (output: unknown) => output,
}));

const { aiCall, streamingAiCall } = await import('./client');

const output = z.object({ answer: z.string() });

// The request's first read, as the credential fetch makes it before generation.
const inRequestAfterFetch = <T>(callback: () => Promise<T>): Promise<T> =>
    runWithLearnCardRequestScope({}, async () => {
        await assertCurrentAiConsent('model-inference');
        return callback();
    });

beforeEach(() => {
    remoteGranted = true;
    remoteReads = 0;
    providerCall.mockClear();
    providerStreamingCall.mockClear();
});

test('consent revoked between the credential fetch and dispatch: the provider is never called', async () => {
    await expect(
        inRequestAfterFetch(async () => {
            remoteGranted = false;
            return aiCall({ message: 'private input', output });
        })
    ).rejects.toThrow('consent revoked');

    expect(providerCall).not.toHaveBeenCalled();
    expect(remoteReads).toBe(2);
});

test('consent revoked between provider completion and publication: no result is returned', async () => {
    providerCall.mockImplementationOnce(async () => {
        remoteGranted = false;
        return { answer: 'synthetic answer' };
    });

    await expect(
        inRequestAfterFetch(() => aiCall({ message: 'private input', output }))
    ).rejects.toThrow('consent revoked');
    expect(providerCall).toHaveBeenCalledTimes(1);
});

test('consent revoked during an external-model stream: the answer is never published', async () => {
    const onChunk = mock(async (_chunk: string) => undefined);
    providerStreamingCall.mockImplementationOnce(async () => {
        remoteGranted = false;
        return 'synthetic answer';
    });

    await expect(
        inRequestAfterFetch(() =>
            streamingAiCall({
                message: 'private input',
                options: { audience: 'external-model', onChunk },
            })
        )
    ).rejects.toThrow('consent revoked');
    expect(providerStreamingCall).toHaveBeenCalledTimes(1);
    expect(onChunk).not.toHaveBeenCalled();
});

test('a granted request still completes, with one fresh read per boundary', async () => {
    expect(await inRequestAfterFetch(() => aiCall({ message: 'private input', output }))).toEqual({
        answer: 'synthetic answer',
    });
    // The fetch read, then fresh reads before dispatch and before publication.
    expect(remoteReads).toBe(3);
});
