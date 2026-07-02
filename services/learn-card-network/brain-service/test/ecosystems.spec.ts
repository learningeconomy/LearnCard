import { beforeEach, describe, expect, it } from 'vitest';

import { getClient } from './helpers/getClient';
import { Ecosystem, Group } from '@models';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import {
    getEcosystemById,
    getChildEcosystems,
    getRootEcosystemsForTenant,
} from '@accesslayer/ecosystem/read';

const client = getClient({ did: 'did:key:z6MkEcosystemTester', isChallengeValid: true });
const noAuthClient = getClient();

const baseInput = {
    name: 'LEF Root',
    slug: 'lef',
    description: undefined,
    parentEcosystemId: null,
    ownerProfileId: 'owner-1',
    settings: {},
    status: 'ACTIVE' as const,
};

describe('Ecosystems', () => {
    beforeEach(async () => {
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
    });

    describe('createEcosystem (access layer)', () => {
        it('creates a root ecosystem with self-referential cached hierarchy fields', async () => {
            const created = await createEcosystem(baseInput);
            const flat = created.dataValues;

            expect(flat.id).toMatch(/^eco_/);
            expect(flat.parentEcosystemId).toBeUndefined();
            expect(flat.pathIds).toEqual([flat.id]);
            expect(flat.slugPath).toEqual(['lef']);
            expect(flat.depth).toBe(0);
            expect(flat.rootEcosystemId).toBe(flat.id);
        });

        it('serializes settings as a JSON string on the node', async () => {
            const created = await createEcosystem({
                ...baseInput,
                settings: { catalogPolicy: { requireEndorsement: true } },
            });

            expect(typeof created.dataValues.settings).toBe('string');
            expect(JSON.parse(created.dataValues.settings)).toEqual({
                catalogPolicy: { requireEndorsement: true },
            });
        });

        it('derives child hierarchy fields from the parent and links a CHILD_OF edge', async () => {
            const root = await createEcosystem(baseInput);
            const child = await createEcosystem({
                ...baseInput,
                name: 'Education',
                slug: 'edu',
                parentEcosystemId: root.id,
            });
            const flat = child.dataValues;

            expect(flat.parentEcosystemId).toBe(root.id);
            expect(flat.pathIds).toEqual([root.id, child.id]);
            expect(flat.slugPath).toEqual(['lef', 'edu']);
            expect(flat.depth).toBe(1);
            expect(flat.rootEcosystemId).toBe(root.id);

            const parents = await child.findRelationships({ alias: 'childOf' });
            expect(parents).toHaveLength(1);
            expect(parents[0]!.target.id).toBe(root.id);
        });

        it('enforces per-parent slug uniqueness but allows the same slug under different parents', async () => {
            const root = await createEcosystem(baseInput);
            const edu = await createEcosystem({
                ...baseInput,
                name: 'Education',
                slug: 'edu',
                parentEcosystemId: root.id,
            });
            const wf = await createEcosystem({
                ...baseInput,
                name: 'Workforce',
                slug: 'wf',
                parentEcosystemId: root.id,
            });

            await createEcosystem({
                ...baseInput,
                name: 'K12 under Edu',
                slug: 'k12',
                parentEcosystemId: edu.id,
            });

            await expect(
                createEcosystem({
                    ...baseInput,
                    name: 'K12 under Workforce',
                    slug: 'k12',
                    parentEcosystemId: wf.id,
                })
            ).resolves.toBeDefined();

            await expect(
                createEcosystem({
                    ...baseInput,
                    name: 'Duplicate K12 under Edu',
                    slug: 'k12',
                    parentEcosystemId: edu.id,
                })
            ).rejects.toBeDefined();
        });
    });

    describe('read access layer', () => {
        it('inflates settings back into an object on read', async () => {
            const created = await createEcosystem({
                ...baseInput,
                settings: { learnCloudPolicy: { mode: 'DEDICATED', instanceIds: ['lc-1'] } },
            });

            const read = await getEcosystemById(created.id);

            expect(read).not.toBeNull();
            expect(read!.settings).toEqual({
                learnCloudPolicy: { mode: 'DEDICATED', instanceIds: ['lc-1'] },
            });
            expect(read!.parentEcosystemId).toBeNull();
        });

        it('returns null for an unknown ecosystem id', async () => {
            expect(await getEcosystemById('eco_does_not_exist')).toBeNull();
        });

        it('lists direct children and the full tenant root tree', async () => {
            const root = await createEcosystem(baseInput);
            const edu = await createEcosystem({
                ...baseInput,
                slug: 'edu',
                parentEcosystemId: root.id,
            });
            await createEcosystem({ ...baseInput, slug: 'wf', parentEcosystemId: root.id });
            await createEcosystem({ ...baseInput, slug: 'k12', parentEcosystemId: edu.id });

            const children = await getChildEcosystems(root.id);
            expect(children.map(c => c.slug).sort()).toEqual(['edu', 'wf']);

            const tree = await getRootEcosystemsForTenant(root.id);
            expect(tree).toHaveLength(4);
        });
    });

    describe('read-only tRPC routes', () => {
        it('rejects unauthenticated callers', async () => {
            const created = await createEcosystem(baseInput);

            await expect(noAuthClient.ecosystem.getEcosystem({ id: created.id })).rejects.toThrow();
        });

        it('getEcosystem returns the ecosystem by id', async () => {
            const created = await createEcosystem(baseInput);

            const result = await client.ecosystem.getEcosystem({ id: created.id });

            expect(result?.id).toBe(created.id);
            expect(result?.slug).toBe('lef');
        });

        it('getEcosystem throws NOT_FOUND for an unknown id', async () => {
            await expect(client.ecosystem.getEcosystem({ id: 'eco_missing' })).rejects.toThrow();
        });

        it('getChildEcosystems returns direct children', async () => {
            const root = await createEcosystem(baseInput);
            await createEcosystem({ ...baseInput, slug: 'edu', parentEcosystemId: root.id });

            const result = await client.ecosystem.getChildEcosystems({ id: root.id });

            expect(result.map(c => c.slug)).toEqual(['edu']);
        });
    });
});
