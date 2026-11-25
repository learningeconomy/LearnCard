import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import type { GetTokenProviderConfig } from '@aws/bedrock-token-generator';
import type { HttpRequest } from '@smithy/core/protocols';

let now = 1_900_000_000_000;
let resolutions = 0;
let expectedRole = '';
const roleCredentials = mock(async () => ({
    accessKeyId: `synthetic-role-${(resolutions += 1)}`,
    secretAccessKey: 'synthetic-not-a-secret',
    sessionToken: 'synthetic-sts-session',
    expiration: new Date(now + 3_600_000),
}));
const fromTokenFile = mock(
    (config: {
        roleArn?: string;
        webIdentityTokenFile?: string;
        clientConfig?: { region?: string };
    }) => {
        if (
            config.roleArn !== expectedRole ||
            config.webIdentityTokenFile !== '/synthetic/fly-oidc'
        ) {
            throw new Error('Incorrect web identity selection');
        }
        if (config.clientConfig?.region !== 'us-east-1') throw new Error('Incorrect STS region');
        return roleCredentials;
    }
);
mock.module('@aws-sdk/credential-providers', () => ({ fromTokenFile }));
const { createBedrockConverseClient } = await import('./bedrock-generation');
afterEach(() => {
    fromTokenFile.mockClear();
    roleCredentials.mockClear();
    resolutions = 0;
});

const input = {
    modelId: 'us.openai.gpt-6-luna',
    messages: [{ role: 'user' as const, content: [{ text: 'Synthetic exercise' }] }],
};
const result = {
    response: {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: new TextEncoder().encode(
            JSON.stringify({
                output: {
                    message: {
                        role: 'assistant',
                        content: [{ text: 'Synthetic answer' }],
                    },
                },
                stopReason: 'end_turn',
            })
        ),
    },
};

describe('Fly OIDC credentials for short-term bearer generation', () => {
    it.each([
        'arn:aws:iam::123456789012:role/synthetic-runtime',
        'arn:aws:iam::123456789013:role/another-environment',
    ])(
        'uses the configured role %s and renews expired STS credentials without caching the bearer',
        async role => {
            expectedRole = role;
            const clock = spyOn(Date, 'now').mockImplementation(() => now);
            const headers: string[] = [];
            const factory = (config: GetTokenProviderConfig) => {
                if (config.region !== 'us-east-1') throw new Error('Incorrect bearer region');
                const credentials = config.credentials;
                if (typeof credentials !== 'function')
                    throw new Error('Expected web identity provider');
                return async () => `synthetic-bearer-${(await credentials()).accessKeyId}`;
            };
            const client = createBedrockConverseClient(
                {
                    FLY_APP_NAME: 'synthetic-app',
                    AWS_ROLE_ARN: role,
                    AWS_WEB_IDENTITY_TOKEN_FILE: '/synthetic/fly-oidc',
                    AWS_ACCESS_KEY_ID: 'ambient-must-not-win',
                    AWS_SECRET_ACCESS_KEY: 'ambient-must-not-win',
                    AWS_REGION: 'eu-west-1',
                },
                {
                    handle: async (request: HttpRequest) => {
                        headers.push(new Headers(request.headers).get('authorization')!);
                        return result;
                    },
                },
                factory
            );
            try {
                expect(roleCredentials).not.toHaveBeenCalled();
                await client.send(new ConverseCommand(input));
                now += 1_000;
                await client.send(new ConverseCommand(input));
                expect(roleCredentials).toHaveBeenCalledTimes(1);
                now += 56 * 60_000;
                await client.send(new ConverseCommand(input));
                expect(roleCredentials).toHaveBeenCalledTimes(2);
                expect(headers).toEqual([
                    'Bearer synthetic-bearer-synthetic-role-1',
                    'Bearer synthetic-bearer-synthetic-role-1',
                    'Bearer synthetic-bearer-synthetic-role-2',
                ]);
            } finally {
                client.destroy();
                clock.mockRestore();
            }
        }
    );

    it.each([
        { AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/synthetic-runtime' },
        { AWS_WEB_IDENTITY_TOKEN_FILE: '/synthetic/fly-oidc' },
    ])(
        'fails closed for incomplete Fly identity without trying another credential source',
        identity => {
            const factory = mock(() => async () => 'must-not-be-used');
            expect(() =>
                createBedrockConverseClient(
                    { FLY_APP_NAME: 'synthetic-app', ...identity },
                    undefined,
                    factory
                )
            ).toThrow();
            expect(factory).not.toHaveBeenCalled();
            expect(fromTokenFile).not.toHaveBeenCalled();
            expect(roleCredentials).not.toHaveBeenCalled();
        }
    );
});
