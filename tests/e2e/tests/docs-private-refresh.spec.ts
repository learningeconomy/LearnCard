/** Runs the "Send a Private, Refreshable Credential" how-to's verbatim snippet, changing only the network to localhost. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getLearnCardForUser, USERS } from './helpers/learncard.helpers';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/refresh');
const RUN_DIR = mkdtempSync(join(resolve(__dirname, '..'), '.docs-private-refresh-'));
const SNIPPET_NAME = 'send-private-refreshable.mjs';

const run = (name: string, env: Record<string, string>): string =>
    execFileSync(process.execPath, [join(RUN_DIR, name)], {
        cwd: RUN_DIR,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        timeout: 90_000,
    }).trim();

describe('Docs: Send a Private, Refreshable Credential', () => {
    beforeAll(async () => {
        const source = readFileSync(join(SNIPPETS, SNIPPET_NAME), 'utf8');

        expect(source).toContain('network: true');
        expect(source).toContain("encryption: 'holder'");

        const localized = source.replaceAll(
            'network: true',
            "network: 'http://localhost:4000/trpc'"
        );

        writeFileSync(join(RUN_DIR, SNIPPET_NAME), localized);
        // The recipient profile must exist before the issuer can allocate a refresh for it.
        await getLearnCardForUser('b');
    });

    afterAll(() => rmSync(RUN_DIR, { recursive: true, force: true }));

    test('sends a holder-mode refreshable credential and prints a plaintext-free receipt', async () => {
        const issuerEnv = {
            SECURE_SEED: randomBytes(32).toString('hex'),
            PROFILE_ID: `private-refresh-docs-${randomBytes(4).toString('hex')}`,
            RECIPIENT_PROFILE_ID: USERS.b.profileId,
        };

        const record = JSON.parse(run(SNIPPET_NAME, issuerEnv));

        expect(record.refreshId).toBeTruthy();
        expect(record.credentialId).toMatch(/^urn:uuid:/);
        expect(record.refreshService.type).toBe('LearnCardCredentialRefresh2026');
        expect(record.credentialUri).toMatch(/^lc:network:/);
        expect(record.issuerDid).toMatch(/^did:/);
        expect(record.holderDid).toMatch(/^did:/);
        expect(record.activityId).toBeTruthy();
        // Status allocation is automatic, and bound identically to network mode (A1).
        expect(record.credentialStatus).toBeDefined();
    }, 180_000);
});
