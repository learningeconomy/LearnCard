import { expect, test } from 'bun:test';

import { BedrockConfigurationError, getBedrockGuardrailConfig } from './bedrock-config';

const environment = {
    AWS_REGION: 'us-east-1',
    BEDROCK_GUARDRAIL_ID: 'guardrail123',
    BEDROCK_GUARDRAIL_VERSION: '4',
};

test('pinned guardrail requires correct region and non-draft version', () => {
    expect(getBedrockGuardrailConfig(environment).guardrailVersion).toBe('4');
    for (const override of [
        { AWS_REGION: 'us-west-2' },
        { AWS_REGION: undefined },
        { BEDROCK_GUARDRAIL_VERSION: 'DRAFT' },
        { BEDROCK_GUARDRAIL_VERSION: '0' },
        { BEDROCK_GUARDRAIL_ID: '' },
        {
            BEDROCK_GUARDRAIL_ID: 'arn:aws:bedrock:eu-west-1:123456789012:guardrail/abc',
        },
        { AWS_ENDPOINT_URL: 'https://untrusted.invalid' },
        { AWS_ENDPOINT_URL_BEDROCK_RUNTIME: 'https://untrusted.invalid' },
    ])
        expect(() => getBedrockGuardrailConfig({ ...environment, ...override })).toThrow(
            BedrockConfigurationError
        );
});

test('standalone privacy configuration does not constrain generation models or providers', () => {
    expect(
        getBedrockGuardrailConfig({
            ...environment,
            NODE_ENV: 'production',
            CHAT_MODEL: 'gpt-6-sol',
            TITLE_MODEL: 'gpt-6-luna',
            OPENAI_API_KEY: 'synthetic-generation-key',
        })
    ).toEqual({
        region: 'us-east-1',
        guardrailIdentifier: 'guardrail123',
        guardrailVersion: '4',
    });
});
