import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const run = promisify(execFile);

test('CLI refresh demo sends once and shows a verified updated credential', async () => {
    const { stdout, stderr } = await run('bun', ['run', 'start', 'demo', 'refresh', '--json'], {
        cwd: resolve(__dirname, '../../../packages/learn-card-cli'),
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
    });

    // JSON mode has one stdout envelope; the presentation narrative goes to stderr.
    const result = JSON.parse(stdout.trim());
    expect(result).toMatchObject({
        ok: true,
        command: 'demo refresh',
        network: 'http://localhost:4000/trpc',
        before: 'Provisional Course Certificate',
        after: 'Final Course Certificate',
        version: 2,
        status: 'updated',
        sameCredentialId: true,
    });
    expect(result.credentialUri).toMatch(/^lc:network:/);
    expect(result.refreshId).toBeTruthy();
    expect(stderr).toContain('No second badge was sent.');
    expect(stderr).toContain('verifying the new credential');
    expect(`${stdout}${stderr}`).not.toContain('SECURE_SEED');
}, 150_000);
