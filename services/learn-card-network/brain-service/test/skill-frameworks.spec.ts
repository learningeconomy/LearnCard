import crypto from 'crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getUser, getClient } from './helpers/getClient';
import { Profile, SkillFramework, Skill } from '@models';
import { __skillsProviderTestUtils, getSkillsProvider } from '@services/skills-provider';
import { neogma } from '@instance';
import { testUnsignedBoost } from './helpers/send';

const noAuthClient = getClient();

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userReader: Awaited<ReturnType<typeof getUser>>; // scope: skills:read
let userWriter: Awaited<ReturnType<typeof getUser>>; // scope: skills:write

const FW_ID = 'fw-test-001';
const SKILL_IDS = ['s-1', 's-2', 's-3'];

const flattenSkillIds = (skills?: Array<{ id?: string; children?: any[] }>): string[] => {
    if (!skills) return [];
    return skills.flatMap(skill => [skill.id, ...flattenSkillIds(skill.children)]).filter(Boolean) as string[];
};

const findSkillById = (
    skills: Array<{ id?: string; children?: any[] }> | undefined,
    id: string,
    parentId?: string
): ({ id?: string; children?: any[]; parentRef?: string } | undefined) => {
    if (!skills) return undefined;
    for (const skill of skills) {
        if (skill.id === id) {
            return { ...skill, parentRef: parentId };
        }

        const child = findSkillById(skill.children, id, skill.id);
        if (child) return child;
    }
    return undefined;
};

