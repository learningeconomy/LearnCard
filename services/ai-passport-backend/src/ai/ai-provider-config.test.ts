import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import {
    AiProviderConfigError,
    createOpenAIResponsesClient,
    getLlmRoute,
    validateAiProviderEnvironment,
} from './ai-provider-config';
import { BedrockResponsesProvider } from './bedrock-responses';

const models = { CHAT_MODEL: 'gpt-6.1-sol', TITLE_MODEL: 'gpt-6-luna-none' };
const noFiles = () => false;
const validate = (environment: NodeJS.ProcessEnv, roleModels = models) =>
    validateAiProviderEnvironment(environment, roleModels, noFiles);
const problems = (environment: NodeJS.ProcessEnv, roleModels = models) => {
    try {
        validate(environment, roleModels);
    } catch (error) {
        expect(error).toBeInstanceOf(AiProviderConfigError);
        return (error as AiProviderConfigError).problems;
    }
    throw new Error('expected an AiProviderConfigError');
};
const bedrockKeyEnv = {
    AWS_REGION: 'us-east-1',
    AWS_BEARER_TOKEN_BEDROCK: 'synthetic-key',
    OPENAI_API_KEY: 'sk-synthetic',
};

describe('provider selection', () => {
    test('defaults to Bedrock generation and OpenAI embeddings', () => {
        expect(validate(bedrockKeyEnv)).toEqual({
            llm: 'bedrock',
            embeddings: 'openai',
            bedrockAuth: { kind: 'api-key', token: 'synthetic-key' },
            privacyGuardrailBypass: false,
        });
    });

    test('Bedrock via the normal credential chain needs no API key', () => {
        expect(
            validate({
                AWS_REGION: 'us-east-1',
                AWS_PROFILE: 'dev',
                OPENAI_API_KEY: 'sk-synthetic',
            })
        ).toMatchObject({
            llm: 'bedrock',
            bedrockAuth: { kind: 'credential-chain' },
            privacyGuardrailBypass: false,
        });
    });

    test('Fly keeps using its web identity role without local credential hints', () => {
        expect(
            validate({
                FLY_APP_NAME: 'synthetic-app',
                AWS_REGION: 'us-east-1',
                OPENAI_API_KEY: 'sk-synthetic',
            })
        ).toMatchObject({
            llm: 'bedrock',
            bedrockAuth: { kind: 'credential-chain' },
        });
    });

    test('LLM_PROVIDER=openai runs on OPENAI_API_KEY alone', () => {
        expect(validate({ LLM_PROVIDER: 'OpenAI', OPENAI_API_KEY: 'sk-synthetic' })).toEqual({
            llm: 'openai',
            embeddings: 'openai',
            bedrockAuth: { kind: 'credential-chain' },
            privacyGuardrailBypass: false,
        });
    });
});

