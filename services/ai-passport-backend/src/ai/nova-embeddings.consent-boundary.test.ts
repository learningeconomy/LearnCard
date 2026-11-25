import { beforeEach, expect, mock, test } from 'bun:test';

import { AiConsentError } from '../learncard/consent';
import { reuseRequestConsentRead, runWithLearnCardRequestScope } from '../learncard/requestScope';
import { withEmbeddingRecovery } from './embedding-recovery';

// Consent is modelled on the real request-scoped read cache: a non-fresh check
// reuses the request's shared read, a fresh one reads the "remote" contract.
// The Bedrock SDK and usage meter are fakes. Nothing leaves the process.
const DID = 'did:example:learner';
let remoteGranted = true;
let remoteReads = 0;
const readRemote = async () => {
    remoteReads += 1;
    return remoteGranted;
};
const receipt = {
    contractUri: 'lc:contract:synthetic',
    revision: '1',
    credentialUris: [],
    personalFields: [],
};
const assertCurrentAiConsent = mock(async (_purpose: string, options: { fresh?: boolean } = {}) => {
    const granted = await reuseRequestConsentRead(DID, readRemote, {
        fresh: options.fresh,
    });
    if (!granted) throw new AiConsentError('consent revoked', 'revoked');
    return receipt;
});

// Per-ordinal hooks: onSend runs while that ordinal's InvokeModel is in flight.
const sent: string[] = [];
let onSend: (text: string) => Promise<void> | void = () => undefined;
let onReserve: (count: number) => Promise<void> | void = () => undefined;
let reserves = 0;
mock.module('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: class {
        async send(command: { input: { body: string } }) {
            const text = JSON.parse(command.input.body).singleEmbeddingParams.text.value as string;
            sent.push(text);
            await onSend(text);
            return {
                body: new TextEncoder().encode(
                    JSON.stringify({
                        embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
                    })
                ),
            };
        }
    },
    InvokeModelCommand: class {
        constructor(readonly input: unknown) {}
    },
}));
const realPrivacy = await import('./privacy');
mock.module('./privacy', () => ({
    ...realPrivacy,
    assertCurrentAiConsent,
    getCurrentAiSubject: () => DID,
}));
mock.module('./usage-meter', () => ({
    reserveProviderRequest: async () => {
        reserves += 1;
        await onReserve(reserves);
    },
    recordUsageRequest: () => () => undefined,
}));

const { assertEmbeddingConsent, novaEmbeddings } = await import('./nova-embeddings');

// Start a request whose shared read says "granted", as an earlier fan-out
// check in the same search would have left it.
const inRequest = <T>(action: () => Promise<T>) =>
    runWithLearnCardRequestScope({}, async () => {
        await assertCurrentAiConsent('embedding');
        return action();
    });

beforeEach(() => {
    process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
    process.env.AWS_REGION = 'us-east-1';
    for (const key of [
        'AWS_ENDPOINT_URL',
        'AWS_ENDPOINT_URL_BEDROCK',
        'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
        'AWS_BEARER_TOKEN_BEDROCK',
        'FLY_APP_NAME',
    ])
        delete process.env[key];
    remoteGranted = true;
    remoteReads = 0;
    reserves = 0;
    sent.length = 0;
    onSend = () => undefined;
    onReserve = () => undefined;
    assertCurrentAiConsent.mockClear();
});

test('the Nova boundary check reads fresh, at most once per AI call', async () => {
    await assertEmbeddingConsent();
    expect(assertCurrentAiConsent).toHaveBeenLastCalledWith('embedding', {
        fresh: true,
        oncePerAiCall: true,
    });
});

test('consent withdrawn while ordinal 1 is in flight: its vector is dropped and ordinal 2 never dispatches', async () => {
    onSend = text => {
        if (text === 'first') remoteGranted = false;
    };
    const result = inRequest(() => novaEmbeddings(['first', 'second'], 'query'));
    await expect(result).rejects.toBeInstanceOf(AiConsentError);
    expect(sent).toEqual(['first']);
});

test("consent withdrawn between ordinals (during ordinal 2's budget reservation): ordinal 2 never dispatches", async () => {
    onReserve = count => {
        if (count === 2) remoteGranted = false;
    };
    const result = inRequest(() => novaEmbeddings(['first', 'second'], 'query'));
    await expect(result).rejects.toBeInstanceOf(AiConsentError);
    expect(sent).toEqual(['first']);
});

test('consent withdrawn before a managed retry: the retry never dispatches', async () => {
    let attempts = 0;
    onSend = () => {
        attempts += 1;
        if (attempts === 1)
            throw Object.assign(new Error('service unavailable'), {
                name: 'ServiceUnavailableException',
                $metadata: { httpStatusCode: 503 },
            });
    };
    const failed = mock(async () => {
        // The first attempt failed retryably; withdraw before the retry.
        remoteGranted = false;
        return true;
    });
    const result = inRequest(() =>
        withEmbeddingRecovery(
            {
                deadline: Date.now() + 120_000,
                reserve: async () => undefined,
                failed,
            },
            () => novaEmbeddings(['first'], 'document')
        )
    );
    await expect(result).rejects.toBeInstanceOf(AiConsentError);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(sent).toEqual(['first']);
});

test('granted consent: each ordinal reads fresh before dispatch, after reservation and after the result', async () => {
    const vectors = await inRequest(() => novaEmbeddings(['first', 'second'], 'query'));
    expect(vectors).toHaveLength(2);
    expect(sent).toEqual(['first', 'second']);
    // One seeding read for the request, then three fresh reads per ordinal.
    expect(remoteReads).toBe(1 + 3 * 2);
});
