import { afterEach, describe, expect, mock, test } from 'bun:test';
import {
    ApplyGuardrailCommand,
    BedrockRuntimeClient,
    ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, GetGuardrailCommand } from '@aws-sdk/client-bedrock';
import type { HttpRequest } from '@smithy/core/protocols';
import { getBedrockAuth, getBedrockSdkAuthConfig, hasAwsCredentialSource } from './bedrock-auth';
import { createBedrockConverseClient, createBedrockResponsesClient } from './bedrock-generation';

const SDK_ENV = [
    'AWS_BEARER_TOKEN_BEDROCK',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
] as const;
const originalEnv = Object.fromEntries(SDK_ENV.map(name => [name, process.env[name]]));
afterEach(() => {
    for (const name of SDK_ENV) {
        if (originalEnv[name] === undefined) delete process.env[name];
        else process.env[name] = originalEnv[name];
    }
});

const ok = (body: unknown) => ({
    response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: new TextEncoder().encode(JSON.stringify(body)),
    },
});
const capture = (body: unknown) => {
    const headers: string[] = [];
    return {
        headers,
        requestHandler: {
            handle: async (request: HttpRequest) => {
                headers.push(new Headers(request.headers).get('authorization') ?? '');
                return ok(body);
            },
        },
    };
};
const applyGuardrail = new ApplyGuardrailCommand({
    guardrailIdentifier: 'synthetic123',
    guardrailVersion: '1',
    source: 'INPUT',
    content: [{ text: { text: 'Synthetic' } }],
});
const guardrailResult = { action: 'NONE', outputs: [], assessments: [] };

describe('getBedrockAuth', () => {
    test.each([{}, { AWS_BEARER_TOKEN_BEDROCK: '' }, { AWS_BEARER_TOKEN_BEDROCK: '  ' }])(
        'falls back to the credential chain when no key is set (%o)',
        environment => {
            expect(getBedrockAuth(environment)).toEqual({ kind: 'credential-chain' });
        }
    );

    test('uses AWS_BEARER_TOKEN_BEDROCK as a Bedrock API key', () => {
        expect(getBedrockAuth({ AWS_BEARER_TOKEN_BEDROCK: ' synthetic-key\n' })).toEqual({
            kind: 'api-key',
            token: 'synthetic-key',
        });
    });

    test('refuses a long-term key on Fly', () => {
        expect(() =>
            getBedrockAuth({
                AWS_BEARER_TOKEN_BEDROCK: 'synthetic-key',
                FLY_APP_NAME: 'synthetic-app',
            })
        ).toThrow('AWS_BEARER_TOKEN_BEDROCK is for local development only');
    });
});

describe('hasAwsCredentialSource', () => {
    test('finds nothing without env hints or shared files', () => {
        expect(hasAwsCredentialSource({}, () => false)).toBe(false);
    });
    test.each(['AWS_ACCESS_KEY_ID', 'AWS_PROFILE', 'AWS_WEB_IDENTITY_TOKEN_FILE'])(
        'accepts %s',
        name => {
            expect(hasAwsCredentialSource({ [name]: 'synthetic' }, () => false)).toBe(true);
        }
    );
    test('checks the configured shared config file', () => {
        const fileExists = mock((path: string) => path === '/synthetic/aws-config');
        expect(
            hasAwsCredentialSource({ AWS_CONFIG_FILE: '/synthetic/aws-config' }, fileExists)
        ).toBe(true);
    });
});

