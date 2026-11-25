import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
    clientConfigs: [] as unknown[],
    commands: [] as unknown[],
    send: vi.fn(),
}));

vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: vi.fn(function BedrockRuntimeClient(config: unknown) {
        sdk.clientConfigs.push(config);
        return { send: sdk.send, destroy: vi.fn() };
    }),
    InvokeModelCommand: vi.fn(function InvokeModelCommand(input: unknown) {
        sdk.commands.push(input);
        return { input };
    }),
}));

import {
    SkillEmbeddingError,
    buildNovaEmbeddingRequest,
    createDefaultBedrockInvoke,
    embedTextWithBedrock,
    normalizeEmbedding,
    parseNovaEmbeddingResponse,
    resetBedrockEmbeddingClients,
    sanitizeBedrockError,
    type BedrockEmbeddingConfig,
    type BedrockInvoke,
} from './bedrock-embedding.helpers';

const config: BedrockEmbeddingConfig = {
    modelId: 'amazon.nova-2-multimodal-embeddings-v1:0',
    region: 'us-east-1',
    dimension: 4,
    timeoutMs: 1_000,
};

const encode = (value: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(value));

const novaBody = (embedding: unknown, extra: Record<string, unknown> = {}) =>
    encode({ embeddings: [{ embeddingType: 'TEXT', embedding, ...extra }] });

describe('Nova 2 request shape', () => {
    it('uses GENERIC_INDEX for stored skills and TEXT_RETRIEVAL for queries', () => {
        expect(buildNovaEmbeddingRequest('Python', 'index', 1024)).toEqual({
            schemaVersion: 'nova-multimodal-embed-v1',
            taskType: 'SINGLE_EMBEDDING',
            singleEmbeddingParams: {
                embeddingPurpose: 'GENERIC_INDEX',
                embeddingDimension: 1024,
                text: { truncationMode: 'NONE', value: 'Python' },
            },
        });
        expect(
            buildNovaEmbeddingRequest('python skills', 'query', 1024).singleEmbeddingParams
                .embeddingPurpose
        ).toBe('TEXT_RETRIEVAL');
    });
});

describe('Nova 2 response parsing', () => {
    it('returns a unit-normalised vector', () => {
        const vector = parseNovaEmbeddingResponse(novaBody([3, 0, 4, 0]), 4);
        expect(vector).toEqual([0.6, 0, 0.8, 0]);
        expect(Math.hypot(...vector)).toBeCloseTo(1, 10);
    });

    it.each([
        ['wrong dimension', novaBody([1, 2, 3])],
        ['truncated input', novaBody([1, 0, 0, 0], { truncatedCharLength: 10 })],
        [
            'non-finite values',
            encode({ embeddings: [{ embeddingType: 'TEXT', embedding: [1, null, 0, 0] }] }),
        ],
        ['zero vector', novaBody([0, 0, 0, 0])],
        [
            'non-text embedding',
            encode({ embeddings: [{ embeddingType: 'IMAGE', embedding: [1, 0, 0, 0] }] }),
        ],
        [
            'multiple embeddings',
            encode({
                embeddings: [
                    { embeddingType: 'TEXT', embedding: [1, 0, 0, 0] },
                    { embeddingType: 'TEXT', embedding: [0, 1, 0, 0] },
                ],
            }),
        ],
        ['invalid JSON', new TextEncoder().encode('{not json')],
    ])('rejects %s', (_name, body) => {
        expect(() => parseNovaEmbeddingResponse(body, 4)).toThrow(SkillEmbeddingError);
    });

    it('normalizeEmbedding rejects a zero norm', () => {
        expect(() => normalizeEmbedding([0, 0])).toThrow(SkillEmbeddingError);
    });
});

