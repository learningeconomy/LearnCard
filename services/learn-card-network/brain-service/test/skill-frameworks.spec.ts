import crypto from 'crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getUser, getClient } from './helpers/getClient';
import { Profile, SkillFramework, Skill, Boost } from '@models';
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
    return skills
        .flatMap(skill => [skill.id, ...flattenSkillIds(skill.children)])
        .filter(Boolean) as string[];
};

const findSkillById = (
    skills: Array<{ id?: string; children?: any[] }> | undefined,
    id: string,
    parentId?: string
): { id?: string; children?: any[]; parentRef?: string } | undefined => {
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
        expect(flattenSkillIds(result.skills.records)).toEqual(expect.arrayContaining(SKILL_IDS));
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
        await Boost.delete({ detach: true, where: {} });
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

        const fetched = await userA.clients.fullAuth.skillFrameworks.getById({
            id: customFrameworkId,
        });
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
            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({
                id: framework.id!,
            });
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

        const fetched = await userA.clients.fullAuth.skillFrameworks.getById({
            id: customFrameworkId,
        });
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

        const result = await userA.clients.fullAuth.skillFrameworks.delete({
            id: customFrameworkId,
        });
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

    it('returns boosts that use a framework', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        // Create framework
        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Boosts',
        });

        // Create boosts
        const boost1Uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            name: 'Boost 1',
        });
        const boost2Uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            name: 'Boost 2',
        });
        // Create a third boost but don't attach it to the framework
        await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            name: 'Boost 3',
        });

        // Attach framework to first two boosts
        await userA.clients.fullAuth.boost.attachFrameworkToBoost({
            boostUri: boost1Uri,
            frameworkId,
        });
        await userA.clients.fullAuth.boost.attachFrameworkToBoost({
            boostUri: boost2Uri,
            frameworkId,
        });

        // Get boosts that use the framework
        const result = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            limit: 10,
        });

        expect(result.hasMore).toBe(false);
        expect(result.records).toHaveLength(2);

        // Extract boost IDs from URIs for comparison
        const resultUris = result.records.map(b => b.uri).sort();
        const expectedUris = [boost1Uri, boost2Uri].sort();

        // Both should have the same boost IDs (using proper URI parsing)
        const resultIds = resultUris.map(uri => uri.split(':').pop() || '').sort();
        const expectedIds = expectedUris.map(uri => uri.split(':').pop() || '').sort();

        expect(resultIds).toEqual(expectedIds);

        // Verify cursor format (should be composite: relCreatedAt|boostCreatedAt|boostId)
        if (result.cursor) {
            expect(result.cursor).toMatch(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|[a-f0-9-]+$/
            );
        }
    });

    it('paginates boosts that use a framework', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Pagination',
        });

        // Create 2 boosts and attach them (simple test)
        const boostUris: string[] = [];
        for (let i = 0; i < 2; i++) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: `Boost ${i}`,
            });
            boostUris.push(uri);
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Get first page with limit 1
        const firstPage = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            limit: 1,
        });

        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.records).toHaveLength(1);
        expect(firstPage.cursor).toBeDefined();

        // Verify cursor format includes relationship createdAt
        expect(firstPage.cursor).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|/);

        // Get second page
        const secondPage = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            limit: 1,
            cursor: firstPage.cursor ?? undefined,
        });

        expect(secondPage.hasMore).toBe(false);
        expect(secondPage.records).toHaveLength(1);
        expect(secondPage.cursor).toBeUndefined();

        // Verify we got different boosts on each page
        expect(firstPage.records[0]?.uri).not.toBe(secondPage.records[0]?.uri);

        // Verify all our boosts are returned
        const allReturnedUris = [
            ...firstPage.records.map(b => b.uri),
            ...secondPage.records.map(b => b.uri),
        ];

        const returnedIds = allReturnedUris.map(uri => uri.split(':').pop() || '').sort();
        const expectedIds = boostUris.map(uri => uri.split(':').pop() || '').sort();

        expect(returnedIds).toEqual(expectedIds);
    });

    it('returns empty list for framework with no boosts', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Unused Framework',
        });

        const result = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
        });

        expect(result.hasMore).toBe(false);
        expect(result.records).toHaveLength(0);
        expect(result.cursor).toBeUndefined();
    });

    it('filters boosts by query parameter', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Query',
        });

        // Create boosts with different names
        const boost1Uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            name: 'JavaScript Expert',
        });
        const boost2Uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            name: 'Python Developer',
        });
        const boost3Uri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            name: 'Java Programmer',
        });

        // Attach all to framework
        await userA.clients.fullAuth.boost.attachFrameworkToBoost({
            boostUri: boost1Uri,
            frameworkId,
        });
        await userA.clients.fullAuth.boost.attachFrameworkToBoost({
            boostUri: boost2Uri,
            frameworkId,
        });
        await userA.clients.fullAuth.boost.attachFrameworkToBoost({
            boostUri: boost3Uri,
            frameworkId,
        });

        // Query for 'java' (should match Java and JavaScript) using $regex
        const javaResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: { name: { $regex: /java/i } },
        });

        expect(javaResult.records).toHaveLength(2);
        const javaNames = javaResult.records.map(b => b.name).sort();
        expect(javaNames).toEqual(['Java Programmer', 'JavaScript Expert']);

        // Query for 'python' using case-insensitive regex
        const pythonResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework(
            {
                id: frameworkId,
                query: { name: { $regex: /python/i } },
            }
        );

        expect(pythonResult.records).toHaveLength(1);
        expect(pythonResult.records[0]?.name).toBe('Python Developer');

        // Query for 'expert' using $regex
        const expertResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework(
            {
                id: frameworkId,
                query: { name: { $regex: /expert/i } },
            }
        );

        expect(expertResult.records).toHaveLength(1);
        expect(expertResult.records[0]?.name).toBe('JavaScript Expert');

        // Query for non-existent term
        const noMatchResult =
            await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
                id: frameworkId,
                query: { name: { $regex: /rust/i } },
            });

        expect(noMatchResult.records).toHaveLength(0);

        // No query should return all
        const allResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
        });

        expect(allResult.records).toHaveLength(3);

        // Test $or operator - match "Developer" OR "Programmer" (not Expert)
        const orResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: {
                $or: [{ name: { $regex: /Developer/i } }, { name: { $regex: /Programmer/i } }],
            },
        });

        expect(orResult.records.length).toEqual(2);
        const orNames = orResult.records
            .map(b => b.name)
            .filter(name => name?.includes('Developer') || name?.includes('Programmer'))
            .sort();
        expect(orNames).toEqual(['Java Programmer', 'Python Developer']);
    });

    it('supports complex query combinations with $or, $regex, and $in', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Complex Queries',
        });

        // Create boosts with different properties
        const boosts = [
            { name: 'Senior JavaScript Developer', type: 'certification' },
            { name: 'Python Expert Badge', type: 'badge' },
            { name: 'Java Certification', type: 'certification' },
            { name: 'Ruby on Rails Developer', type: 'skill' },
            { name: 'TypeScript Guru', type: 'badge' },
        ];

        const boostUris: string[] = [];
        for (const boost of boosts) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: boost.name,
                type: boost.type,
            });
            boostUris.push(uri);
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Test: $or with multiple $regex patterns
        const multiOrResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: {
                $or: [
                    { name: { $regex: /Python/i } },
                    { name: { $regex: /Ruby/i } },
                    { name: { $regex: /TypeScript/i } }
                ]
            },
        });

        expect(multiOrResult.records).toHaveLength(3);
        const multiOrNames = multiOrResult.records.map(b => b.name).sort();
        expect(multiOrNames).toEqual(['Python Expert Badge', 'Ruby on Rails Developer', 'TypeScript Guru']);

        // Test: $in with type field
        const inResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: {
                type: { $in: ['certification', 'badge'] }
            },
        });

        expect(inResult.records).toHaveLength(4);
        const inNames = inResult.records.map(b => b.name).sort();
        expect(inNames).toEqual([
            'Java Certification',
            'Python Expert Badge',
            'Senior JavaScript Developer',
            'TypeScript Guru'
        ]);

        // Test: Combined $or with different fields
        const combinedOrResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: {
                $or: [
                    { type: { $in: ['skill'] } },
                    { name: { $regex: /Expert/i } }
                ]
            },
        });

        expect(combinedOrResult.records).toHaveLength(2);
        const combinedNames = combinedOrResult.records.map(b => b.name).sort();
        expect(combinedNames).toEqual(['Python Expert Badge', 'Ruby on Rails Developer']);

        // Test: Regular AND query (multiple fields)
        const andResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: {
                type: 'badge',
                name: { $regex: /Python/i }
            },
        });

        expect(andResult.records).toHaveLength(1);
        expect(andResult.records[0]?.name).toBe('Python Expert Badge');
    });

    it('combines query filtering with pagination correctly', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Query Pagination',
        });

        // Create 5 boosts, 3 matching our query
        const boosts = [
            { name: 'Advanced Python Developer', match: true },
            { name: 'Java Expert', match: false },
            { name: 'Python Data Scientist', match: true },
            { name: 'Ruby Programmer', match: false },
            { name: 'Python Machine Learning Engineer', match: true },
        ];

        for (const boost of boosts) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: boost.name,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Get first page with query and limit 2
        const firstPage = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            limit: 2,
            query: { name: { $regex: /Python/i } },
        });

        expect(firstPage.records).toHaveLength(2);
        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.cursor).toBeDefined();

        // All returned boosts should match the query
        firstPage.records.forEach(boost => {
            expect(boost.name?.toLowerCase()).toContain('python');
        });

        // Get second page
        const secondPage = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            limit: 2,
            query: { name: { $regex: /Python/i } },
            cursor: firstPage.cursor ?? undefined,
        });

        expect(secondPage.records).toHaveLength(1);
        expect(secondPage.hasMore).toBe(false);
        expect(secondPage.cursor).toBeUndefined();

        secondPage.records.forEach(boost => {
            expect(boost.name?.toLowerCase()).toContain('python');
        });

        // Verify all pages together give us exactly 3 Python boosts
        const allPythonBoosts = [...firstPage.records, ...secondPage.records];
        expect(allPythonBoosts).toHaveLength(3);

        // Verify we didn't get any duplicates
        const uniqueUris = new Set(allPythonBoosts.map(b => b.uri));
        expect(uniqueUris.size).toBe(3);
    });

    it('handles case-insensitive regex queries correctly', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Case Sensitivity',
        });

        // Create boosts with various casing
        const boosts = [
            'PYTHON Developer',
            'python expert',
            'Python Programmer',
            'PYthon Engineer',
        ];

        for (const name of boosts) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        // Query with lowercase should match all
        const result = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: { name: { $regex: /python/i } },
        });

        expect(result.records).toHaveLength(4);

        // Query without case-insensitive flag should only match lowercase
        const caseSensitiveResult = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: { name: { $regex: /python/ } },
        });

        expect(caseSensitiveResult.records).toHaveLength(1);
        expect(caseSensitiveResult.records[0]?.name).toBe('python expert');
    });

    it('returns empty results when query matches nothing', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework',
        });

        // Create some boosts
        for (let i = 0; i < 3; i++) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: `JavaScript Developer ${i}`,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        // Query for something that doesn't exist
        const result = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: { name: { $regex: /Golang/i } },
        });

        expect(result.records).toHaveLength(0);
        expect(result.hasMore).toBe(false);
        expect(result.cursor).toBeUndefined();
    });

    it('handles complex nested $or queries', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Nested Queries',
        });

        // Create boosts with different combinations
        const boosts = [
            { name: 'Senior Python Developer', type: 'certification' },
            { name: 'Junior JavaScript Engineer', type: 'badge' },
            { name: 'Python Data Analyst', type: 'skill' },
            { name: 'JavaScript Architect', type: 'certification' },
            { name: 'Ruby Developer', type: 'badge' },
        ];

        for (const boost of boosts) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: boost.name,
                type: boost.type,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        // Complex OR: (Python AND certification) OR (JavaScript AND badge)
        const result = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
            id: frameworkId,
            query: {
                $or: [
                    { name: { $regex: /Python/i }, type: 'certification' },
                    { name: { $regex: /JavaScript/i }, type: 'badge' }
                ]
            },
        });

        expect(result.records).toHaveLength(2);
        const names = result.records.map(b => b.name).sort();
        expect(names).toEqual(['Junior JavaScript Engineer', 'Senior Python Developer']);
    });

    it('counts all boosts without query filter', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Counting',
        });

        // Create 5 boosts
        for (let i = 0; i < 5; i++) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: `Boost ${i}`,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        const result = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
        });

        expect(result.count).toBe(5);
    });

    it('counts boosts with query filter', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Filtered Counting',
        });

        // Create boosts with different names
        const boosts = [
            'Python Developer',
            'JavaScript Expert',
            'Python Engineer',
            'Java Programmer',
            'Python Scientist',
        ];

        for (const name of boosts) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        // Count all
        const allResult = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
        });
        expect(allResult.count).toBe(5);

        // Count only Python-related
        const pythonResult = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
            query: { name: { $regex: /Python/i } },
        });
        expect(pythonResult.count).toBe(3);

        // Count with $or query
        const orResult = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
            query: {
                $or: [
                    { name: { $regex: /Expert/i } },
                    { name: { $regex: /Programmer/i } }
                ]
            },
        });
        expect(orResult.count).toBe(2);
    });

    it('returns 0 count when no boosts match query', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework',
        });

        // Create some boosts
        for (let i = 0; i < 3; i++) {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name: `JavaScript Developer ${i}`,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        // Query for something that doesn't exist
        const result = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
            query: { name: { $regex: /Rust/i } },
        });

        expect(result.count).toBe(0);
    });

    it('returns 0 count for framework with no boosts', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Empty Framework',
        });

        const result = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
        });

        expect(result.count).toBe(0);
    });

    it('count matches paginated results total', async () => {
        await ensureProfile();
        const frameworkId = `fw-custom-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Test Framework for Count Verification',
        });

        // Create 10 boosts, 6 matching our query
        for (let i = 0; i < 10; i++) {
            const name = i < 6 ? `Python Developer ${i}` : `JavaScript Developer ${i}`;
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                name,
            });
            await userA.clients.fullAuth.boost.attachFrameworkToBoost({
                boostUri: uri,
                frameworkId,
            });
        }

        const query = { name: { $regex: /Python/i } };

        // Get count
        const countResult = await userA.clients.fullAuth.skillFrameworks.countBoostsThatUseFramework({
            id: frameworkId,
            query,
        });

        // Get all pages
        const allBoosts = [];
        let cursor: string | undefined = undefined;
        do {
            const page = await userA.clients.fullAuth.skillFrameworks.getBoostsThatUseFramework({
                id: frameworkId,
                limit: 2,
                query,
                cursor,
            });
            allBoosts.push(...page.records);
            cursor = page.cursor ?? undefined;
        } while (cursor);

        // Count should match total paginated results
        expect(countResult.count).toBe(6);
        expect(allBoosts).toHaveLength(6);
    });
});
