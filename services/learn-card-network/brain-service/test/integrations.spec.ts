import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getClient, getUser } from './helpers/getClient';

import { Integration, Profile, SigningAuthority } from '@models';

import { createIntegration } from '@accesslayer/integration/create';
import {
    readIntegrationById,
    readIntegrationByName,
    getIntegrationsForProfile,
    countIntegrationsForProfile,
} from '@accesslayer/integration/read';
import { updateIntegration as updateIntegrationAccess } from '@accesslayer/integration/update';
import { deleteIntegration as deleteIntegrationAccess } from '@accesslayer/integration/delete';
import {
    associateIntegrationWithProfile,
    associateIntegrationWithSigningAuthority,
} from '@accesslayer/integration/relationships/create';
import {
    deleteIntegrationProfileRelationship,
    deleteIntegrationSigningAuthorityRelationship,
} from '@accesslayer/integration/relationships/delete';
import {
    isIntegrationAssociatedWithProfile,
    isIntegrationUsingSigningAuthority,
} from '@accesslayer/integration/relationships/read';
import { upsertSigningAuthority } from '@accesslayer/signing-authority/create';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

const validDomains = ['example.com', 'https://example.com:8080', 'localhost', '127.0.0.1:3000'];

const makeIntegrationInput = (name: string, desc?: string) => ({
    name,
    description: desc,
    whitelistedDomains: validDomains,
});

const seedProfile = async (user: Awaited<ReturnType<typeof getUser>>, profileId: string) => {
    await user.clients.fullAuth.profile.createProfile({ profileId });
};

const seedIntegrationViaRouter = async (
    user: Awaited<ReturnType<typeof getUser>>,
    name = 'Test Integration'
) => {
    const id = await user.clients.fullAuth.integrations.addIntegration(
        makeIntegrationInput(name, 'A test integration')
    );

    return id;
};

describe('Integrations - Access Layer', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });

        await seedProfile(userA, 'usera');
        await seedProfile(userB, 'userb');
    });

    afterAll(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
    });

    it('create/read by id/name, update fields and rotate key, delete', async () => {
        const created = await createIntegration(makeIntegrationInput('Alpha', 'First'));

        expect(created.id).toBeTruthy();
        expect(created.name).toBe('Alpha');
        expect(created.description).toBe('First');
        expect(created.publishableKey).toBeTruthy();
        expect(created.whitelistedDomains).toEqual(validDomains);

        await associateIntegrationWithProfile(created.id, 'usera');

        const byId = await readIntegrationById(created.id);
        expect(byId?.name).toBe('Alpha');

        const byName = await readIntegrationByName('Alpha');
        expect(byName?.id).toBe(created.id);

        const oldKey = byId?.publishableKey;
        await updateIntegrationAccess(byId!, { description: 'Updated', rotatePublishableKey: true });

        const afterUpdate = await readIntegrationById(created.id);
        expect(afterUpdate?.description).toBe('Updated');
        expect(afterUpdate?.publishableKey && afterUpdate.publishableKey).not.toBe(oldKey);

        await deleteIntegrationAccess(created.id);
        const afterDelete = await readIntegrationById(created.id);
        expect(afterDelete).toBeNull();
    });

    it('getIntegrationsForProfile and countIntegrationsForProfile respect ownership and query', async () => {
        const a1 = await createIntegration(makeIntegrationInput('Alpha'));
        const a2 = await createIntegration(makeIntegrationInput('AlphaBeta'));
        const b1 = await createIntegration(makeIntegrationInput('Gamma'));

        await associateIntegrationWithProfile(a1.id, 'usera');
        await associateIntegrationWithProfile(a2.id, 'usera');
        await associateIntegrationWithProfile(b1.id, 'userb');

        const allA = await getIntegrationsForProfile({ profileId: 'usera' }, {
            limit: 10,
        });
        expect(allA.length).toBe(2);

        const allB = await getIntegrationsForProfile({ profileId: 'userb' }, {
            limit: 10,
        });
        expect(allB.length).toBe(1);

        const countAAll = await countIntegrationsForProfile({ profileId: 'usera' }, {});
        expect(countAAll).toBe(2);

        const countAAlpha = await countIntegrationsForProfile({ profileId: 'usera' }, {
            query: { name: { $regex: '/^Alpha/' } as any },
        });
        expect(countAAlpha).toBe(2);

        const filteredA = await getIntegrationsForProfile({ profileId: 'usera' }, {
            limit: 10,
            query: { name: { $regex: '/^Alpha/' } as any },
        });
        expect(filteredA.length).toBe(2);

        const filteredB = await getIntegrationsForProfile({ profileId: 'usera' }, {
            limit: 10,
            query: { name: { $in: ['Alpha'] } as any },
        });
        expect(filteredB.length).toBe(1);
        expect(filteredB[0]?.name).toBe('Alpha');
    });

    it('relationship helpers work for Profile and SigningAuthority', async () => {
        const integ = await createIntegration(makeIntegrationInput('RelTest'));

        // Profile relationship
        expect(await isIntegrationAssociatedWithProfile(integ.id, 'usera')).toBe(false);

        await associateIntegrationWithProfile(integ.id, 'usera');
        expect(await isIntegrationAssociatedWithProfile(integ.id, 'usera')).toBe(true);

        const deletedRel = await deleteIntegrationProfileRelationship(integ.id, 'usera');
        expect(deletedRel).toBe(true);
        expect(await isIntegrationAssociatedWithProfile(integ.id, 'usera')).toBe(false);

        // Signing Authority relationship
        const saEndpoint = 'https://signing.example.com';
        await upsertSigningAuthority(saEndpoint);

        expect(await isIntegrationUsingSigningAuthority(integ.id, saEndpoint)).toBe(false);

        await associateIntegrationWithSigningAuthority(integ.id, saEndpoint, {
            name: 'Primary',
            did: 'did:test:123',
            isPrimary: true,
        });

        expect(await isIntegrationUsingSigningAuthority(integ.id, saEndpoint)).toBe(true);
        expect(await isIntegrationUsingSigningAuthority(integ.id, saEndpoint, 'Primary')).toBe(true);

        const delSa = await deleteIntegrationSigningAuthorityRelationship(integ.id, saEndpoint, 'Primary');
        expect(delSa).toBe(true);
        expect(await isIntegrationUsingSigningAuthority(integ.id, saEndpoint)).toBe(false);
    });
});

