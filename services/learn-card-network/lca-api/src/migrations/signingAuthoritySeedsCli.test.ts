import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(
    new URL('../../scripts/migrate-signing-authority-seeds.mjs', import.meta.url)
);
let directory: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'sa-cli-test-'));
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

const invoke = () =>
    spawnSync(
        process.execPath,
        [script, '--function-name', 'test-migration', '--region', 'us-east-1'],
        {
            encoding: 'utf8',
            env: {
                NODE_ENV: 'test',
                PATH: `${directory}:${process.env.PATH}`,
                SA_CLI_TEST_DIRECTORY: directory,
            },
        }
    );
const mockAws = (body: string): void => {
    writeFileSync(join(directory, 'aws'), `#!/usr/bin/env node\n${body}`, { mode: 0o700 });
};

describe('seed migration operator CLI', () => {
    it.each(['ExpiredTokenException', 'TooManyRequestsException', 'Read timeout on endpoint URL'])(
        'shows AWS CLI stderr for %s without dumping stdout or the exec error',
        diagnostic => {
            mockAws(
                `process.stdout.write('do-not-log-stdout'); process.stderr.write(${JSON.stringify(diagnostic)}); process.exit(1);`
            );
            const result = invoke();
            expect(result.status).toBe(1);
            expect(result.stderr).toContain(diagnostic);
            expect(result.stderr).toContain('rerun to resume');
            expect(result.stderr).not.toContain('do-not-log-stdout');
            expect(result.stdout).toBe('');
        }
    );

    it('continues a requested rescan even when the boundary batch processed zero records', () => {
        mockAws(`
            const fs = require('node:fs');
            const marker = process.env.SA_CLI_TEST_DIRECTORY + '/invoked';
            const done = fs.existsSync(marker);
            fs.writeFileSync(marker, '1');
            fs.writeFileSync(process.argv.at(-1), JSON.stringify({ done, processed: done ? 1 : 0, rescanRequired: !done }));
            process.stdout.write(JSON.stringify({ StatusCode: 200 }));
        `);
        const result = invoke();
        expect(result.status).toBe(0);
        expect(result.stderr).toBe('');
        const batches = result.stdout
            .trim()
            .split('\n')
            .map(line => JSON.parse(line));
        expect(batches).toHaveLength(2);
        expect(batches[1].done).toBe(true);
    });
});