describe('guardrail SDK clients', () => {
    test('runtime and control clients send the API key as a bearer token', async () => {
        const config = getBedrockSdkAuthConfig({
            kind: 'api-key',
            token: 'synthetic-key',
        });
        const runtime = capture(guardrailResult);
        const control = capture({});
        const runtimeClient = new BedrockRuntimeClient({
            region: 'us-east-1',
            requestHandler: runtime.requestHandler,
            ...config,
        });
        const controlClient = new BedrockClient({
            region: 'us-east-1',
            requestHandler: control.requestHandler,
            ...config,
        });
        await runtimeClient.send(applyGuardrail);
        await controlClient
            .send(
                new GetGuardrailCommand({
                    guardrailIdentifier: 'synthetic123',
                    guardrailVersion: '1',
                })
            )
            .catch(() => undefined); // empty body fails deserialization after the request is captured
        expect(runtime.headers).toEqual(['Bearer synthetic-key']);
        expect(control.headers).toEqual(['Bearer synthetic-key']);
    });

    test('credential chain keeps SigV4 even when .env leaves AWS_BEARER_TOKEN_BEDROCK blank', async () => {
        process.env.AWS_BEARER_TOKEN_BEDROCK = '';
        process.env.AWS_ACCESS_KEY_ID = 'AKIDSYNTHETIC';
        process.env.AWS_SECRET_ACCESS_KEY = 'synthetic-not-a-secret';
        const config = getBedrockSdkAuthConfig(getBedrockAuth(process.env));
        expect(config).toEqual({ authSchemePreference: ['sigv4'] });
        const runtime = capture(guardrailResult);
        await new BedrockRuntimeClient({
            region: 'us-east-1',
            requestHandler: runtime.requestHandler,
            ...config,
        }).send(applyGuardrail);
        expect(runtime.headers[0]).toStartWith('AWS4-HMAC-SHA256 Credential=AKIDSYNTHETIC/');

        // Why the explicit preference exists: the SDK's own default picks bearer
        // auth whenever the variable exists, even empty, and then cannot sign.
        const unpinned = capture(guardrailResult);
        await expect(
            new BedrockRuntimeClient({
                region: 'us-east-1',
                requestHandler: unpinned.requestHandler,
            }).send(applyGuardrail)
        ).rejects.toThrow();
        expect(unpinned.headers).toEqual([]);
    });
});

describe('generation clients', () => {
    const neverChain = mock(() => {
        throw new Error('credential chain must not be used with an API key');
    });
    const converseInput = {
        modelId: 'us.openai.gpt-6-luna',
        messages: [{ role: 'user' as const, content: [{ text: 'Synthetic' }] }],
    };

    test('Converse uses the API key and skips the token generator', async () => {
        const converse = capture({
            output: { message: { role: 'assistant', content: [{ text: 'ok' }] } },
            stopReason: 'end_turn',
        });
        const client = createBedrockConverseClient(
            { AWS_BEARER_TOKEN_BEDROCK: 'synthetic-key' },
            converse.requestHandler,
            neverChain
        );
        await client.send(new ConverseCommand(converseInput));
        expect(converse.headers).toEqual(['Bearer synthetic-key']);
        expect(neverChain).not.toHaveBeenCalled();
    });

    test('Responses uses the API key and skips the token generator', async () => {
        const headers: string[] = [];
        const client = createBedrockResponsesClient(
            { AWS_BEARER_TOKEN_BEDROCK: 'synthetic-key' },
            async (_url: RequestInfo | URL, init?: RequestInit) => {
                headers.push(new Headers(init?.headers).get('authorization') ?? '');
                return Response.json({ id: 'r', status: 'completed', output: [] });
            },
            neverChain
        );
        await client.responses.create({
            model: 'us.openai.gpt-6-luna',
            input: 'Synthetic',
        });
        expect(headers).toEqual(['Bearer synthetic-key']);
        expect(neverChain).not.toHaveBeenCalled();
    });

    test('without a key, generation still mints tokens from the credential chain', async () => {
        const headers: string[] = [];
        const factory = mock(() => async () => 'synthetic-short-term');
        const client = createBedrockResponsesClient(
            { AWS_BEARER_TOKEN_BEDROCK: '' },
            async (_url: RequestInfo | URL, init?: RequestInit) => {
                headers.push(new Headers(init?.headers).get('authorization') ?? '');
                return Response.json({ id: 'r', status: 'completed', output: [] });
            },
            factory
        );
        await client.responses.create({
            model: 'us.openai.gpt-6-luna',
            input: 'Synthetic',
        });
        expect(factory).toHaveBeenCalledWith({ region: 'us-east-1' });
        expect(headers).toEqual(['Bearer synthetic-short-term']);
    });

    test('a key on Fly fails at client construction', () => {
        expect(() =>
            createBedrockResponsesClient(
                {
                    AWS_BEARER_TOKEN_BEDROCK: 'synthetic-key',
                    FLY_APP_NAME: 'synthetic-app',
                },
                undefined,
                neverChain
            )
        ).toThrow('AWS_BEARER_TOKEN_BEDROCK is for local development only');
    });
});