describe('error sanitisation', () => {
    const providerError = (name: string, status: number) =>
        Object.assign(new Error(`secret provider body for skill text "Advanced Parsing"`), {
            name,
            $metadata: { httpStatusCode: status },
        });

    it.each([
        ['ThrottlingException', 429, 'throttled', true],
        ['ServiceQuotaExceededException', 429, 'throttled', true],
        ['AccessDeniedException', 403, 'access_denied', false],
        ['ServiceUnavailableException', 503, 'unavailable', true],
        ['ModelTimeoutException', 408, 'unavailable', true],
        ['ValidationException', 400, 'invalid_input', false],
        ['InternalServerException', 500, 'failed', false],
    ])('maps %s to %s without leaking the provider message', (name, status, code, retryable) => {
        const sanitized = sanitizeBedrockError(providerError(name, status));

        expect(sanitized.code).toBe(code);
        expect(sanitized.retryable).toBe(retryable);
        expect(sanitized.message).not.toContain('secret');
        expect(sanitized.message).not.toContain('Advanced Parsing');
        expect((sanitized as Error & { cause?: unknown }).cause).toBeUndefined();
    });
});

describe('embedTextWithBedrock', () => {
    beforeEach(() => {
        sdk.clientConfigs.length = 0;
        sdk.commands.length = 0;
        sdk.send.mockReset();
        resetBedrockEmbeddingClients();
    });

    it('sends exactly one InvokeModel request with the configured model and purpose', async () => {
        const invoke = vi.fn<BedrockInvoke>().mockResolvedValue(novaBody([1, 1, 1, 1]));

        const vector = await embedTextWithBedrock('  Data analysis  ', 'query', config, invoke);

        expect(vector).toEqual([0.5, 0.5, 0.5, 0.5]);
        expect(invoke).toHaveBeenCalledTimes(1);
        const [request] = invoke.mock.calls[0]!;
        expect(request.modelId).toBe(config.modelId);
        expect(JSON.parse(request.body)).toMatchObject({
            singleEmbeddingParams: {
                embeddingPurpose: 'TEXT_RETRIEVAL',
                embeddingDimension: 4,
                text: { value: 'Data analysis', truncationMode: 'NONE' },
            },
        });
    });

    it('rejects empty and over-long input before calling Bedrock', async () => {
        const invoke = vi.fn<BedrockInvoke>();

        await expect(embedTextWithBedrock('   ', 'index', config, invoke)).rejects.toMatchObject({
            code: 'invalid_input',
        });
        await expect(
            embedTextWithBedrock('x'.repeat(8193), 'index', config, invoke)
        ).rejects.toMatchObject({ code: 'invalid_input' });
        expect(invoke).not.toHaveBeenCalled();
    });

    it('times out and aborts the in-flight request', async () => {
        vi.useFakeTimers();
        let signal: AbortSignal | undefined;
        const invoke: BedrockInvoke = (_request, options) => {
            signal = options.abortSignal;
            return new Promise(() => undefined);
        };

        const pending = embedTextWithBedrock('slow', 'index', config, invoke);
        const assertion = expect(pending).rejects.toMatchObject({ code: 'timeout' });
        await vi.advanceTimersByTimeAsync(config.timeoutMs + 1);
        await assertion;
        expect(signal?.aborted).toBe(true);
        vi.useRealTimers();
    });

    it('builds a SigV4-only SDK client with no retries and bounded timeouts', async () => {
        sdk.send.mockResolvedValue({ body: novaBody([0, 2, 0, 0]) });

        const vector = await embedTextWithBedrock(
            'Leadership',
            'index',
            config,
            createDefaultBedrockInvoke(config)
        );

        expect(vector).toEqual([0, 1, 0, 0]);
        expect(sdk.clientConfigs).toEqual([
            {
                region: 'us-east-1',
                maxAttempts: 1,
                authSchemePreference: ['sigv4'],
                requestHandler: { requestTimeout: 1_000, connectionTimeout: 3_000 },
            },
        ]);
        expect(sdk.commands).toEqual([
            expect.objectContaining({
                modelId: 'amazon.nova-2-multimodal-embeddings-v1:0',
                contentType: 'application/json',
                accept: 'application/json',
            }),
        ]);
    });
});
