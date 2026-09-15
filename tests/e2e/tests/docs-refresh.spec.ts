/** Runs the managed-refresh how-to's verbatim snippets, changing only the network to localhost. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getLearnCardForUser, USERS } from './helpers/learncard.helpers';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/refresh');
const RUN_DIR = mkdtempSync(join(resolve(__dirname, '..'), '.docs-refresh-'));
const files = ['issue-refreshable.mjs', 'publish-update.mjs', 'refresh-held.mjs'];

// The docker brain-service is plain HTTP on loopback, which the holder-side SSRF guard
// rejects by default. The published snippet calls refreshCredential(held) with no options.
const LOCAL_REFRESH_OPTIONS =
    "{ allowInsecureHttp: true, allowPrivateAddresses: true, resolveHost: async () => ['127.0.0.1'] }";

const run = (name: string, env: Record<string, string>): string =>
    execFileSync(process.execPath, [join(RUN_DIR, name)], {
        cwd: RUN_DIR,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        timeout: 90_000,
    }).trim();

describe('Docs: Issue and Refresh a Managed Credential', () => {
    beforeAll(async () => {
        for (const name of files) {
            const source = readFileSync(join(SNIPPETS, name), 'utf8');
            expect(source).toContain('network: true');
            let localized = source.replaceAll(
                'network: true',
                "network: 'http://localhost:4000/trpc'"
            );
            if (name === 'refresh-held.mjs') {
                expect(source).toContain('refreshCredential(held)');
                localized = localized.replace(
                    'refreshCredential(held)',
                    `refreshCredential(held, ${LOCAL_REFRESH_OPTIONS})`
                );
            }
            writeFileSync(join(RUN_DIR, name), localized);
        }
        // The recipient profile must exist before the issuer can allocate a refresh for it.
        await getLearnCardForUser('b');
    });

    afterAll(() => rmSync(RUN_DIR, { recursive: true, force: true }));

    test('issue, claim, publish, and refresh in place', async () => {
        const issuerEnv = {
            SECURE_SEED: randomBytes(32).toString('hex'),
            PROFILE_ID: `refresh-docs-${randomBytes(4).toString('hex')}`,
            RECIPIENT_PROFILE_ID: USERS.b.profileId,
        };
        const record = JSON.parse(run('issue-refreshable.mjs', issuerEnv));
        expect(record.refreshId).toBeTruthy();
        expect(record.credentialId).toMatch(/^urn:uuid:/);
        expect(record.refreshService.type).toBe('LearnCardCredentialRefresh2026');
        expect(record.credentialUri).toMatch(/^lc:network:/);

        const holderEnv = { HOLDER_SEED: USERS.b.seed, CREDENTIAL_URI: record.credentialUri };
        expect(run('refresh-held.mjs', holderEnv)).toBe('Up to date: Provisional Transcript');

        expect(JSON.parse(run('publish-update.mjs', issuerEnv))).toEqual({
            version: 2,
            notification: 'queued',
        });
        // Same idempotency key: no third version.
        expect(JSON.parse(run('publish-update.mjs', issuerEnv))).toEqual({
            version: 2,
            notification: 'queued',
        });

        expect(run('refresh-held.mjs', holderEnv)).toBe('Updated to version 2: Final Transcript');
    }, 180_000);
});
