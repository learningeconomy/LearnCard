import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { lcaApiEnvironmentShape } from './environment';
import { stages } from './stageConfig';

const require = createRequire(import.meta.url);
const serverlessRequire = createRequire(require.resolve('serverless/package.json'));
const yaml: { load: (source: string) => unknown } = serverlessRequire('js-yaml');

const functionEnvironment = require('../../serverless.function-env.cjs') as Record<
    'api' | 'escrow',
    () => Record<string, string>
>;

// Every schema ESCROW_* setting has exactly one source under the config model.
const SOURCES = {
    // Credentials and the endpoints bound to them: runtime bundle, GitHub fallback.
    bundle: [
        'ESCROW_RELAY_URL',
        'ESCROW_RELAY_AUTH_TOKEN',
        'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
        'ESCROW_ENCLAVE_REMOTE_URL',
        'ESCROW_ENCLAVE_REMOTE_TOKEN',
    ],
    // Operator toggles: GitHub vars forwarded in every mode.
    toggle: ['ESCROW_ENCLAVE_MODE', 'ESCROW_RELEASE_KILL_SWITCH'],
    // Non-secret tuning: checked-in config.<stage>.json (or schema default).
    stage: [
        'ESCROW_ENCLAVE_ACTIVE_KEY_ID',
        'ESCROW_HOLD_DURATION_MS',
        'ESCROW_HOLD_RESTART_MIN_AGE_MS',
        'ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS',
    ],
};
const SECRETS = new Set([
    'ESCROW_RELAY_AUTH_TOKEN',
    'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
    'ESCROW_ENCLAVE_REMOTE_TOKEN',
]);
// serverless.yml PrivateLink inputs; read at deploy time, never by the Lambda runtime.
const DEPLOY_TIME = ['ESCROW_ENCLAVE_ENDPOINT_SERVICE_NAME', 'ESCROW_ENCLAVE_HOSTNAME'];

const settings = Object.keys(lcaApiEnvironmentShape).filter(name => name.startsWith('ESCROW_'));

afterEach(() => vi.unstubAllEnvs());

describe('escrow deployment wiring', () => {
    it('classifies every schema ESCROW_* setting exactly once', () => {
        const classified = Object.values(SOURCES).flat();
        expect([...classified].sort()).toEqual([...settings].sort());
        expect(new Set(classified).size).toBe(classified.length);
    });

    it('passes only bundle fallbacks, toggles and deploy-time inputs through GitHub', () => {
        const workflow = yaml.load(
            readFileSync(
                new URL('../../../../../.github/workflows/deploy.yml', import.meta.url),
                'utf8'
            )
        ) as {
            jobs: Record<string, { steps: { name: string; env?: Record<string, string> }[] }>;
        };
        const env = workflow.jobs['deploy-lca-api']!.steps.find(
            step => step.name === 'Deploy LCA API Service Lambda'
        )!.env!;

        for (const name of [...SOURCES.bundle, ...SOURCES.toggle, ...DEPLOY_TIME]) {
            expect(env[name], name).toBe(
                `\${{ ${SECRETS.has(name) ? 'secrets' : 'vars'}.${name} }}`
            );
        }
        for (const name of SOURCES.stage) expect(env[name], name).toBeUndefined();
    });

    it('runs the scheduled escrow jobs with the API environment (bundle + toggles)', () => {
        const serverless = yaml.load(
            readFileSync(new URL('../../serverless.yml', import.meta.url), 'utf8')
        ) as { functions: Record<string, { environment?: string; role?: string }> };
        for (const name of ['escrowHoldReminders', 'escrowBlobRewrap']) {
            expect(serverless.functions[name]?.environment, name).toBe(
                '${file(./serverless.function-env.cjs):escrow}'
            );
        }
        expect(functionEnvironment.escrow).toBe(functionEnvironment.api);
    });

    it('keeps escrow toggles and drops credential fallbacks in bundle mode', () => {
        for (const name of [...SOURCES.bundle, ...SOURCES.toggle]) vi.stubEnv(name, name);
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        expect(functionEnvironment.escrow()).toEqual({
            RUNTIME_SECRETS_ID: 'lca-api/dev/runtime-secrets',
            ESCROW_ENCLAVE_MODE: 'ESCROW_ENCLAVE_MODE',
            ESCROW_RELEASE_KILL_SWITCH: 'ESCROW_RELEASE_KILL_SWITCH',
        });

        vi.stubEnv('RUNTIME_SECRETS_ID', '');
        expect(Object.keys(functionEnvironment.escrow()).sort()).toEqual(
            [...SOURCES.bundle, ...SOURCES.toggle].sort()
        );
    });

    it('never checks in escrow credentials', () => {
        for (const [stage, config] of Object.entries(stages)) {
            for (const name of [...SOURCES.bundle, ...SOURCES.toggle]) {
                expect(
                    (config as Record<string, string>)[name],
                    `${stage}/${name}`
                ).toBeUndefined();
            }
        }
    });
});
