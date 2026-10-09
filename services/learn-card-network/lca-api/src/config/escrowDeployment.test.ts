import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { lcaApiEnvironmentShape } from './environment';

const require = createRequire(import.meta.url);
const serverlessRequire = createRequire(require.resolve('serverless/package.json'));
const yaml: { load: (source: string) => unknown } = serverlessRequire('js-yaml');

const functionEnvironment = require('../../serverless.function-env.cjs') as Record<
    'api' | 'escrow',
    () => Record<string, string>
>;

const ESCROW_FUNCTIONS = {
    trpc: 'api',
    api: 'api',
    escrowHoldReminders: 'escrow',
    escrowBlobRewrap: 'escrow',
} as const;

describe('escrow deployment wiring', () => {
    const settings = Object.keys(lcaApiEnvironmentShape).filter(name => name.startsWith('ESCROW_'));

    it('forwards every schema ESCROW_* setting through GitHub and Serverless', () => {
        const serverless = yaml.load(
            readFileSync(new URL('../../serverless.yml', import.meta.url), 'utf8')
        ) as {
            provider: { environment: Record<string, string> };
            functions: Record<string, { environment?: string }>;
        };
        const workflow = yaml.load(
            readFileSync(
                new URL('../../../../../.github/workflows/deploy.yml', import.meta.url),
                'utf8'
            )
        ) as {
            jobs: Record<string, { steps: { name: string; env?: Record<string, string> }[] }>;
        };
        const deploy = workflow.jobs['deploy-lca-api']!.steps.find(
            step => step.name === 'Deploy LCA API Service Lambda'
        )!;
        const secrets = new Set([
            'ESCROW_RELAY_AUTH_TOKEN',
            'ESCROW_ENCLAVE_REMOTE_TOKEN',
            'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
        ]);

        for (const [name, scope] of Object.entries(ESCROW_FUNCTIONS)) {
            expect(serverless.functions[name]?.environment, name).toBe(
                `\${file(./serverless.function-env.cjs):${scope}}`
            );
        }
        for (const name of settings) {
            expect(serverless.provider.environment[name], name).toBeUndefined();
            expect(deploy.env?.[name], name).toBe(
                `\${{ ${secrets.has(name) ? 'secrets' : 'vars'}.${name} }}`
            );
        }
        expect(serverless.provider.environment.LAMBDA_STAGE).toBe('${opt:stage, "dev"}');
    });

    it('emits every set ESCROW_* setting, and only relay settings while escrow is off', () => {
        const saved = { ...process.env };
        try {
            for (const name of settings) process.env[name] = `value-of-${name}`;
            expect(Object.keys(functionEnvironment.escrow()).sort()).toEqual([...settings].sort());

            delete process.env.ESCROW_ENCLAVE_MODE;
            expect(Object.keys(functionEnvironment.escrow()).sort()).toEqual([
                'ESCROW_RELAY_AUTH_TOKEN',
                'ESCROW_RELAY_URL',
            ]);
        } finally {
            process.env = saved;
        }
    });
});
