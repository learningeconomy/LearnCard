import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getUser, getClient } from './helpers/getClient';
import { Profile, SkillFramework, Skill } from '@models';
import { __skillsProviderTestUtils } from '@services/skills-provider';

const noAuthClient = getClient();

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userReader: Awaited<ReturnType<typeof getUser>>; // scope: skills:read
let userWriter: Awaited<ReturnType<typeof getUser>>; // scope: skills:write

const FW_ID = 'fw-test-001';
const SKILL_IDS = ['s-1', 's-2', 's-3'];

describe('Skill Frameworks (provider-based)', () => {
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

        // Seed provider (idempotent across tests)
        __skillsProviderTestUtils.seedFramework({
            id: FW_ID,
            name: 'Test Framework',
            description: 'A provider-seeded test framework',
            sourceURI: 'https://example.com/frameworks/test',
        });

        __skillsProviderTestUtils.seedSkills(FW_ID, [
            {
                id: SKILL_IDS[0],
                statement: 'Alpha Skill',
                code: 'A1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: SKILL_IDS[1],
                statement: 'Beta Skill',
                code: 'B1',
                type: 'container',
                status: 'active',
                parentId: null,
            },
            {
                id: SKILL_IDS[2],
                statement: 'Gamma Skill',
                code: 'C1',
                type: 'skill',
                status: 'active',
                parentId: SKILL_IDS[0],
            },
        ]);
    });

    it('links an existing provider framework to my profile and shows up in listMine', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });

        const linked = await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        expect(linked.id).toBe(FW_ID);
        expect(linked.name).toBe('Test Framework');
        expect(linked.status).toBe('active');

        const mine = await userA.clients.fullAuth.skillFrameworks.listMine();
        expect(Array.isArray(mine)).toBe(true);
        expect(mine.map(f => f.id)).toContain(FW_ID);

        // Another user with their own profile should not see it unless they manage it
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        const mineB = await userB.clients.fullAuth.skillFrameworks.listMine();
        expect(mineB.find(f => f.id === FW_ID)).toBeUndefined();
    });

    it('fetches the framework and its skills from the provider if I manage it', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        const result = await userA.clients.fullAuth.skillFrameworks.getById({ id: FW_ID });

        expect(result.framework.id).toBe(FW_ID);
        expect(result.framework.name).toBe('Test Framework');
        expect(result.skills.length).toBe(3);
        expect(result.skills.map(s => s.id)).toEqual(expect.arrayContaining(SKILL_IDS));
        expect(result.skills.find(s => s.id === SKILL_IDS[1])?.type).toBe('container');
        // Verify parent linkage present where provided
        const child = result.skills.find(s => s.id === SKILL_IDS[2]);
        expect(child?.parentId).toBe(SKILL_IDS[0]);
        expect(child?.type).toBe('skill');
    });

    it('enforces management permissions on getById', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        await expect(
            userB.clients.fullAuth.skillFrameworks.getById({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('returns NOT_FOUND when linking a non-existent provider framework', async () => {
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });

        await expect(
            userA.clients.fullAuth.skillFrameworks.create({ frameworkId: 'does-not-exist' })
        ).rejects.toThrow();
    });

    it('requires skills:write to link, and skills:read to list/get', async () => {
        // Reader (only skills:read) cannot link
        await userReader.clients.fullAuth.profile.createProfile({ profileId: 'reader' });
        await expect(
            userReader.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID })
        ).rejects.toThrow();

        // Writer (only skills:write) can link but cannot list or get
        await userWriter.clients.fullAuth.profile.createProfile({ profileId: 'writer' });
        const linked = await userWriter.clients.fullAuth.skillFrameworks.create({
            frameworkId: FW_ID,
        });
        expect(linked.id).toBe(FW_ID);

        await expect(userWriter.clients.fullAuth.skillFrameworks.listMine()).rejects.toThrow();

        await expect(
            userWriter.clients.fullAuth.skillFrameworks.getById({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('rejects all operations without auth', async () => {
        await expect(noAuthClient.skillFrameworks.listMine()).rejects.toThrow();

        await expect(noAuthClient.skillFrameworks.getById({ id: FW_ID })).rejects.toThrow();

        await expect(noAuthClient.skillFrameworks.create({ frameworkId: FW_ID })).rejects.toThrow();
    });
});
