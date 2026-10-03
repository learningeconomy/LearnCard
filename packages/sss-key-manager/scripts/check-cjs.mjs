import { execFileSync } from 'node:child_process';

// Run both branches of the published require entry in plain Node, never Bun.
// Disable require(esm) where supported so newer Node cannot hide ESM-only deps.
const flags = process.allowedNodeEnvironmentFlags.has('--no-experimental-require-module')
    ? ['--no-experimental-require-module']
    : [];

for (const nodeEnv of ['development', 'production']) {
    execFileSync(
        'node',
        [
            ...flags,
            '--input-type=commonjs',
            '-e',
            `
        const assert = require('node:assert/strict');
        const sdk = require('@learncard/sss-key-manager');
        assert.equal(typeof sdk.createSSSStrategy, 'function');
        assert.equal(typeof sdk.verifyEnclaveAttestation, 'function');
    `,
        ],
        {
            cwd: new URL('..', import.meta.url),
            env: { ...process.env, NODE_ENV: nodeEnv, NODE_OPTIONS: '' },
            stdio: 'inherit',
        }
    );
}
console.log('CommonJS entry loads in development and production.');