describe('Skill Frameworks (provider-based)', () => {
    const createProfileFor = async (
        user: Awaited<ReturnType<typeof getUser>>,
        prefix: string
    ): Promise<string> => {
        const profileId = `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
        await user.clients.fullAuth.profile.createProfile({
            profileId,
            image: '',
        });
        return profileId;
    };

    beforeAll(async () => {
        // Initialize dummy provider for tests
        getSkillsProvider({ providerId: 'dummy' });
        
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
        await createProfileFor(userA, 'usera');

        const linked = await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        expect(linked.id).toBe(FW_ID);
        expect(linked.name).toBe('Test Framework');
        expect(linked.status).toBe('active');

        const mine = await userA.clients.fullAuth.skillFrameworks.listMine();
        expect(Array.isArray(mine)).toBe(true);
        expect(mine.map(f => f.id)).toContain(FW_ID);

        // Another user with their own profile should not see it unless they manage it
        await createProfileFor(userB, 'userb');
        const mineB = await userB.clients.fullAuth.skillFrameworks.listMine();
        expect(mineB.find(f => f.id === FW_ID)).toBeUndefined();
    });

    it('fetches the framework and its skills from the provider if I manage it', async () => {
        await createProfileFor(userA, 'usera');
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        const result = await userA.clients.fullAuth.skillFrameworks.getById({ id: FW_ID });

        expect(result.framework.id).toBe(FW_ID);
        expect(result.framework.name).toBe('Test Framework');
        // 2 roots, 3 nodes in total
        expect(result.skills.records.length).toBe(2);
        expect(result.skills.hasMore).toBe(false);
        expect(flattenSkillIds(result.skills.records)).toEqual(
            expect.arrayContaining(SKILL_IDS)
        );
        expect(findSkillById(result.skills.records, SKILL_IDS[1])?.type).toBe('container');
        // Verify parent linkage present where provided
        const child = findSkillById(result.skills.records, SKILL_IDS[2]);
        expect(child?.parentRef).toBe(SKILL_IDS[0]);
        expect(child?.type).toBe('skill');
    });

    it('enforces management permissions on getById', async () => {
        await createProfileFor(userA, 'usera');
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        await createProfileFor(userB, 'userb');

        await expect(
            userB.clients.fullAuth.skillFrameworks.getById({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('returns NOT_FOUND when linking a non-existent provider framework', async () => {
        await createProfileFor(userA, 'usera');

        await expect(
            userA.clients.fullAuth.skillFrameworks.create({ frameworkId: 'does-not-exist' })
        ).rejects.toThrow();
    });

    it('requires skills:write to link, and skills:read to list/get', async () => {
        // Reader (only skills:read) cannot link
        await createProfileFor(userReader, 'reader');
        await expect(
            userReader.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID })
        ).rejects.toThrow();

        // Writer (only skills:write) can link but cannot list or get
        await createProfileFor(userWriter, 'writer');
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

describe('Skill Frameworks (custom CRUD)', () => {
    beforeEach(async () => {
        await Skill.delete({ detach: true, where: {} });
        await SkillFramework.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    const ensureProfile = async () => {
        const profileId = `usera-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
        await userA.clients.fullAuth.profile.createProfile({ profileId });
        return profileId;
    };

    const ensureProfileFor = async (
        user: Awaited<ReturnType<typeof getUser>>,
        prefix: string
    ): Promise<string> => {
        const profileId = `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
        await user.clients.fullAuth.profile.createProfile({ profileId });
        return profileId;
    };

    it('creates and retrieves a managed custom framework', async () => {
        await ensureProfile();
        const customFrameworkId = `fw-custom-${crypto.randomUUID()}`;

        const created = await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: customFrameworkId,
            name: 'Custom Framework',
            description: 'Locally managed framework',
            sourceURI: 'https://example.com/custom',
        });

        expect(created.id).toBe(customFrameworkId);
        expect(created.status).toBe('active');

        const mine = await userA.clients.fullAuth.skillFrameworks.listMine();
        expect(mine.map(fw => fw.id)).toContain(customFrameworkId);

        const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: customFrameworkId });
        expect(fetched.framework.id).toBe(customFrameworkId);
        expect(fetched.framework.name).toBe('Custom Framework');
        expect(fetched.skills.records).toHaveLength(0);
        expect(fetched.skills.hasMore).toBe(false);
    });

    it('creates nested skills when providing a tree on createManaged', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;
        const rootSkillId = `${frameworkId}-root`;
        const childSkillId = `${frameworkId}-child`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Nested Framework',
            skills: [
                {
                    id: rootSkillId,
                    statement: 'Root Skill',
                    children: [
                        {
                            id: childSkillId,
                            statement: 'Child Skill',
                        },
                    ],
                },
            ],
        });

        const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: frameworkId });
        const ids = flattenSkillIds(fetched.skills.records);
        expect(ids).toEqual(expect.arrayContaining([rootSkillId, childSkillId]));
        const child = findSkillById(fetched.skills.records, childSkillId);
        expect(child?.parentRef).toBe(rootSkillId);
    });

    it('aligns boost URIs when creating a managed framework', async () => {
        await ensureProfile();
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;
        const skillId = `${frameworkId}-seed`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Boost Aligned Framework',
            skills: [
                {
                    id: skillId,
                    statement: 'Seed Skill',
                },
            ],
            boostUris: [boostUri],
        });

        const frameworks = await userA.clients.fullAuth.boost.getBoostFrameworks({ uri: boostUri });

        expect(frameworks.map(fw => fw.id)).toContain(frameworkId);
    });

    it('creates multiple frameworks with initial skills in one request', async () => {
        await ensureProfile();
        const fwInputs = [
            {
                id: `fw-custom-${crypto.randomUUID()}`,
                name: 'Batch Framework 1',
                description: 'First batch framework',
                skills: [
                    {
                        id: 'bfw1-s1',
                        statement: 'Framework 1 Skill 1',
                        code: 'F1S1',
                        children: [
                            {
                                id: 'bfw1-s2',
                                statement: 'Framework 1 Skill 2',
                                code: 'F1S2',
                            },
                        ],
                    },
                ],
            },
            {
                id: `fw-custom-${crypto.randomUUID()}`,
                name: 'Batch Framework 2',
                status: 'archived' as const,
                skills: [
                    {
                        id: 'bfw2-s1',
                        statement: 'Framework 2 Skill 1',
                        code: 'F2S1',
                        status: 'archived' as const,
                    },
                ],
            },
        ];

        const created = await userA.clients.fullAuth.skillFrameworks.createManagedBatch({
            frameworks: fwInputs,
        });

        expect(created).toHaveLength(2);
        expect(created.map(f => f.id)).toEqual(expect.arrayContaining(fwInputs.map(f => f.id!)));

        for (const framework of fwInputs) {
            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: framework.id! });
            expect(fetched.framework.id).toBe(framework.id);
            expect(fetched.framework.name).toBe(framework.name);
            if (framework.status) {
                expect(fetched.framework.status).toBe(framework.status);
            }
            const expectedSkillIds = flattenSkillIds(framework.skills);
            expect(flattenSkillIds(fetched.skills.records)).toEqual(
                expect.arrayContaining(expectedSkillIds)
            );
        }
    });

    it('aligns boost URIs when creating managed frameworks in batch', async () => {
        await ensureProfile();
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const frameworkId = `fw-batch-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManagedBatch({
            frameworks: [
                {
                    id: frameworkId,
                    name: 'Batch Boost Framework',
                    skills: [
                        {
                            id: `${frameworkId}-skill`,
                            statement: 'Batch Seed Skill',
                        },
                    ],
                    boostUris: [boostUri],
                },
            ],
        });

        const frameworks = await userA.clients.fullAuth.boost.getBoostFrameworks({ uri: boostUri });

        expect(frameworks.map(fw => fw.id)).toContain(frameworkId);
    });

    it('paginates framework skill trees with cursors', async () => {
        await ensureProfile();
        const frameworkId = `fw-page-${crypto.randomUUID()}`;

        const rootIds = ['root-a', 'root-b', 'root-c'];

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Pagination Framework',
            skills: rootIds.map(root => ({
                id: `${frameworkId}-${root}`,
                statement: `Root ${root}`,
                children: [
                    {
                        id: `${frameworkId}-${root}-child-1`,
                        statement: `Child 1 of ${root}`,
                    },
                    {
                        id: `${frameworkId}-${root}-child-2`,
                        statement: `Child 2 of ${root}`,
                    },
                ],
            })),
        });

        const firstPage = await userA.clients.fullAuth.skillFrameworks.getById({
            id: frameworkId,
            limit: 2,
            childrenLimit: 1,
        });

        expect(firstPage.skills.records).toHaveLength(2);
        expect(firstPage.skills.hasMore).toBe(true);
        expect(firstPage.skills.cursor).toBeTruthy();

        const firstRoot = firstPage.skills.records[0]!;
        expect(firstRoot.children).toHaveLength(1);
        expect(firstRoot.children[0]?.statement).toBe('Child 1 of root-a');
        expect(firstRoot.childrenCursor).toBe(`${frameworkId}-root-a-child-1`);
        expect(firstRoot.hasChildren).toBe(true);

        const secondRoot = firstPage.skills.records[1]!;
        expect(secondRoot.children).toHaveLength(1);
        expect(secondRoot.childrenCursor).toBe(`${frameworkId}-root-b-child-1`);

        const secondPage = await userA.clients.fullAuth.skillFrameworks.getById({
            id: frameworkId,
            cursor: firstPage.skills.cursor,
        });

        expect(secondPage.skills.records).toHaveLength(1);
        expect(secondPage.skills.hasMore).toBe(false);
        const remainingRoot = secondPage.skills.records[0]!;
        expect(remainingRoot.id).toBe(`${frameworkId}-root-c`);
        expect(remainingRoot.children.length).toBe(2);
        expect(secondPage.skills.cursor).toBeNull();
    });

    it('manages framework admins', async () => {
        const ownerProfileId = await ensureProfile();
        const otherProfileId = await ensureProfileFor(userB, 'userb');
        const frameworkId = `fw-admin-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Admin Framework',
        });

        const initialAdmins = await userA.clients.fullAuth.skillFrameworks.listFrameworkAdmins({
            frameworkId,
        });
        expect(initialAdmins.map(admin => admin.profileId)).toContain(ownerProfileId);

        await userA.clients.fullAuth.skillFrameworks.addFrameworkAdmin({
            frameworkId,
            profileId: otherProfileId,
        });

        const afterAdd = await userA.clients.fullAuth.skillFrameworks.listFrameworkAdmins({
            frameworkId,
        });
        expect(afterAdd.map(admin => admin.profileId)).toEqual(
            expect.arrayContaining([ownerProfileId, otherProfileId])
        );

        const removeResult = await userA.clients.fullAuth.skillFrameworks.removeFrameworkAdmin({
            frameworkId,
            profileId: otherProfileId,
        });
        expect(removeResult.success).toBe(true);

        const afterRemove = await userA.clients.fullAuth.skillFrameworks.listFrameworkAdmins({
            frameworkId,
        });
        expect(afterRemove.map(admin => admin.profileId)).not.toContain(otherProfileId);

        await expect(
            userA.clients.fullAuth.skillFrameworks.removeFrameworkAdmin({
                frameworkId,
                profileId: ownerProfileId,
            })
        ).rejects.toThrow('Cannot remove the last framework admin');
    });

    it('updates metadata for a custom framework I manage', async () => {
        await ensureProfile();
        const customFrameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: customFrameworkId,
            name: 'Initial Name',
            description: 'Initial description',
        });

        const updated = await userA.clients.fullAuth.skillFrameworks.update({
            id: customFrameworkId,
            name: 'Renamed Framework',
            description: 'Updated description',
            status: 'archived',
        });

        expect(updated.name).toBe('Renamed Framework');
        expect(updated.description).toBe('Updated description');
        expect(updated.status).toBe('archived');

        const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: customFrameworkId });
        expect(fetched.framework.name).toBe('Renamed Framework');
        expect(fetched.framework.status).toBe('archived');
    });

    it('deletes a custom framework and cascades skills', async () => {
        await ensureProfile();
        const customFrameworkId = `fw-custom-${crypto.randomUUID()}`;
        const skillId = `${customFrameworkId}-skill`; // Track for cascade assertion

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: customFrameworkId,
            name: 'Framework to delete',
        });

        await userA.clients.fullAuth.skills.create({
            frameworkId: customFrameworkId,
            skill: {
                id: skillId,
                statement: 'Local skill',
                code: 'LC1',
            },
        });

        const result = await userA.clients.fullAuth.skillFrameworks.delete({ id: customFrameworkId });
        expect(result.success).toBe(true);

        const mine = await userA.clients.fullAuth.skillFrameworks.listMine();
        expect(mine.find(fw => fw.id === customFrameworkId)).toBeUndefined();

        await expect(
            userA.clients.fullAuth.skillFrameworks.getById({ id: customFrameworkId })
        ).rejects.toThrow();

        const skillCount = await neogma.queryRunner.run(
            'MATCH (s:Skill {id: $id}) RETURN count(s) AS c',
            { id: skillId }
        );
        expect(Number(skillCount.records[0]?.get('c') ?? 0)).toBe(0);
    });

    it('enforces scopes and management on custom framework CRUD', async () => {
        const customFrameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userReader.clients.fullAuth.profile.createProfile({ profileId: 'reader' });
        await expect(
            userReader.clients.fullAuth.skillFrameworks.createManaged({
                id: customFrameworkId,
                name: 'No Write Scope',
            })
        ).rejects.toThrow();

        await ensureProfile();
        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: customFrameworkId,
            name: 'Owner Framework',
        });

        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await expect(
            userB.clients.fullAuth.skillFrameworks.update({ id: customFrameworkId, name: 'Hax' })
        ).rejects.toThrow();

        await expect(
            userB.clients.fullAuth.skillFrameworks.delete({ id: customFrameworkId })
        ).rejects.toThrow();

        await userWriter.clients.fullAuth.profile.createProfile({ profileId: 'writer' });
        const writerFrameworkId = `fw-custom-${crypto.randomUUID()}`;
        const writerCreated = await userWriter.clients.fullAuth.skillFrameworks.createManaged({
            id: writerFrameworkId,
            name: 'Writer Owned',
        });
        expect(writerCreated.id).toBe(writerFrameworkId);

        await expect(
            userWriter.clients.fullAuth.skillFrameworks.getById({ id: writerFrameworkId })
        ).rejects.toThrow();
    });
});