describe('startup validation errors', () => {
    test.each([
        [
            { ...bedrockKeyEnv, LLM_PROVIDER: 'anthropic' },
            'LLM_PROVIDER must be bedrock or openai (got "anthropic")',
        ],
        [
            { ...bedrockKeyEnv, EMBEDDINGS_PROVIDER: 'cohere' },
            'EMBEDDINGS_PROVIDER must be bedrock or openai (got "cohere")',
        ],
        [
            { ...bedrockKeyEnv, AWS_REGION: undefined },
            'LLM_PROVIDER=bedrock needs AWS_REGION=us-east-1 (got nothing)',
        ],
        [
            { ...bedrockKeyEnv, AWS_REGION: 'eu-west-1' },
            'LLM_PROVIDER=bedrock needs AWS_REGION=us-east-1 (got "eu-west-1")',
        ],
        [
            { ...bedrockKeyEnv, BEDROCK_BASE_URL: 'https://example.com/openai/v1' },
            'BEDROCK_BASE_URL must be unset',
        ],
        [
            { ...bedrockKeyEnv, OPENAI_API_KEY: '' },
            'OPENAI_API_KEY is required (EMBEDDINGS_PROVIDER=openai)',
        ],
        [
            { ...bedrockKeyEnv, EMBEDDINGS_PROVIDER: 'bedrock' },
            'EMBEDDINGS_PROVIDER=bedrock is not supported. Nova 2 embeddings are selected with EMBEDDINGS_READ_GENERATION',
        ],
        [
            { ...bedrockKeyEnv, FLY_APP_NAME: 'synthetic-app' },
            'AWS_BEARER_TOKEN_BEDROCK is for local development only',
        ],
        [
            {
                LLM_PROVIDER: 'openai',
                OPENAI_API_KEY: 'sk-synthetic',
                FLY_APP_NAME: 'synthetic-app',
            },
            'LLM_PROVIDER=openai is for local development only',
        ],
    ])('%o', (environment, message) => {
        expect(problems(environment).join('\n')).toContain(message);
    });

    test('Bedrock with no key and no AWS credentials says how to fix it', () => {
        expect(problems({ AWS_REGION: 'us-east-1', OPENAI_API_KEY: 'sk-synthetic' })).toEqual([
            'LLM_PROVIDER=bedrock found no Bedrock credentials. Set AWS_BEARER_TOKEN_BEDROCK to a Bedrock API key, configure AWS credentials (AWS_PROFILE or ~/.aws), or use LLM_PROVIDER=openai with OPENAI_API_KEY',
        ]);
    });

    test('OpenAI generation without a key names both consumers', () => {
        expect(problems({ LLM_PROVIDER: 'openai' })).toEqual([
            'OPENAI_API_KEY is required (LLM_PROVIDER=openai, EMBEDDINGS_PROVIDER=openai)',
        ]);
    });

    test('unapproved role models are reported by variable name for either provider', () => {
        for (const environment of [bedrockKeyEnv, { LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'sk' }])
            expect(
                problems(environment, {
                    CHAT_MODEL: 'gpt-4o',
                    TITLE_MODEL: 'gpt-6-luna',
                })
            ).toEqual([
                'CHAT_MODEL="gpt-4o" is not an approved generation model; use gpt-6-luna or gpt-6.1-sol, optionally with a reasoning suffix such as -none or -low',
            ]);
    });

    test.each(['text-embedding-3-large', 'text-embedding-ada-002', 'amazon.titan-embed-text-v2:0'])(
        'rejects the non-allowlisted embeddings model %s at startup',
        model => {
            expect(problems({ ...bedrockKeyEnv, EMBEDDING_MODEL: model })).toEqual([
                `EMBEDDING_MODEL="${model}" is not an approved embeddings model; unset it or use text-embedding-3-small`,
            ]);
        }
    );

    test('accepts the allowlisted embeddings model or no override', () => {
        for (const EMBEDDING_MODEL of ['text-embedding-3-small', '', undefined])
            expect(validate({ ...bedrockKeyEnv, EMBEDDING_MODEL })).toMatchObject({
                embeddings: 'openai',
            });
    });

    test('collects every problem into one error', () => {
        expect(problems({ LLM_PROVIDER: 'bedrock', EMBEDDINGS_PROVIDER: 'bedrock' })).toHaveLength(
            3
        );
    });
});

