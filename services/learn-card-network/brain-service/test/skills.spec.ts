import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getUser, getClient } from './helpers/getClient';
import { Profile, SkillFramework, Skill, Tag } from '@models';
import { __skillsProviderTestUtils } from '@services/skills-provider';

const noAuthClient = getClient();

let userA: Awaited<ReturnType<typeof getUser>>; // full access
let userB: Awaited<ReturnType<typeof getUser>>; // full access (separate)
let userReader: Awaited<ReturnType<typeof getUser>>; // scope: skills:read
let userWriter: Awaited<ReturnType<typeof getUser>>; // scope: skills:write

const FW_ID = 'fw-test-001';
const SKILL_IDS = ['s-1', 's-2', 's-3'];

describe('Skills router', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userReader = await getUser('d'.repeat(64), 'skills:read');
        userWriter = await getUser('e'.repeat(64), 'skills:write');
    });

    beforeEach(async () => {
        // Clean graph state between tests
        await Skill.delete({ detach: true, where: {} });
        await SkillFramework.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await Tag.delete({ detach: true, where: {} });

        // Seed provider (idempotent across tests)
        __skillsProviderTestUtils.seedFramework({
            id: FW_ID,
            name: 'Test Framework',
            description: 'A provider-seeded test framework',
            sourceURI: 'https://example.com/frameworks/test',
        });

        __skillsProviderTestUtils.seedSkills(FW_ID, [
            {
                id: SKILL_IDS[0]!,
                statement: 'Alpha Skill',
                code: 'A1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: SKILL_IDS[1]!,
                statement: 'Beta Skill',
                code: 'B1',
                type: 'container',
                status: 'active',
                parentId: null,
            },
            {
                id: SKILL_IDS[2]!,
                statement: 'Gamma Skill',
                code: 'C1',
                type: 'skill',
                status: 'active',
                parentId: SKILL_IDS[0],
            },
        ]);
    });

    it('syncs provider skills into local graph when I manage the framework', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        const result = await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });

        expect(result.framework.id).toBe(FW_ID);
        expect(result.framework.name).toBe('Test Framework');
        expect(result.skills.length).toBe(3);
        expect(result.skills.map(s => s.id)).toEqual(expect.arrayContaining(SKILL_IDS));
        expect(result.skills.map(s => s.type)).toEqual(
            expect.arrayContaining(['skill', 'container'])
        );
        // Verify parent linkage present where provided
        const child = result.skills.find(s => s.id === SKILL_IDS[2]);
        expect(child?.parentId).toBe(SKILL_IDS[0]);
        expect(child?.type).toBe('skill');
    });

    it('is idempotent on repeated sync', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        const first = await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });
        const second = await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });

        expect(first.skills.length).toBe(3);
        expect(second.skills.length).toBe(3);
        const ids = second.skills.map(s => s.id);
        expect(new Set(ids).size).toBe(3);
    });

    it('enforces management permissions on sync', async () => {
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await expect(
            userB.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('requires skills:write to sync', async () => {
        await userReader.clients.fullAuth.profile.createProfile({ profileId: 'reader' });
        // Reader does not have write scope, should be unauthorized regardless of management
        await expect(
            userReader.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('add/list/remove tags on a skill I manage', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });
        await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });

        // Initially empty
        let tags = await userA.clients.fullAuth.skills.listSkillTags({ id: SKILL_IDS[0]! });
        expect(tags).toEqual([]);

        // Add tag
        tags = await userA.clients.fullAuth.skills.addSkillTag({
            id: SKILL_IDS[0]!,
            tag: { slug: 'core', name: 'Core' },
        });
        expect(tags.some(t => t.slug === 'core' && t.name === 'Core')).toBe(true);
        expect(tags.filter(t => t.slug === 'core').length).toBe(1);

        // Add same slug with new name -> updates name, still one tag
        tags = await userA.clients.fullAuth.skills.addSkillTag({
            id: SKILL_IDS[0]!,
            tag: { slug: 'core', name: 'Core Updated' },
        });
        expect(tags.some(t => t.slug === 'core' && t.name === 'Core Updated')).toBe(true);
        expect(tags.filter(t => t.slug === 'core').length).toBe(1);

        // Remove
        const removed = await userA.clients.fullAuth.skills.removeSkillTag({
            id: SKILL_IDS[0]!,
            slug: 'core',
        });
        expect(removed.success).toBe(true);

        tags = await userA.clients.fullAuth.skills.listSkillTags({ id: SKILL_IDS[0]! });
        expect(tags).toEqual([]);

        // Removing again should be a no-op success
        const removedAgain = await userA.clients.fullAuth.skills.removeSkillTag({
            id: SKILL_IDS[0]!,
            slug: 'core',
        });
        expect(removedAgain.success).toBe(true);
    });

    it('enforces management and scope on tag routes', async () => {
        // Writer can link and sync but lacks read scope
        await userWriter.clients.fullAuth.profile.createProfile({ profileId: 'writer' });
        await userWriter.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });
        await userWriter.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });

        // Can add (write)
        const afterAdd = await userWriter.clients.fullAuth.skills.addSkillTag({
            id: SKILL_IDS[1]!,
            tag: { slug: 'tag1', name: 'Tag 1' },
        });
        expect(afterAdd.some(t => t.slug === 'tag1')).toBe(true);

        // Cannot list (requires read scope)
        await expect(
            userWriter.clients.fullAuth.skills.listSkillTags({ id: SKILL_IDS[1]! })
        ).rejects.toThrow();

        // Another user without management cannot add/list/remove
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await expect(
            userB.clients.fullAuth.skills.addSkillTag({
                id: SKILL_IDS[1]!,
                tag: { slug: 'x', name: 'X' },
            })
        ).rejects.toThrow();
        await expect(
            userB.clients.fullAuth.skills.listSkillTags({ id: SKILL_IDS[1]! })
        ).rejects.toThrow();
        await expect(
            userB.clients.fullAuth.skills.removeSkillTag({ id: SKILL_IDS[1]!, slug: 'tag1' })
        ).rejects.toThrow();
    });

    it('rejects unauthenticated calls', async () => {
        await expect(noAuthClient.skills.syncFrameworkSkills({ id: FW_ID })).rejects.toThrow();

        await expect(
            noAuthClient.skills.addSkillTag({ id: SKILL_IDS[0]!, tag: { slug: 't', name: 'T' } })
        ).rejects.toThrow();

        await expect(noAuthClient.skills.listSkillTags({ id: SKILL_IDS[0]! })).rejects.toThrow();

        await expect(
            noAuthClient.skills.removeSkillTag({ id: SKILL_IDS[0]!, slug: 't' })
        ).rejects.toThrow();
    });
});
