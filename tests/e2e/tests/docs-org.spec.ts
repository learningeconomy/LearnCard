/** Runs the issuer-org how-to's verbatim snippet, changing only the network to localhost. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { initLearnCard } from '@learncard/init';
import { getLearnCardForUser, USERS } from './helpers/learncard.helpers';

const NETWORK = 'http://localhost:4000/trpc';
const SNIPPETS = resolve(__dirname, '../../../docs/snippets/cli/org');
const RUN_DIR = mkdtempSync(join(resolve(__dirname, '..'), '.docs-org-'));

const run = (name: string, env: Record<string, string>): string =>
    execFileSync(process.execPath, [join(RUN_DIR, name)], {
        cwd: RUN_DIR,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        timeout: 90_000,
    }).trim();

describe('Docs: Bootstrap an Issuer Organization', () => {
    const seed = randomBytes(32).toString('hex');
    const suffix = randomBytes(3).toString('hex');
    let managedDid = '';

    beforeAll(async () => {
        const source = readFileSync(join(SNIPPETS, 'send-as-managed.mjs'), 'utf8');
        expect(source).toContain('network: true');
        writeFileSync(
            join(RUN_DIR, 'send-as-managed.mjs'),
            source.replaceAll('network: true', `network: '${NETWORK}'`)
        );

        // What `org apply` would have done: a parent profile, a manager, one managed profile.
        const parent = await initLearnCard({ seed, network: NETWORK });
        await parent.invoke.createProfile({
            profileId: `org-docs-${suffix}`,
            displayName: 'Org Docs Parent',
            bio: '',
            shortBio: '',
        });
        const managerDid = await parent.invoke.createProfileManager({
            displayName: 'Org Docs Districts',
            bio: '',
            shortBio: '',
        });
        const manager = await initLearnCard({ seed, network: NETWORK, didWeb: managerDid });
        managedDid = await manager.invoke.createManagedProfile({
            profileId: `org-docs-north-${suffix}`,
            displayName: 'North District',
            bio: '',
            shortBio: '',
        });

        await getLearnCardForUser('b');
    });

    afterAll(() => rmSync(RUN_DIR, { recursive: true, force: true }));

    test('the parent seed sends as a managed profile via didWeb', async () => {
        const output = run('send-as-managed.mjs', {
            SECURE_SEED: seed,
            MANAGED_DID: managedDid,
            RECIPIENT: USERS.b.profileId,
        });
        expect(output).toContain(`Sending as North District (org-docs-north-${suffix})`);
        expect(output).toMatch(/lc:network:.*:credential:/);

        const recipient = await getLearnCardForUser('b');
        const received = await recipient.invoke.getReceivedCredentials();
        const fromDistrict = received.find(record => record.from === `org-docs-north-${suffix}`);
        expect(fromDistrict).toBeTruthy();
    });
});