describe('Integrations - Router', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64), 'integrations:write');
    });

    beforeEach(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });

        await seedProfile(userA, 'usera');
        await seedProfile(userB, 'userb');
        // userC intentionally has no profile for NOT_FOUND checks
    });

    afterAll(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
    });

    describe('addIntegration', () => {
        it('requires integrations:write scope and an existing profile', async () => {
            await expect(
                noAuthClient.integrations.addIntegration(makeIntegrationInput('NoAuth'))
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userA.clients.partialAuth.integrations.addIntegration(makeIntegrationInput('Partial'))
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userC.clients.fullAuth.integrations.addIntegration(makeIntegrationInput('NoProfile'))
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('validates input (invalid whitelistedDomains -> BAD_REQUEST)', async () => {
            await expect(
                userA.clients.fullAuth.integrations.addIntegration({
                    name: 'BadDomains',
                    // invalid scheme 'ftp'
                    whitelistedDomains: ['ftp://example.com'] as unknown as string[],
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('creates an integration and returns its id', async () => {
            const id = await seedIntegrationViaRouter(userA, 'RouterCreate');
            expect(typeof id).toBe('string');

            const fetched = await userA.clients.fullAuth.integrations.getIntegration({ id });
            expect(fetched?.name).toBe('RouterCreate');
            expect(Array.isArray(fetched?.whitelistedDomains)).toBe(true);
        });
    });

    describe('getIntegration', () => {
        it('requires integrations:read and enforces ownership', async () => {
            const id = await seedIntegrationViaRouter(userA, 'Owned');

            await expect(
                userB.clients.fullAuth.integrations.getIntegration({ id })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const ok = await userA.clients.fullAuth.integrations.getIntegration({ id });
            expect(ok?.id).toBe(id);
        });
    });

    describe('getIntegrations', () => {
        it('paginates with cursor and supports query filtering', async () => {
            const ids: string[] = [];
            for (const name of ['Alpha', 'AlphaBeta', 'Gamma']) {
                ids.push(await seedIntegrationViaRouter(userA, name));
            }

            const page1 = await userA.clients.fullAuth.integrations.getIntegrations({ limit: 2 });
            expect(page1.records.length).toBe(2);
            expect(page1.hasMore).toBe(true);
            expect(typeof page1.cursor === 'string').toBe(true);

            const page2 = await userA.clients.fullAuth.integrations.getIntegrations({
                limit: 2,
                cursor: page1.cursor!,
            });
            expect(page2.records.length).toBe(1);
            expect(page2.hasMore).toBe(false);

            const allIds = [...page1.records, ...page2.records].map(r => r.id).sort();
            expect(allIds.sort()).toEqual(ids.sort());

            const filtered = await userA.clients.fullAuth.integrations.getIntegrations({
                query: { name: { $regex: '/^Alpha/' } as any },
            });
            expect(filtered.records.every(r => r.name.startsWith('Alpha'))).toBe(true);
        });
    });

    describe('countIntegrations', () => {
        it('counts records matching query', async () => {
            for (const name of ['Alpha', 'AlphaBeta', 'Gamma']) {
                await seedIntegrationViaRouter(userA, name);
            }

            const countAll = await userA.clients.fullAuth.integrations.countIntegrations();
            expect(countAll).toBe(3);

            const countAlpha = await userA.clients.fullAuth.integrations.countIntegrations({
                query: { name: { $regex: '/^Alpha/' } as any },
            });
            expect(countAlpha).toBe(2);
        });
    });

    describe('updateIntegration', () => {
        it('requires integrations:write and ownership; validates inputs', async () => {
            const id = await seedIntegrationViaRouter(userA, 'Updatable');

            await expect(
                userB.clients.fullAuth.integrations.updateIntegration({
                    id,
                    updates: { name: 'Nope' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userA.clients.fullAuth.integrations.updateIntegration({
                    id,
                    updates: {
                        whitelistedDomains: ['htp://bad-origin'] as unknown as string[],
                    },
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const before = await userA.clients.fullAuth.integrations.getIntegration({ id });

            const ok = await userA.clients.fullAuth.integrations.updateIntegration({
                id,
                updates: { description: 'Updated', rotatePublishableKey: true },
            });
            expect(ok).toBe(true);

            const after = await userA.clients.fullAuth.integrations.getIntegration({ id });
            expect(after?.description).toBe('Updated');
            expect(after?.publishableKey && after.publishableKey).not.toBe(before?.publishableKey);
        });
    });

    describe('deleteIntegration', () => {
        it('requires integrations:delete and ownership', async () => {
            const id = await seedIntegrationViaRouter(userA, 'Deletable');

            await expect(
                userB.clients.fullAuth.integrations.deleteIntegration({ id })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const ok = await userA.clients.fullAuth.integrations.deleteIntegration({ id });
            expect(ok).toBe(true);

            // Access-layer read returns null after deletion
            const after = await readIntegrationById(id);
            expect(after).toBeNull();
        });
    });
});
