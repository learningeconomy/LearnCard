import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
    getCredentialRefreshRuntimeEnvironment,
    parseBrainServiceEnvironment,
} from './environment';
import {
    LEGACY_GOOGLE_SKILL_EMBEDDING_SEARCH_INDEX,
    LEGACY_GOOGLE_SKILL_EMBEDDING_VECTOR_INDEX_QUERY,
} from './skillEmbedding';

const REQUIRED_ENVIRONMENT = {
    SEED: 'a'.repeat(64),
    NEO4J_URI: 'bolt://localhost:7687',
    NEO4J_USERNAME: 'neo4j',
    NEO4J_PASSWORD: 'test-password',
};

describe('credential refresh configuration', () => {
    it('parses typed defaults and explicit runtime values at call time', () => {
        const previousEnabled = process.env.CREDENTIAL_REFRESH_ENABLED;
        const previousSecret = process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;
        const previousWindow = process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

        try {
            delete process.env.CREDENTIAL_REFRESH_ENABLED;
            delete process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;
            delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

            expect(getCredentialRefreshRuntimeEnvironment()).toMatchObject({
                CREDENTIAL_REFRESH_ENABLED: false,
                CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: 24,
            });

            process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
            process.env.CREDENTIAL_REFRESH_DIGEST_SECRET = 'refresh-secret';
            process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = '12.5';

            expect(getCredentialRefreshRuntimeEnvironment()).toMatchObject({
                CREDENTIAL_REFRESH_ENABLED: true,
                CREDENTIAL_REFRESH_DIGEST_SECRET: 'refresh-secret',
                CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: 12.5,
            });
        } finally {
            if (previousEnabled === undefined) delete process.env.CREDENTIAL_REFRESH_ENABLED;
            else process.env.CREDENTIAL_REFRESH_ENABLED = previousEnabled;

            if (previousSecret === undefined) delete process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;
            else process.env.CREDENTIAL_REFRESH_DIGEST_SECRET = previousSecret;

            if (previousWindow === undefined) {
                delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;
            } else {
                process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = previousWindow;
            }
        }
    });

    it.each(['development', 'production'] as const)(
        'rejects an enabled %s deployment without a dedicated digest secret',
        nodeEnvironment => {
            expect(() =>
                parseBrainServiceEnvironment({
                    ...REQUIRED_ENVIRONMENT,
                    NODE_ENV: nodeEnvironment,
                    DOMAIN_NAME: 'network.example.com',
                    CREDENTIAL_REFRESH_ENABLED: 'true',
                })
            ).toThrow(/CREDENTIAL_REFRESH_DIGEST_SECRET/);
        }
    );

    it.each(['0', '-1', 'not-a-number'])(
        'rejects invalid notification window %s',
        invalidWindow => {
            expect(() =>
                parseBrainServiceEnvironment({
                    ...REQUIRED_ENVIRONMENT,
                    NODE_ENV: 'test',
                    CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: invalidWindow,
                })
            ).toThrow(/CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS/);
        }
    );

    it('resolves the deployed function environment through the shared provider file', () => {
        const manifestPath = fileURLToPath(new URL('../../serverless.yml', import.meta.url));
        const manifest = parse(readFileSync(manifestPath, 'utf8'));

        expect(manifest.provider.environment).toBe(
            '${file(./serverless.function-env.cjs):provider}'
        );
    });

    it.each(['config.dev.json', 'config.production.json'])(
        'delivers non-secret refresh settings through checked-in stage config in %s',
        stageFile => {
            const configPath = fileURLToPath(new URL(`../../config/${stageFile}`, import.meta.url));
            const config = JSON.parse(readFileSync(configPath, 'utf8'));

            expect(config.CREDENTIAL_REFRESH_ENABLED).toBeDefined();
            expect(config.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS).toBeDefined();
        }
    );
});

