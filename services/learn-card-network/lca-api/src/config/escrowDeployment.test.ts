import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { lcaApiEnvironmentShape } from './environment';

const require = createRequire(import.meta.url);
const serverlessRequire = createRequire(require.resolve('serverless/package.json'));
const yaml: { load: (source: string) => unknown } = serverlessRequire('js-yaml');

describe('escrow deployment wiring', () => {
    it('forwards every schema ESCROW_* setting through GitHub and Serverless', () => {
        const serverless = yaml.load(
            readFileSync(new URL('../../serverless.yml', import.meta.url), 'utf8')
        ) as {
            provider: { environment: Record<string, string> };
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
        for (const name of Object.keys(lcaApiEnvironmentShape).filter(name =>
            name.startsWith('ESCROW_')
        )) {
            expect(serverless.provider.environment[name], name).toBe(`\${env:${name}, ''}`);
            expect(deploy.env?.[name], name).toBe(
                `\${{ ${secrets.has(name) ? 'secrets' : 'vars'}.${name} }}`
            );
        }
        expect(serverless.provider.environment.LAMBDA_STAGE).toBe('${opt:stage, "dev"}');
    });
});
