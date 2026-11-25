import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeRuntimeSecrets, resolveStageDefaults } from '@learncard/service-config';

import { parseLcaApiEnvironment } from './environment';
import { base, stages } from './stageConfig';

const require = createRequire(import.meta.url);
const functions: {
    api: () => Record<string, string>;
    provider: (context?: { options: { stage: string } }) => Record<string, unknown>;
} = require('../../serverless.function-env.cjs');

// Deployed precedence for an api function in bundle mode: real Lambda env > bundle > stage file.
const deployedEnvironment = (
    bundle: Record<string, string>
): Record<string, string | undefined> => {
    const lambdaEnv = Object.fromEntries(
        Object.entries({ ...functions.provider({ options: { stage: 'dev' } }), ...functions.api() })
            // CloudFormation intrinsics (KMS ARN, Redis endpoint) resolve only at deploy time.
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
    const stageDefaults = resolveStageDefaults({ base, stages, stage: 'dev', env: lambdaEnv });
    const resolvedIntrinsics = {
        SA_SEED_KMS_KEY_ARN: 'arn:aws:kms:us-east-1:000000000000:key/test',
    };
    return mergeRuntimeSecrets({ ...stageDefaults, ...lambdaEnv, ...resolvedIntrinsics }, bundle);
};

afterEach(() => vi.unstubAllEnvs());

describe('escrow in runtime-secrets bundle mode', () => {
    it('keeps software escrow enabled with keys supplied only by the bundle', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('ESCROW_ENCLAVE_MODE', 'software');
        vi.stubEnv('SEED', '');

        const activeKeyId = stages.dev.ESCROW_ENCLAVE_ACTIVE_KEY_ID;
        const env = parseLcaApiEnvironment(
            deployedEnvironment({
                SEED: 'a'.repeat(64),
                MONGO_URI: 'mongodb://localhost:27017',
                MONGO_DB_NAME: 'test',
                POSTMARK_SERVER_TOKEN: 'postmark',
                ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON: JSON.stringify({ [activeKeyId]: 'k' }),
            })
        );

        expect(env.ESCROW_ENCLAVE_MODE).toBe('software');
        expect(env.ESCROW_ENCLAVE_ACTIVE_KEY_ID).toBe(activeKeyId);
    });
});
