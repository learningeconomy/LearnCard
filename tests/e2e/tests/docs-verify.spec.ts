/** Execute the exact programs embedded in the verification tutorial using Node. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/verify');
let runDir: string;

// Like docs-quickstart, copy into e2e to resolve its workspace @learncard/init.
// These three examples deliberately do not connect to any LearnCard Network.
const localize = (name: string): string => {
    const source = readFileSync(join(SNIPPETS, name), 'utf8');
    expect(source).not.toMatch(/network\s*:/);
    const destination = join(runDir, name);
    writeFileSync(destination, source);
    return destination;
};

const run = (name: string): { summary: string; result: unknown } => {
    const output = execFileSync(process.execPath, [localize(name)], {
        cwd: runDir,
        encoding: 'utf8',
        timeout: 90_000,
    });
    const firstNewline = output.indexOf('\n');
    return {
        summary: output.slice(0, firstNewline),
        result: JSON.parse(output.slice(firstNewline + 1)),
    };
};

describe('Docs: Verify Credentials', () => {
    beforeAll(() => {
        runDir = mkdtempSync(join(resolve(__dirname, '..'), '.docs-verify-'));
    });
    afterAll(() => rmSync(runDir, { recursive: true, force: true }));

    test('a locally signed credential passes proof and expiration checks', () => {
        expect(run('issue-and-verify.mjs')).toEqual({
            summary: 'Valid: proof, expiration',
            result: { checks: ['proof', 'expiration'], warnings: [], errors: [] },
        });
    });

    test('changing the signed achievement fails the proof check', () => {
        const error = 'signature error: Verification equation was not satisfied';
        expect(run('tampered.mjs')).toEqual({
            summary: `Invalid: ${error}`,
            result: { checks: ['expiration'], warnings: [], errors: [error] },
        });
    });

    test('past validUntil fails expiration without breaking the signature', () => {
        const error = 'expiration error: Credential is no longer valid';
        expect(run('expired.mjs')).toEqual({
            summary: `Invalid: ${error}`,
            result: { checks: ['proof'], warnings: [], errors: [error] },
        });
    });
});
