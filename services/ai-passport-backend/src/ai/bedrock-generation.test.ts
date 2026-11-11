import { describe, expect, it, mock, spyOn } from 'bun:test';
import { ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { GetTokenProviderConfig } from '@aws/bedrock-token-generator';
import { inspect } from 'node:util';
import { Readable } from 'node:stream';
import { encodeBedrockEvents, textEvents } from './bedrock-test-fixture';
import { AiProviderError, normalizeAiProviderError, toAiErrorPayload } from './errors';

import {
    createBedrockConverseClient,
    getBedrockGenerationModelForAudit,
    resolveBedrockGenerationModel,
} from './bedrock-generation';

const baseURL = 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1';
const apiKey = 'test-bedrock-bearer-not-a-real-secret';
const environment = { BEDROCK_BASE_URL: baseURL };
const tokenFactory = () => async () => apiKey;
const input = {
    modelId: 'us.openai.gpt-6-luna',
    messages: [
        {
            role: 'user' as const,
            content: [{ text: 'Synthetic fractions exercise' }],
        },
    ],
};
type CapturedRequest = {
    protocol: string;
    hostname: string;
    path: string;
    headers: Record<string, string>;
};

const response = (statusCode: number, body: unknown) => ({
    response: {
        statusCode,
        headers: { 'content-type': 'application/json' },
        body: new TextEncoder().encode(JSON.stringify(body)),
    },
});

describe('Bedrock generation authentication', () => {
    it('constructs without a static secret and resolves fresh tokens on successive native requests', async () => {
        const requests: CapturedRequest[] = [];
        const provideToken = mock(async () => `synthetic-rotated-${requests.length + 1}`);
        const factory = mock((config: GetTokenProviderConfig) => {
            if (config.region !== 'us-east-1') throw new Error('Wrong token region');
            return provideToken;
        });
        const logs = [
            spyOn(console, 'log'),
            spyOn(console, 'info'),
            spyOn(console, 'warn'),
            spyOn(console, 'error'),
            spyOn(console, 'debug'),
        ];
        const client = createBedrockConverseClient(
            environment,
            {
                handle: async (request: CapturedRequest) => {
                    requests.push(request);
                    if (request.path.endsWith('/converse-stream')) {
                        return {
                            response: {
                                statusCode: 200,
                                headers: {
                                    'content-type': 'application/vnd.amazon.eventstream',
                                },
                                body: Readable.from(
                                    encodeBedrockEvents(textEvents('Synthetic streamed answer'))
                                ),
                            },
                        };
                    }
                    return response(200, {
                        output: {
                            message: {
                                role: 'assistant',
                                content: [{ text: 'Synthetic answer' }],
                            },
                        },
                        stopReason: 'end_turn',
                    });
                },
            },
            factory
        );
        try {
            expect(provideToken).not.toHaveBeenCalled();
            await client.send(new ConverseCommand(input));
            await client.send(new ConverseCommand(input));
            const streamed = await client.send(new ConverseStreamCommand(input));
            const chunks: string[] = [];
            for await (const event of streamed.stream!) {
                if (event.contentBlockDelta?.delta?.text)
                    chunks.push(event.contentBlockDelta.delta.text);
            }
            expect(chunks.join('')).toBe('Synthetic streamed answer');
            expect(provideToken).toHaveBeenCalledTimes(3);
            expect(factory).toHaveBeenCalledTimes(1);
            expect(
                requests.map(request => new Headers(request.headers).get('authorization'))
            ).toEqual([
                'Bearer synthetic-rotated-1',
                'Bearer synthetic-rotated-2',
                'Bearer synthetic-rotated-3',
            ]);
            expect(requests.map(request => request.path)).toEqual([
                '/model/us.openai.gpt-6-luna/converse',
                '/model/us.openai.gpt-6-luna/converse',
                '/model/us.openai.gpt-6-luna/converse-stream',
            ]);
            for (const log of logs)
                expect(inspect(log.mock.calls)).not.toContain('synthetic-rotated');
        } finally {
            client.destroy();
            for (const log of logs) log.mockRestore();
        }
    });

    it.each(['empty', 'exception'] as const)(
        'fails %s token resolution without logging or retaining credentials or signing inference with IAM',
        async mode => {
            const privateValue = 'SYNTHETIC_PRIVATE_OIDC_JWT';
            const handler = mock(async () => response(200, {}));
            const credentials = mock(async () => ({
                accessKeyId: 'synthetic',
                secretAccessKey: 'synthetic',
            }));
            const provideToken = mock(async () => {
                if (mode === 'exception') throw new Error(privateValue);
                return ' ';
            });
            const client = createBedrockConverseClient(
                environment,
                { handle: handler },
                () => provideToken
            );
            Object.assign(client.config, { credentials });
            try {
                const error = await client.send(new ConverseCommand(input)).then(
                    () => {
                        throw new Error('Expected authentication rejection');
                    },
                    (error: unknown) => error
                );
                expect(normalizeAiProviderError(error, 'bedrock').code).toBe(
                    'ai_provider_unavailable'
                );
                expect(inspect(error)).not.toContain(privateValue);
                expect(
                    JSON.stringify(toAiErrorPayload(normalizeAiProviderError(error, 'bedrock')))
                ).not.toContain(privateValue);
                expect(credentials).not.toHaveBeenCalled();
                expect(handler).not.toHaveBeenCalled();
                expect(provideToken).toHaveBeenCalledTimes(1);
            } finally {
                client.destroy();
            }
        }
    );

    it.each([
        'https://api.openai.com/v1',
        'https://bedrock-runtime.us-west-2.amazonaws.com/openai/v1',
        'https://bedrock-runtime.eu-west-1.amazonaws.com/openai/v1',
        'http://bedrock-runtime.us-east-1.amazonaws.com/openai/v1',
        'https://bedrock-runtime.us-east-1.amazonaws.com.evil.example/openai/v1',
        'https://bedrock-runtime.us-east-1.amazonaws.com@evil.example/openai/v1',
        'https://evil.example@bedrock-runtime.us-east-1.amazonaws.com/openai/v1',
        `${baseURL}?redirect=https://evil.example`,
        `${baseURL}#fragment`,
        `${baseURL}/../v1`,
        `${baseURL}//`,
        `${baseURL}/responses`,
        'https://bedrock-runtime.us-east-1.amazonaws.com:443/openai/v1',
    ])('rejects endpoint %s before creating an authenticated client', endpoint => {
        expect(() =>
            createBedrockConverseClient({
                ...environment,
                BEDROCK_BASE_URL: endpoint,
            })
        ).toThrow();
    });

    it('serializes native Converse with bearer auth and ignores ambient region/endpoints', async () => {
        const requests: CapturedRequest[] = [];
        const handler = mock(async (request: CapturedRequest) => {
            requests.push(request);
            return response(200, {
                output: {
                    message: {
                        role: 'assistant',
                        content: [{ text: 'Synthetic answer' }],
                    },
                },
                stopReason: 'end_turn',
                usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                metrics: { latencyMs: 1 },
            });
        });
        const client = createBedrockConverseClient(
            {
                ...environment,
                AWS_REGION: 'eu-west-1',
                AWS_ENDPOINT_URL: 'https://evil.example',
                AWS_ENDPOINT_URL_BEDROCK_RUNTIME: 'https://evil.example',
            },
            { handle: handler },
            tokenFactory
        );
        try {
            const result = await client.send(new ConverseCommand(input));
            expect(result.stopReason).toBe('end_turn');
            expect(requests).toHaveLength(1);
            expect(requests[0].protocol).toBe('https:');
            expect(requests[0].hostname).toBe('bedrock-runtime.us-east-1.amazonaws.com');
            expect(requests[0].path).toBe('/model/us.openai.gpt-6-luna/converse');
            const headers = new Headers(requests[0].headers);
            expect(headers.get('authorization')).toBe(`Bearer ${apiKey}`);
            expect(headers.has('x-amz-security-token')).toBeFalse();
            expect(headers.has('x-amz-date')).toBeFalse();
        } finally {
            client.destroy();
        }
    });

    it.each([
        ['Converse', '/converse'],
        ['ConverseStream', '/converse-stream'],
    ] as const)('does not retry native %s on service failure', async (operation, suffix) => {
        const handler = mock(async (request: CapturedRequest) => {
            expect(request.hostname).toBe('bedrock-runtime.us-east-1.amazonaws.com');
            expect(request.path).toBe(`/model/us.openai.gpt-6-luna${suffix}`);
            expect(new Headers(request.headers).get('authorization')).toBe(`Bearer ${apiKey}`);
            return response(503, { message: 'synthetic unavailable' });
        });
        const client = createBedrockConverseClient(environment, { handle: handler }, tokenFactory);
        try {
            const pending =
                operation === 'Converse'
                    ? client.send(new ConverseCommand(input))
                    : client.send(new ConverseStreamCommand(input));
            await pending.then(
                () => {
                    throw new Error('Expected service failure');
                },
                (error: unknown) => {
                    expect(error).toHaveProperty('$metadata.httpStatusCode', 503);
                    expect(error).toHaveProperty('$metadata.attempts', 1);
                }
            );
            expect(handler).toHaveBeenCalledTimes(1);
        } finally {
            client.destroy();
        }
    });
});

describe('required Bedrock generation models', () => {
    it.each(['gpt-6-luna', 'gpt-6-luna-none', 'us.openai.gpt-6-luna', 'us.openai.gpt-6-luna-max'])(
        'resolves exact verified Luna profile for %s',
        model => {
            expect(resolveBedrockGenerationModel(model)).toBe('us.openai.gpt-6-luna');
            expect(getBedrockGenerationModelForAudit(model)).toBe('us.openai.gpt-6-luna');
        }
    );

    it.each([
        'gpt-6.1-sol',
        'gpt-6.1-sol-low',
        'gpt-6.1-sol-medium',
        'gpt-6.1-sol-max',
        'us.openai.gpt-6.1-sol',
        'us.openai.gpt-6.1-sol-low',
        'us.openai.gpt-6.1-sol-max',
    ])(
        'attributes the documented Sol profile but keeps its native contract closed for %s',
        model => {
            expect(getBedrockGenerationModelForAudit(model)).toBe('us.openai.gpt-6.1-sol');
            expect(() => resolveBedrockGenerationModel(model)).toThrow(AiProviderError);
        }
    );

    it.each([
        'gpt-6.1-sol-none',
        'us.openai.gpt-6.1-sol-none',
        'gpt-6.1-sol-minimal',
        'us.openai.gpt-6.1-sol-minimal',
        'gpt-6-luna-minimal',
        'us.openai.gpt-6-luna-minimal',
    ])('rejects unsupported effort aliases before audit attribution for %s', model => {
        expect(() => getBedrockGenerationModelForAudit(model)).toThrow(RangeError);
        expect(() => resolveBedrockGenerationModel(model)).toThrow(RangeError);
    });

    it.each([
        'gpt-6-sol',
        'us.openai.gpt-6-sol',
        'gpt-5.6-terra',
        'gpt-6-sol-preview',
        'gpt-6',
        'gpt-5.6-sol',
        'gpt-5.6-luna',
        'gpt-5-mini',
        'claude-4-sonnet',
        'unknown-model',
        'global.openai.gpt-6-luna',
        'eu.openai.gpt-6-luna',
        'apac.openai.gpt-5.6-terra',
        'global.openai.gpt-6.1-sol',
    ])('rejects substitutions or fabricated profiles %s', model => {
        expect(() => resolveBedrockGenerationModel(model)).toThrow();
        expect(() => getBedrockGenerationModelForAudit(model)).toThrow();
    });
});
