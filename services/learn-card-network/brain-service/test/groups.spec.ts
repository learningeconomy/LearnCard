import { beforeEach, describe, expect, it } from 'vitest';

import { getClient } from './helpers/getClient';
import { Ecosystem, Group } from '@models';
import { createGroup } from '@accesslayer/group/create';
import { getGroupById, getGroupsOwnedByEcosystem, getChildGroups } from '@accesslayer/group/read';

const noAuthClient = getClient();

const OWNER_ECO = 'eco_owner_ca';

const baseInput = {
    name: 'California Districts',
    slug: 'ca-districts',
    type: 'geographic' as const,
    description: undefined,
    parentGroupId: null,
    ownerEcosystemId: OWNER_ECO,
    identityProfileId: undefined,
    membershipMode: 'EXPLICIT' as const,
    computedCriteria: undefined,
    status: 'ACTIVE' as const,
};

describe('Groups', () => {
    beforeEach(async () => {
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
    });

    describe('createGroup (access layer)', () => {
        it('creates a root group with cached hierarchy fields', async () => {
            const created = await createGroup(baseInput);
            const flat = created.dataValues;

            expect(flat.id).toMatch(/^grp_/);
            expect(flat.parentGroupId).toBeUndefined();
            expect(flat.pathIds).toEqual([flat.id]);
            expect(flat.depth).toBe(0);
            expect(flat.rootGroupId).toBe(flat.id);
        });

        it('derives child hierarchy fields from the parent and links a CHILD_OF edge', async () => {
            const root = await createGroup(baseInput);
            const child = await createGroup({
                ...baseInput,
                name: 'LAUSD',
                slug: 'lausd',
                type: 'administrative',
                parentGroupId: root.id,
            });
            const flat = child.dataValues;

            expect(flat.parentGroupId).toBe(root.id);
            expect(flat.pathIds).toEqual([root.id, child.id]);
            expect(flat.depth).toBe(1);
            expect(flat.rootGroupId).toBe(root.id);

            const parents = await child.findRelationships({ alias: 'childOf' });
            expect(parents).toHaveLength(1);
            expect(parents[0]!.target.id).toBe(root.id);
        });

        it('serializes computedCriteria as JSON only when present', async () => {
            const explicit = await createGroup(baseInput);
            expect(explicit.dataValues.computedCriteria).toBeUndefined();

            const computed = await createGroup({
                ...baseInput,
                slug: 'computed-cohort',
                membershipMode: 'COMPUTED',
                computedCriteria: { field: 'grade', op: 'eq', value: 12 },
            });

            expect(typeof computed.dataValues.computedCriteria).toBe('string');
            expect(JSON.parse(computed.dataValues.computedCriteria!)).toEqual({
                field: 'grade',
                op: 'eq',
                value: 12,
            });
        });

        it('enforces per-parent slug uniqueness for groups', async () => {
            const root = await createGroup(baseInput);
            await createGroup({
                ...baseInput,
                name: 'LAUSD',
                slug: 'lausd',
                parentGroupId: root.id,
            });

            await expect(
                createGroup({
                    ...baseInput,
                    name: 'Duplicate LAUSD',
                    slug: 'lausd',
                    parentGroupId: root.id,
                })
            ).rejects.toBeDefined();
        });
    });

    describe('read access layer', () => {
        it('inflates computedCriteria and normalizes parentGroupId to null on read', async () => {
            const created = await createGroup({
                ...baseInput,
                membershipMode: 'COMPUTED',
                computedCriteria: { tag: 'title-i' },
            });

            const read = await getGroupById(created.id);

            expect(read).not.toBeNull();
            expect(read!.parentGroupId).toBeNull();
            expect(read!.computedCriteria).toEqual({ tag: 'title-i' });
        });

        it('lists groups owned by an ecosystem and direct child groups', async () => {
            const root = await createGroup(baseInput);
            await createGroup({ ...baseInput, slug: 'lausd', parentGroupId: root.id });
            await createGroup({
                ...baseInput,
                slug: 'other-owner',
                ownerEcosystemId: 'eco_other',
            });

            const owned = await getGroupsOwnedByEcosystem(OWNER_ECO);
            expect(owned.map(g => g.slug).sort()).toEqual(['ca-districts', 'lausd']);

            const children = await getChildGroups(root.id);
            expect(children.map(g => g.slug)).toEqual(['lausd']);
        });
    });

    describe('read-only tRPC routes', () => {
        it('getGroup returns the group by id', async () => {
            const created = await createGroup(baseInput);

            const result = await noAuthClient.group.getGroup({ id: created.id });

            expect(result?.id).toBe(created.id);
            expect(result?.type).toBe('geographic');
        });

        it('getGroup throws NOT_FOUND for an unknown id', async () => {
            await expect(noAuthClient.group.getGroup({ id: 'grp_missing' })).rejects.toThrow();
        });

        it('getGroupsOwnedByEcosystem returns owned groups', async () => {
            await createGroup(baseInput);

            const result = await noAuthClient.group.getGroupsOwnedByEcosystem({
                ecosystemId: OWNER_ECO,
            });

            expect(result.map(g => g.slug)).toEqual(['ca-districts']);
        });
    });
});
