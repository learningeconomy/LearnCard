import { afterEach, beforeEach, expect, mock, test } from 'bun:test';

// Embedding smoke test (LC-2206): the Nova client must refuse any endpoint
// other than the approved us-east-1 Bedrock runtime before a request leaves,
// and must authenticate explicitly (SigV4 unless a local Bedrock API key is set).
const constructed: Record<string, unknown>[] = [];
const sent: unknown[] = [];
mock.module('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: class {
        constructor(config: Record<string, unknown>) {
            constructed.push(config);
        }
        async send(command: { input: unknown }) {
            sent.push(command.input);
            const vector = Array(1024).fill(1);
            return {
                body: new TextEncoder().encode(
                    JSON.stringify({
                        embeddings: [{ embeddingType: 'TEXT', embedding: vector }],
                    })
                ),
            };
        }
    },
    InvokeModelCommand: class {
        constructor(readonly input: unknown) {}
    },
}));
mock.module('./privacy', () => ({
    assertCurrentAiConsent: async () => undefined,
}));
mock.module('./usage-meter', () => ({
    reserveProviderRequest: async () => undefined,
    recordUsageRequest: () => () => undefined,
}));

const { novaEmbeddings } = await import('./nova-embeddings');

const KEYS = [
    'AWS_REGION',
    'AWS_ENDPOINT_URL',
    'AWS_ENDPOINT_URL_BEDROCK',
    'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
    'BEDROCK_EMBEDDINGS_ENABLED',
    'AWS_BEARER_TOKEN_BEDROCK',
    'FLY_APP_NAME',
] as const;
let saved: Record<string, string | undefined>;
beforeEach(() => {
    saved = Object.fromEntries(KEYS.map(key => [key, process.env[key]]));
    for (const key of KEYS) delete process.env[key];
    process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
    process.env.AWS_REGION = 'us-east-1';
    sent.length = 0;
});
afterEach(() => {
    for (const key of KEYS)
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
});

test.each([
    ['a non-us-east-1 region', { AWS_REGION: 'us-west-2' }],
    ['a missing region', { AWS_REGION: '' }],
    ['a global endpoint override', { AWS_ENDPOINT_URL: 'https://proxy.invalid' }],
    ['a Bedrock endpoint override', { AWS_ENDPOINT_URL_BEDROCK: 'https://proxy.invalid' }],
    [
        'a Bedrock runtime endpoint override',
        {
            AWS_ENDPOINT_URL_BEDROCK_RUNTIME: 'https://bedrock-runtime.eu-west-1.amazonaws.com',
        },
    ],
])('refuses %s before any request', async (_label, env) => {
    Object.assign(process.env, env);
    await expect(novaEmbeddings(['text'], 'query')).rejects.toThrow(
        'Invalid Bedrock embedding configuration'
    );
    expect(sent).toHaveLength(0);
});

test('refuses while Bedrock embeddings are disabled', async () => {
    delete process.env.BEDROCK_EMBEDDINGS_ENABLED;
    await expect(novaEmbeddings(['text'], 'query')).rejects.toThrow(
        'Bedrock embeddings are disabled'
    );
    expect(sent).toHaveLength(0);
});

test('embeds through the approved us-east-1 runtime with explicit SigV4', async () => {
    const [vector] = await novaEmbeddings(['text'], 'query');
    expect(vector).toHaveLength(1024);
    expect(sent).toEqual([
        expect.objectContaining({
            modelId: 'amazon.nova-2-multimodal-embeddings-v1:0',
        }),
    ]);
    expect(constructed[0]).toMatchObject({
        region: 'us-east-1',
        maxAttempts: 1,
        authSchemePreference: ['sigv4'],
    });
    expect(constructed[0]).not.toHaveProperty('endpoint');
    expect(constructed[0]).not.toHaveProperty('token');
});
