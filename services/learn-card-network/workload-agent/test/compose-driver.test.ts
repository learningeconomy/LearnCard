import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, it } from 'vitest';
import { ComposeDriver } from '../src/compose-driver';
import { privateDirectory } from '../src/secrets';
import { Redactor } from '../src/redact';
import { parseSpec, projectName } from '../src/render';
import { AgentError } from '../src/redact';
import { config, operation } from './fixtures';

it('retirement uses argv down, never -v, and retains state files', async (): Promise<void> => {
    const root = await mkdtemp(join(tmpdir(), 'lcnwl-driver-'));
    const op = operation();
    const calls: string[][] = [];
    try {
        const dir = join(root, projectName(op.deploymentId));
        await privateDirectory(dir);
        await writeFile(join(dir, 'compose.yaml'), 'services: {}', { mode: 0o600 });
        const driver = new ComposeDriver(
            config(root),
            new Redactor(),
            async (argv): Promise<string> => {
                calls.push(argv);
                return '';
            }
        );
        await driver.retire(op, (): number => 20000);
        expect(calls[0]).toEqual([
            'compose',
            '-p',
            projectName(op.deploymentId),
            '-f',
            join(dir, 'compose.yaml'),
            'down',
            '--timeout',
            '5',
        ]);
        expect(calls.flat()).not.toContain('-v');
        expect(calls.flat()).not.toContain('--volumes');
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
it('keeps a durable interlock after ambiguous Docker failure and blocks takeover', async (): Promise<void> => {
    const root = await mkdtemp(join(tmpdir(), 'lcnwl-fence-'));
    const op = operation();
    const calls: string[][] = [];
    try {
        await privateDirectory(join(root, projectName(op.deploymentId)));
        const driver = new ComposeDriver(
            config(root),
            new Redactor(),
            async (argv): Promise<string> => {
                calls.push(argv);
                throw new AgentError('LEASE_BUDGET_EXCEEDED');
            }
        );
        await expect(
            driver.apply(
                { operation: op, spec: parseSpec(op.approvedSpec, config(root)), ports: {} },
                (): number => 1000
            )
        ).rejects.toThrow('LEASE_BUDGET_EXCEEDED');
        await expect(driver.prepare(op, (): number => 20000)).rejects.toThrow(
            'MUTATION_RECONCILIATION_REQUIRED'
        );
        await expect(driver.retire(op, (): number => 20000)).rejects.toThrow(
            'MUTATION_RECONCILIATION_REQUIRED'
        );
        expect(calls).toHaveLength(1);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