describe('LC-2206 skill embedding configuration', () => {
    const DEPLOYED_LAMBDA = {
        ...REQUIRED_ENVIRONMENT,
        NODE_ENV: 'development',
        DOMAIN_NAME: 'network.example.com',
        AWS_LAMBDA_FUNCTION_NAME: 'lcn-brain-service-production-trpc',
    };
    const PRODUCTION_CONTAINER = {
        ...REQUIRED_ENVIRONMENT,
        NODE_ENV: 'production',
        DOMAIN_NAME: 'network.example.com',
    };

    it('defaults to the reviewed Nova 2 model, us-east-1 and 1024 dimensions, disabled', () => {
        expect(
            parseBrainServiceEnvironment({ ...REQUIRED_ENVIRONMENT, NODE_ENV: 'test' })
        ).toMatchObject({
            SKILL_EMBEDDING_BEDROCK_ENABLED: false,
            // Reads stay on the legacy Google index unless explicitly switched.
            SKILL_EMBEDDING_BEDROCK_READ_ENABLED: false,
            SKILL_EMBEDDING_BEDROCK_MODEL_ID: 'amazon.nova-2-multimodal-embeddings-v1:0',
            SKILL_EMBEDDING_BEDROCK_REGION: 'us-east-1',
            SKILL_EMBEDDING_DIMENSION: 1024,
            SKILL_EMBEDDING_BEDROCK_TIMEOUT_MS: 15_000,
            SKILL_EMBEDDING_CONCURRENCY: 1,
        });
    });

    it.each([
        ['deployed Lambda', DEPLOYED_LAMBDA],
        ['production container', PRODUCTION_CONTAINER],
    ])('accepts the allowlisted model and dimension in a %s', (_name, base) => {
        expect(() =>
            parseBrainServiceEnvironment({
                ...base,
                SKILL_EMBEDDING_BEDROCK_ENABLED: 'true',
                SKILL_EMBEDDING_BEDROCK_MODEL_ID: 'amazon.nova-2-multimodal-embeddings-v1:0',
                SKILL_EMBEDDING_DIMENSION: '1024',
            })
        ).not.toThrow();
    });

    it.each([
        ['deployed Lambda', DEPLOYED_LAMBDA],
        ['production container', PRODUCTION_CONTAINER],
    ])('rejects any other model or dimension at startup in a %s', (_name, base) => {
        // A different Nova 2 revision is valid locally but not allowlisted for deployment.
        expect(() =>
            parseBrainServiceEnvironment({
                ...base,
                SKILL_EMBEDDING_BEDROCK_MODEL_ID: 'amazon.nova-2-multimodal-embeddings-v1:1',
            })
        ).toThrow(/SKILL_EMBEDDING_BEDROCK_MODEL_ID/);

        for (const dimension of ['256', '384', '3072']) {
            expect(() =>
                parseBrainServiceEnvironment({ ...base, SKILL_EMBEDDING_DIMENSION: dimension })
            ).toThrow(/SKILL_EMBEDDING_DIMENSION/);
        }

        expect(() =>
            parseBrainServiceEnvironment({ ...base, SKILL_EMBEDDING_BEDROCK_REGION: 'us-west-2' })
        ).toThrow(/SKILL_EMBEDDING_BEDROCK_REGION/);
    });

    it('rejects the Google model as a Bedrock model ID and unsupported Nova dimensions everywhere', () => {
        expect(() =>
            parseBrainServiceEnvironment({
                ...REQUIRED_ENVIRONMENT,
                NODE_ENV: 'test',
                SKILL_EMBEDDING_BEDROCK_MODEL_ID: 'gemini-embedding-001',
            })
        ).toThrow(/SKILL_EMBEDDING_BEDROCK_MODEL_ID/);

        expect(() =>
            parseBrainServiceEnvironment({
                ...REQUIRED_ENVIRONMENT,
                NODE_ENV: 'test',
                SKILL_EMBEDDING_DIMENSION: '768',
            })
        ).toThrow(/SKILL_EMBEDDING_DIMENSION/);
    });

    it('allows other Nova 2 dimensions for local experiments', () => {
        expect(
            parseBrainServiceEnvironment({
                ...REQUIRED_ENVIRONMENT,
                NODE_ENV: 'development',
                IS_OFFLINE: 'true',
                SKILL_EMBEDDING_DIMENSION: '384',
            }).SKILL_EMBEDDING_DIMENSION
        ).toBe(384);
    });

    it('refuses Bedrock API keys and endpoint overrides in deployed runtimes', () => {
        const enabled = { ...DEPLOYED_LAMBDA, SKILL_EMBEDDING_BEDROCK_ENABLED: 'true' };

        expect(() =>
            parseBrainServiceEnvironment({ ...enabled, AWS_BEARER_TOKEN_BEDROCK: 'long-term-key' })
        ).toThrow(/AWS_BEARER_TOKEN_BEDROCK/);
        expect(() =>
            parseBrainServiceEnvironment({
                ...enabled,
                AWS_ENDPOINT_URL_BEDROCK_RUNTIME: 'https://proxy.example.com',
            })
        ).toThrow(/AWS_ENDPOINT_URL_BEDROCK_RUNTIME/);
    });

    it('read flag defaults off even when Nova writes are enabled in a deployed runtime', () => {
        const parsed = parseBrainServiceEnvironment({
            ...DEPLOYED_LAMBDA,
            SKILL_EMBEDDING_BEDROCK_ENABLED: 'true',
        });

        expect(parsed.SKILL_EMBEDDING_BEDROCK_ENABLED).toBe(true);
        expect(parsed.SKILL_EMBEDDING_BEDROCK_READ_ENABLED).toBe(false);
    });

    it('accepts the read flag with Nova enabled and rejects it with Nova disabled', () => {
        expect(
            parseBrainServiceEnvironment({
                ...DEPLOYED_LAMBDA,
                SKILL_EMBEDDING_BEDROCK_ENABLED: 'true',
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'true',
            }).SKILL_EMBEDDING_BEDROCK_READ_ENABLED
        ).toBe(true);

        expect(() =>
            parseBrainServiceEnvironment({
                ...REQUIRED_ENVIRONMENT,
                NODE_ENV: 'test',
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'true',
            })
        ).toThrow(/SKILL_EMBEDDING_BEDROCK_READ_ENABLED=true/);
    });

    it('keeps the legacy Google settings for the flag-off read path', () => {
        expect(
            parseBrainServiceEnvironment({
                ...DEPLOYED_LAMBDA,
                SKILL_EMBEDDING_BEDROCK_ENABLED: 'true',
                SKILL_EMBEDDING_GOOGLE_API_KEY: 'legacy-google-key',
                SKILL_EMBEDDING_GOOGLE_MODEL: 'gemini-embedding-001',
            })
        ).toMatchObject({
            SKILL_EMBEDDING_GOOGLE_API_KEY: 'legacy-google-key',
            SKILL_EMBEDDING_GOOGLE_MODEL: 'gemini-embedding-001',
        });
    });

    it("keeps main's legacy 768-d index definition for the flag-off read path", () => {
        expect(LEGACY_GOOGLE_SKILL_EMBEDDING_VECTOR_INDEX_QUERY).toBe(
            "CREATE VECTOR INDEX skill_embedding_vector_idx IF NOT EXISTS FOR (s:Skill) ON (s.embedding) OPTIONS {indexConfig: {`vector.dimensions`: 768, `vector.similarity_function`: 'cosine'}}"
        );
        expect(LEGACY_GOOGLE_SKILL_EMBEDDING_SEARCH_INDEX).toEqual({
            source: 'legacy',
            indexName: 'skill_embedding_vector_idx',
            dimension: 768,
        });
    });

    it('requires Bedrock embeddings to be enabled for the startup backfill', () => {
        expect(() =>
            parseBrainServiceEnvironment({
                ...REQUIRED_ENVIRONMENT,
                NODE_ENV: 'test',
                SKILL_EMBEDDING_BACKFILL_ON_STARTUP: 'true',
            })
        ).toThrow(/SKILL_EMBEDDING_BEDROCK_ENABLED/);
    });

    it.each([
        'config.dev.json',
        'config.production.json',
        'config.scouts.dev.json',
        'config.scouts.production.json',
    ])(
        'checked-in %s enables Nova writes, keeps reads on legacy, allowlisted values only',
        stageFile => {
            const configPath = fileURLToPath(new URL(`../../config/${stageFile}`, import.meta.url));
            const config = JSON.parse(readFileSync(configPath, 'utf8'));

            expect(config).toMatchObject({
                SKILL_EMBEDDING_BEDROCK_ENABLED: 'true',
                SKILL_EMBEDDING_BEDROCK_MODEL_ID: 'amazon.nova-2-multimodal-embeddings-v1:0',
                SKILL_EMBEDDING_BEDROCK_REGION: 'us-east-1',
                SKILL_EMBEDDING_DIMENSION: '1024',
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'false',
                SKILL_EMBEDDING_GOOGLE_MODEL: 'gemini-embedding-001',
            });
            // Only the non-secret model name is checked in; the key comes from the secrets bundle.
            expect(config).not.toHaveProperty('SKILL_EMBEDDING_GOOGLE_API_KEY');
            expect(() =>
                parseBrainServiceEnvironment({
                    ...DEPLOYED_LAMBDA,
                    ...config,
                    // Credentials come from the runtime-secrets bundle in Lambda.
                    CREDENTIAL_REFRESH_DIGEST_SECRET: 'bundle-secret',
                })
            ).not.toThrow();
        }
    );
});
