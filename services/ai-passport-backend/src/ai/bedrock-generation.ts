import OpenAI from 'openai';
import {
    BedrockRuntimeClient,
    type BedrockRuntimeClientConfig,
} from '@aws-sdk/client-bedrock-runtime';
import { getTokenProvider, type GetTokenProviderConfig } from '@aws/bedrock-token-generator';
import { fromTokenFile } from '@aws-sdk/credential-providers';
import {
    doesIdentityRequireRefresh,
    isIdentityExpired,
    memoizeIdentityProvider,
} from '@smithy/core';
import { BEDROCK_RUNTIME_ENDPOINT } from './bedrock-config';
import { parseOpenAIModelAlias } from './providers';
import { AiProviderError } from './errors';
import { getBedrockAuth } from './bedrock-auth';

const DEFAULT_BASE_URL = `${BEDROCK_RUNTIME_ENDPOINT}/openai/v1`;
const LUNA_PROFILE = 'us.openai.gpt-6-luna';
// Exact Runtime ID verified from AWS's GPT-6.1 Sol model card, not inferred.
const SOL_PROFILE = 'us.openai.gpt-6.1-sol';

export type BedrockTokenProviderFactory = (config: GetTokenProviderConfig) => () => Promise<string>;

export const getBedrockGenerationConfig = (
    environment: NodeJS.ProcessEnv = process.env
): { baseURL: string } => {
    const baseURL = environment.BEDROCK_BASE_URL ?? DEFAULT_BASE_URL;
    // Match the complete URL, not a hostname substring. Additional regions need
    // explicit approval; a US profile is cross-Region, not single-region routing.
    if (baseURL !== DEFAULT_BASE_URL && baseURL !== `${DEFAULT_BASE_URL}/`)
        throw new Error('Unapproved BEDROCK_BASE_URL for generation');
    return { baseURL: DEFAULT_BASE_URL };
};

// Local dev: a Bedrock API key in AWS_BEARER_TOKEN_BEDROCK is the bearer token.
// Fly init maintains AWS_WEB_IDENTITY_TOKEN_FILE when AWS_ROLE_ARN is configured.
// Prefer web identity on Fly, never an ambient static credential/profile override.
// Off Fly without a key, the official generator uses the normal SDK chain (e.g. CI OIDC).
export const createBedrockConverseClient = (
    environment: NodeJS.ProcessEnv = process.env,
    requestHandler?: BedrockRuntimeClientConfig['requestHandler'],
    tokenProviderFactory: BedrockTokenProviderFactory = getTokenProvider
): BedrockRuntimeClient => {
    getBedrockGenerationConfig(environment);
    const provideToken = createGenerationTokenProvider(environment, tokenProviderFactory);
    return new BedrockRuntimeClient({
        region: 'us-east-1',
        endpoint: BEDROCK_RUNTIME_ENDPOINT,
        token: async () => {
            try {
                const token = await provideToken();
                if (!token?.trim()) throw new Error('Empty token');
                return { token };
            } catch {
                // Credential/generator errors may contain JWTs, presigned URLs or keys.
                // Do not retain the original exception as a cause or diagnostic body.
                throw new AiProviderError({
                    code: 'ai_provider_unavailable',
                    provider: 'bedrock',
                    retryable: true,
                    httpStatus: 503,
                });
            }
        },
        // Restrict eligible schemes, not merely preference: no SigV4 fallback.
        // The generator returns a string without expiry metadata. Force provider
        // resolution per request so SDK memoization cannot pin it for process life.
        httpAuthSchemeProvider: () => [
            {
                schemeId: 'smithy.api#httpBearerAuth',
                identityProperties: { forceRefresh: true },
            },
        ],
        authSchemePreference: ['httpBearerAuth'],
        maxAttempts: 1,
        ...(requestHandler && { requestHandler }),
    });
};

// Catalog verification permits attribution, not invocation or account entitlement.
// Sol's card confirms Converse but does not advertise native Structured outputs.
export const getBedrockGenerationModelForAudit = (model: string): string => {
    const baseModel = parseOpenAIModelAlias(
        model.startsWith('us.openai.') ? model.slice('us.openai.'.length) : model
    ).apiModel;
    if (baseModel === 'gpt-6-luna') return LUNA_PROFILE;
    if (baseModel === 'gpt-6.1-sol') return SOL_PROFILE;
    throw new Error('Unapproved Bedrock generation model');
};

export const resolveBedrockGenerationModel = (model: string): string => {
    const attribution = getBedrockGenerationModelForAudit(model);
    if (attribution === SOL_PROFILE)
        throw new AiProviderError({
            code: 'ai_provider_unavailable',
            provider: 'bedrock',
            retryable: true,
            httpStatus: 503,
            cause: new Error(
                'GPT-6.1 Sol activation blocked: profile us.openai.gpt-6.1-sol is documented; native strict-output support and reasoning mapping remain unverified'
            ),
        });
    return attribution;
};

function createGenerationTokenProvider(
    environment: NodeJS.ProcessEnv,
    tokenProviderFactory: BedrockTokenProviderFactory
): () => Promise<string> {
    const auth = getBedrockAuth(environment);
    if (auth.kind === 'api-key') return () => Promise.resolve(auth.token);
    const tokenConfig: GetTokenProviderConfig = { region: 'us-east-1' };
    if (environment.FLY_APP_NAME) {
        if (!environment.AWS_ROLE_ARN?.trim() || !environment.AWS_WEB_IDENTITY_TOKEN_FILE?.trim())
            throw new Error(
                'Fly Bedrock generation requires AWS_ROLE_ARN and AWS_WEB_IDENTITY_TOKEN_FILE'
            );
        tokenConfig.credentials = memoizeIdentityProvider(
            fromTokenFile({
                roleArn: environment.AWS_ROLE_ARN,
                webIdentityTokenFile: environment.AWS_WEB_IDENTITY_TOKEN_FILE,
                clientConfig: {
                    region: 'us-east-1',
                    endpoint: 'https://sts.us-east-1.amazonaws.com',
                    maxAttempts: 1,
                },
            }),
            isIdentityExpired,
            doesIdentityRequireRefresh
        );
    }
    const provideToken = tokenProviderFactory(tokenConfig);
    return provideToken;
}

/** Runtime Responses accepts these exact profiles; native Converse gates are separate. */
export const resolveBedrockResponsesModel = (model: string): string =>
    getBedrockGenerationModelForAudit(model);

export const createBedrockResponsesClient = (
    environment: NodeJS.ProcessEnv = process.env,
    fetch?: OpenAI['fetch'],
    tokenProviderFactory: BedrockTokenProviderFactory = getTokenProvider
): OpenAI => {
    const { baseURL } = getBedrockGenerationConfig(environment);
    const provideToken = createGenerationTokenProvider(environment, tokenProviderFactory);
    return new OpenAI({
        baseURL,
        organization: null,
        project: null,
        maxRetries: 0,
        // SDK decode/debug logging can contain raw SSE payloads.
        logLevel: 'off',
        fetch: (input, init) => (fetch ?? globalThis.fetch)(input, { ...init, redirect: 'error' }),
        apiKey: async () => {
            try {
                const token = await provideToken();
                if (!token?.trim()) throw new Error('Empty token');
                return token;
            } catch {
                // Do not let the SDK retain a credential error, JWT, or presigned URL.
                throw new AiProviderError({
                    code: 'ai_provider_unavailable',
                    provider: 'bedrock',
                    retryable: true,
                    httpStatus: 503,
                });
            }
        },
    });
};
