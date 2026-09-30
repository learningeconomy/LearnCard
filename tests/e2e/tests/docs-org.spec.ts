/** Runs the issuer-org how-to's verbatim snippet, changing only the network to localhost. */
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { initLearnCard } from '@learncard/init';
import { getLearnCard, getLearnCardForUser, USERS } from './helpers/learncard.helpers';

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

    let apiToken = '';

    beforeAll(async () => {
        for (const name of ['send-as-managed.mjs', 'send-as-managed-token.mjs']) {
            const source = readFileSync(join(SNIPPETS, name), 'utf8');
            expect(source).toContain('network: true');
            writeFileSync(
                join(RUN_DIR, name),
                source.replaceAll('network: true', `network: '${NETWORK}'`)
            );
        }
    });

    // The shared harness clears every database after each test, so rebuild the org per test.
    beforeEach(async () => {
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

        // The token snippet sends with `template`, which needs a hosted signing
        // authority on the district. `org apply` registers one per managed profile for
        // hosted-signer specs; this fixture is built by hand, so register it here.
        const districtWithLca = await getLearnCard(seed, managedDid);
        const sa = await districtWithLca.invoke.createSigningAuthority('docs-org');
        if (!sa) throw new Error('Could not create a signing authority for the district');
        await districtWithLca.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);

        const grantId = await parent.invoke.addAuthGrant({
            name: 'org-docs-token',
            scope: 'boosts:write boosts:read profiles:read',
            actAs: `org-docs-north-${suffix}`,
        });
        apiToken = await parent.invoke.getAPITokenForAuthGrant(grantId);

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
        const incoming = await recipient.invoke.getIncomingCredentials(`org-docs-north-${suffix}`);
        expect(incoming.length).toBeGreaterThan(0);
    });

    test('an org token acts as a managed profile via invoke.actAs', async () => {
        const output = run('send-as-managed-token.mjs', {
            API_TOKEN: apiToken,
            DISTRICT_PROFILE_ID: `org-docs-north-${suffix}`,
            RECIPIENT: USERS.b.profileId,
        });
        expect(output).toContain(`Acting as North District (org-docs-north-${suffix})`);
        expect(output).toMatch(/lc:network:.*:credential:/);
    });
});
