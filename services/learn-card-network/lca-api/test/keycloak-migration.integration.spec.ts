import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createKeycloakAdmin } from '../scripts/keycloak-admin';
import { encryptAuthShare } from '../src/helpers/shareEncryption.helpers';
import { maskEmail } from '../src/helpers/maskEmail';
import { roundtripEnabled, signInThroughBroker, trpc } from './helpers/keycloak-broker';

const exec = promisify(execFile);
const runProvision = async (...args: string[]): Promise<string> => {
    const { stdout } = await exec(
        'bun',
        ['--conditions=development', 'scripts/provision-keycloak-users.ts', ...args],
        {
            cwd: fileURLToPath(new URL('../', import.meta.url)),
            env: { ...process.env, NODE_ENV: 'development' },
            timeout: 60_000,
        }
    );
    process.stdout.write(stdout);
    return stdout;
};

describe.runIf(roundtripEnabled)('Firebase-era UserKey migration', () => {
    let keys: typeof import('../src/models/UserKey');
    let subjects: typeof import('../src/models/AuthSubject');
    let mongo: typeof import('./helpers/live-mongo');
    let admin: Awaited<ReturnType<typeof createKeycloakAdmin>>;
    const emails: string[] = [];
    const ids: string[] = [];
    const knownShare = { encryptedData: 'known-firebase-era-auth-share', encryptedDek: '', iv: '' };

    beforeAll(async () => {
        if (!process.env.SEED) throw new Error('Set SEED to the running API encryption seed');
        keys = await import('../src/models/UserKey');
        subjects = await import('../src/models/AuthSubject');
        mongo = await import('./helpers/live-mongo');
        admin = await createKeycloakAdmin();
    });
    afterAll(async () => {
        if (!mongo) return;
        try {
            for (const email of emails) {
                for (const user of await admin.findUsers(email))
                    await admin.request(`/users/${user.id}`, { method: 'DELETE' });
                await subjects
                    .getAuthSubjectsCollection()
                    .deleteOne({ identityKey: `email:${email}` });
            }
            await keys.getUserKeysCollection().deleteMany({ _id: { $in: ids } });
        } finally {
            await mongo.client.close();
        }
    });

    const seedKey = async (
        phoneOnly = false
    ): Promise<import('../src/models/UserKey').MongoUserKeyType> => {
        const id = randomUUID();
        const email = `migration-${id}@example.com`;
        ids.push(id);
        if (!phoneOnly) emails.push(email);
        const key = keys.MongoUserKeyValidator.parse({
            _id: id,
            contactMethod: {
                type: phoneOnly ? 'phone' : 'email',
                value: phoneOnly ? `+1555${Date.now().toString().slice(-7)}` : email,
            },
            authProviders: [{ type: 'firebase', id: `firebase-uid-${id}` }],
            primaryDid: `did:example:firebase-${id}`,
            keyProvider: 'sss',
            sssActivationState: 'active',
            authShare: encryptAuthShare(knownShare, process.env.SEED!),
            shareVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await keys.getUserKeysCollection().insertOne(key);
        return key;
    };
    const snapshot = async (email: string): Promise<unknown> => {
        const users = await admin.findUsers(email);
        return {
            keys: await keys
                .getUserKeysCollection()
                .find({ 'contactMethod.value': email })
                .toArray(),
            subjects: await subjects
                .getAuthSubjectsCollection()
                .find({ identityKey: `email:${email}` })
                .toArray(),
            users,
            links: await Promise.all(users.map(user => admin.links(user.id))),
        };
    };

    it('returns null without mapping, then the exact original share and DID after provisioning', async () => {
        const seeded = await seedKey();
        const email = seeded.contactMethod.value;
        const before = await snapshot(email);
        expect(await runProvision('--email', email)).toContain('DRY RUN');
        expect(await snapshot(email)).toEqual(before); // Includes absent subject/user: no accidental upserts.

        const { verifyKeycloakToken } = await import('../src/helpers/auth.helpers');
        const negative = await signInThroughBroker(email);
        const unlinked = await verifyKeycloakToken(negative.idToken);
        expect(unlinked).toMatchObject({ email, providerType: 'keycloak' });
        expect(await keys.findUserKeyByAuthProvider('keycloak', unlinked.id)).toBeNull();
        expect(
            await trpc('keys.getAuthShare', {
                authToken: negative.idToken,
                providerType: 'keycloak',
            })
        ).toBeNull();

        const beforeExisting = await snapshot(email);
        await runProvision('--email', email);
        expect(await snapshot(email)).toEqual(beforeExisting);
        await runProvision('--apply', '--email', email);

        const positive = await signInThroughBroker(email);
        const linked = await verifyKeycloakToken(positive.idToken);
        expect(linked.id).toBe(unlinked.id);
        const restored = await keys.findUserKeyByAuthProvider('keycloak', linked.id);
        expect(restored).toMatchObject({
            _id: seeded._id,
            authShare: seeded.authShare,
            primaryDid: seeded.primaryDid,
            shareVersion: 1,
        });
        expect(restored!.authProviders).toEqual([
            ...seeded.authProviders,
            { type: 'keycloak', id: linked.id },
        ]);
        expect(
            await keys.getUserKeysCollection().countDocuments({ 'contactMethod.value': email })
        ).toBe(1);
        expect(
            await trpc('keys.getAuthShare', {
                authToken: positive.idToken,
                providerType: 'keycloak',
            })
        ).toMatchObject({
            authShare: knownShare,
            primaryDid: seeded.primaryDid,
            shareVersion: 1,
            keyProvider: 'sss',
            sssActivationState: 'active',
        });
        const subject = await subjects
            .getAuthSubjectsCollection()
            .findOne({ identityKey: `email:${email}` });
        expect(await admin.links(linked.id)).toContainEqual(
            expect.objectContaining({
                identityProvider: 'lca-api',
                userId: subject!.subject,
            })
        );
        expect(positive.trace.every(hop => /^3\d\d /.test(hop))).toBe(true);
        const after = await snapshot(email);
        expect(await runProvision('--apply', '--email', email)).toContain('unchanged');
        expect(await snapshot(email)).toEqual(after);
        process.stdout.write(
            `Migration proof ${maskEmail(email)}: negative HTTP=null; positive _id=${seeded._id}, primaryDid=${seeded.primaryDid}, shareVersion=1, encrypted share unchanged, returned share=known fixture, email record count=1; dry-run snapshots identical (absent and existing identities); second apply identical.\n`
        );
    }, 120_000);

    it('pre-provisions a missing user and federated link before its first silent login', async () => {
        const seeded = await seedKey();
        const email = seeded.contactMethod.value;
        expect(await admin.findUsers(email)).toHaveLength(0);
        await runProvision('--apply', '--email', email);
        const { idToken } = await signInThroughBroker(email);
        expect(
            await trpc('keys.getAuthShare', { authToken: idToken, providerType: 'keycloak' })
        ).toMatchObject({ authShare: knownShare, primaryDid: seeded.primaryDid });
    }, 60_000);

    it('refuses a different lca-api link without changing either database resource', async () => {
        const seeded = await seedKey();
        const email = seeded.contactMethod.value;
        await subjects.getOrCreateAuthSubject(`email:${email}`, { email, emailVerified: true });
        await admin.request('/users', {
            method: 'POST',
            body: JSON.stringify({ username: email, email, emailVerified: true, enabled: true }),
        });
        const [user] = await admin.findUsers(email);
        await admin.request(`/users/${user!.id}/federated-identity/lca-api`, {
            method: 'POST',
            body: JSON.stringify({
                identityProvider: 'lca-api',
                userId: randomUUID(),
                userName: 'different-subject',
            }),
        });
        const before = await snapshot(email);
        await expect(runProvision('--apply', '--email', email)).rejects.toMatchObject({
            code: 1,
            stdout: expect.stringContaining('REFUSED: existing lca-api link differs'),
        });
        expect(await snapshot(email)).toEqual(before);
    }, 60_000);

    it('counts and skips phone-only records without writing', async () => {
        const seeded = await seedKey(true);
        const phoneCount = await keys
            .getUserKeysCollection()
            .countDocuments({ 'authProviders.type': 'firebase', 'contactMethod.type': 'phone' });
        const output = await runProvision().catch((error: unknown): string => {
            // A full dry-run can also report unrelated, deliberately conflicting fixtures.
            const failure = z
                .object({ code: z.literal(1), stdout: z.string().includes('Summary:') })
                .parse(error);
            return failure.stdout;
        });
        const serialized = output.match(/^Summary: (.+)$/m)?.[1];
        const summary = z.object({ skipped: z.number() }).parse(JSON.parse(serialized!));
        expect(summary.skipped).toBe(phoneCount);
        expect(phoneCount).toBeGreaterThanOrEqual(1);
        expect(await keys.getUserKeysCollection().findOne({ _id: seeded._id })).toEqual(seeded);
        process.stdout.write(
            `Phone-only skip count=${summary.skipped} (includes one synthetic fixture); no writes.\n`
        );
    }, 60_000);
});