describe('LLM routes', () => {
    test('Bedrock route keeps inference profiles and audit attribution', () => {
        const route = getLlmRoute({});
        expect(route.provider).toBe('bedrock');
        expect(route.requestModel('us.openai.gpt-6-luna')).toBe('us.openai.gpt-6-luna');
        expect(route.auditModel('gpt-6-luna-none')).toBe('us.openai.gpt-6-luna');
    });

    test('OpenAI route strips the Bedrock profile prefix', () => {
        const route = getLlmRoute({ LLM_PROVIDER: 'openai' });
        expect(route.provider).toBe('openai');
        expect(route.requestModel('us.openai.gpt-6-luna')).toBe('gpt-6-luna');
        expect(route.auditModel('gpt-6.1-sol-high')).toBe('gpt-6.1-sol');
    });

    test('an invalid LLM_PROVIDER fails before any client exists', () => {
        expect(() => getLlmRoute({ LLM_PROVIDER: 'bedrok' })).toThrow(AiProviderConfigError);
    });

    test('LLM_PROVIDER=openai sends the Responses request to OpenAI with OPENAI_API_KEY', async () => {
        const requests: {
            url: string;
            authorization: string | null;
            body: Record<string, unknown>;
        }[] = [];
        const route = getLlmRoute({ LLM_PROVIDER: 'openai' });
        const provider = new BedrockResponsesProvider(
            () =>
                createOpenAIResponsesClient(
                    {
                        OPENAI_API_KEY: 'sk-synthetic',
                        OPENAI_BASE_URL: 'https://ambient.example/v1',
                    },
                    async (url: RequestInfo | URL, init?: RequestInit) => {
                        requests.push({
                            url: String(url),
                            authorization: new Headers(init?.headers).get('authorization'),
                            body: JSON.parse(init?.body as string),
                        });
                        return Response.json({
                            id: 'synthetic-response',
                            status: 'completed',
                            output: [
                                {
                                    type: 'function_call',
                                    id: 'item-1',
                                    call_id: 'call-1',
                                    name: 'function_0',
                                    arguments: '{"answer":"ok"}',
                                    status: 'completed',
                                },
                            ],
                        });
                    }
                ),
            undefined,
            route
        );
        expect(
            await provider.call({
                model: 'gpt-6-luna-none',
                message: 'Synthetic',
                output: z.object({ answer: z.string() }),
            })
        ).toEqual({ answer: 'ok' });
        expect(requests).toHaveLength(1);
        expect(requests[0]).toMatchObject({
            url: 'https://api.openai.com/v1/responses',
            authorization: 'Bearer sk-synthetic',
            body: {
                model: 'gpt-6-luna',
                store: false,
                reasoning: { effort: 'none' },
            },
        });
    });

    test('OpenAI route failures are labelled openai', async () => {
        const provider = new BedrockResponsesProvider(
            () =>
                createOpenAIResponsesClient({ OPENAI_API_KEY: 'sk-synthetic' }, async () =>
                    Response.json({ error: { message: 'synthetic' } }, { status: 503 })
                ),
            undefined,
            getLlmRoute({ LLM_PROVIDER: 'openai' })
        );
        await expect(
            provider.call({
                model: 'gpt-6-luna',
                message: 'Synthetic',
                output: z.object({ answer: z.string() }),
            })
        ).rejects.toMatchObject({
            provider: 'openai',
            code: 'ai_provider_unavailable',
        });
    });
});

describe('legacy embeddings retirement', () => {
    const retired = {
        ...bedrockKeyEnv,
        EMBEDDINGS_WRITE_GENERATION: 'nova1024v1',
        EMBEDDINGS_READ_GENERATION: 'nova1024v1',
        BEDROCK_EMBEDDINGS_ENABLED: 'true',
    };
    test('Nova-only writes with Nova reads start', () => {
        expect(validate(retired).embeddings).toBe('openai');
    });
    test('Nova-only writes refuse OpenAI reads, since there is no fallback', () => {
        expect(problems({ ...retired, EMBEDDINGS_READ_GENERATION: 'openai1536' })).toEqual([
            expect.stringContaining('needs EMBEDDINGS_READ_GENERATION=nova1024v1'),
        ]);
        expect(problems({ ...retired, EMBEDDINGS_READ_GENERATION: undefined })).toEqual([
            expect.stringContaining('needs EMBEDDINGS_READ_GENERATION=nova1024v1'),
        ]);
    });
    test('Nova-only writes need Nova enabled', () => {
        expect(problems({ ...retired, BEDROCK_EMBEDDINGS_ENABLED: 'false' })).toEqual([
            expect.stringContaining('needs BEDROCK_EMBEDDINGS_ENABLED=true'),
        ]);
    });
    test('dual writes keep the OpenAI rollback path', () => {
        expect(
            validate({
                ...retired,
                EMBEDDINGS_DUAL_WRITE: 'true',
                EMBEDDINGS_READ_GENERATION: 'openai1536',
            }).embeddings
        ).toBe('openai');
    });
});
