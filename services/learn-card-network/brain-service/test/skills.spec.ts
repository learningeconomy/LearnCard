import crypto from 'crypto';
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

const flattenSkillTree = (
    skills?: Array<{ id?: string; children?: any[] }>
): Array<{ id?: string; children?: any[]; parentRef?: string }> => {
    if (!skills) return [];
    const result: Array<{ id?: string; children?: any[]; parentRef?: string }> = [];

    const visit = (
        nodes: Array<{ id?: string; children?: any[] }>,
        parentId?: string
    ) => {
        nodes.forEach(node => {
            const flattened = { ...node } as {
                id?: string;
                children?: any[];
                parentRef?: string;
            };

            if (parentId) flattened.parentRef = parentId;

            result.push(flattened);

            if (node.children?.length) visit(node.children as any[], node.id);
        });
    };

    visit(skills, undefined);

    return result;
};

const pluckSkillIds = (skills?: Array<{ id?: string; children?: any[] }>): string[] =>
    flattenSkillTree(skills).map(skill => skill.id).filter(Boolean) as string[];

const findSkillById = <T extends { id?: string }>(
    skills: Array<T & { children?: any[] }> | undefined,
    id: string
): (T & { parentRef?: string }) | undefined =>
    flattenSkillTree(skills).find(skill => skill.id === id) as (T & { parentRef?: string }) | undefined;

describe('Skills router', () => {
    const createProfileFor = async (
        user: Awaited<ReturnType<typeof getUser>>,
        prefix: string
    ): Promise<string> => {
        const profileId = `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
        await user.clients.fullAuth.profile.createProfile({ profileId });
        return profileId;
    };

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
        await createProfileFor(userA, 'usera');
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        const result = await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });

        expect(result.framework.id).toBe(FW_ID);
        expect(result.framework.name).toBe('Test Framework');
        // Two root skills, but three total nodes in the tree
        expect(result.skills.records.length).toBe(2);
        const flattened = flattenSkillTree(result.skills.records);
        expect(flattened.length).toBe(3);
        expect(flattened.map(s => s.id)).toEqual(expect.arrayContaining(SKILL_IDS));
        expect(flattened.map(s => s.type)).toEqual(
            expect.arrayContaining(['skill', 'container'])
        );
        // Verify parent linkage present where provided
        const child = flattened.find(s => s.id === SKILL_IDS[2]);
        expect(child?.parentRef).toBe(SKILL_IDS[0]);
        expect(child?.type).toBe('skill');
    });

    it('is idempotent on repeated sync', async () => {
        await createProfileFor(userA, 'usera');
        await userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID });

        const first = await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });
        const second = await userA.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID });

        expect(first.skills.records.length).toBe(2);
        expect(second.skills.records.length).toBe(2);
        const ids = flattenSkillTree(second.skills.records).map(s => s.id);
        expect(new Set(ids).size).toBe(3);
    });

    it('enforces management permissions on sync', async () => {
        await createProfileFor(userB, 'userb');
        await expect(
            userB.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('requires skills:write to sync', async () => {
        await createProfileFor(userReader, 'reader');
        // Reader does not have write scope, should be unauthorized regardless of management
        await expect(
            userReader.clients.fullAuth.skills.syncFrameworkSkills({ id: FW_ID })
        ).rejects.toThrow();
    });

    it('paginates framework skill tree responses', async () => {
        await createProfileFor(userA, 'usera');
        const frameworkId = `fw-tree-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Tree Pagination',
            skills: ['a', 'b', 'c'].map(root => ({
                id: `${frameworkId}-${root}`,
                statement: `Root ${root}`,
                children: [
                    { id: `${frameworkId}-${root}-child-1`, statement: `Child 1 of ${root}` },
                    { id: `${frameworkId}-${root}-child-2`, statement: `Child 2 of ${root}` },
                ],
            })),
        });

        const firstPage = await userA.clients.fullAuth.skills.getFrameworkSkillTree({
            id: frameworkId,
            rootsLimit: 2,
            childrenLimit: 1,
        });

        expect(firstPage.records).toHaveLength(2);
        expect(firstPage.hasMore).toBe(true);
        expect(firstPage.cursor).toBeTruthy();

        const firstRoot = firstPage.records[0]!;
        expect(firstRoot.children).toHaveLength(1);
        expect(firstRoot.childrenCursor).toBe(`${frameworkId}-a-child-1`);
        expect(firstRoot.hasChildren).toBe(true);

        const secondPage = await userA.clients.fullAuth.skills.getFrameworkSkillTree({
            id: frameworkId,
            cursor: firstPage.cursor,
        });

        expect(secondPage.records).toHaveLength(1);
        expect(secondPage.hasMore).toBe(false);
        expect(flattenSkillTree(secondPage.records).map(s => s?.id)).toContain(
            `${frameworkId}-c`
        );
    });

    it('paginates children for an individual skill', async () => {
        await createProfileFor(userA, 'usera');
        const frameworkId = `fw-children-${crypto.randomUUID()}`;
        const parentId = `${frameworkId}-parent`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Children Pagination',
            skills: [
                {
                    id: parentId,
                    statement: 'Parent Node',
                    children: ['a', 'b', 'c'].map(child => ({
                        id: `${frameworkId}-child-${child}`,
                        statement: `Child ${child.toUpperCase()}`,
                    })),
                },
            ],
        });

        const first = await userA.clients.fullAuth.skills.getSkillChildrenTree({
            frameworkId,
            id: parentId,
            limit: 2,
        });

        expect(first.records).toHaveLength(2);
        expect(first.hasMore).toBe(true);
        expect(first.cursor).toBe(`${frameworkId}-child-b`);

        const second = await userA.clients.fullAuth.skills.getSkillChildrenTree({
            frameworkId,
            id: parentId,
            cursor: first.cursor,
        });

        expect(second.records).toHaveLength(1);
        expect(second.hasMore).toBe(false);
        expect(second.records[0]?.id).toBe(`${frameworkId}-child-c`);
    });

    it('add/list/remove tags on a skill I manage', async () => {
        await createProfileFor(userA, 'usera');
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
        await createProfileFor(userWriter, 'writer');
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
        await createProfileFor(userB, 'userb');
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

    describe('custom skill CRUD', () => {
        const setupManagedFramework = async () => {
            const profileId = await createProfileFor(userA, 'usera');
            const frameworkId = `fw-custom-${crypto.randomUUID()}`;

            await userA.clients.fullAuth.skillFrameworks.createManaged({
                id: frameworkId,
                name: 'Local Framework',
                description: 'Framework managed through CRUD routes',
            });

            return { frameworkId };
        };

        it('allows delegated framework admins to manage skills', async () => {
            const { frameworkId } = await setupManagedFramework();
            const delegatedProfileId = await createProfileFor(userB, 'userb');

            await userA.clients.fullAuth.skillFrameworks.addFrameworkAdmin({
                frameworkId,
                profileId: delegatedProfileId,
            });

            const delegatedSkillId = `${frameworkId}-delegated`;

            const created = await userB.clients.fullAuth.skills.create({
                frameworkId,
                skill: {
                    id: delegatedSkillId,
                    statement: 'Delegated Skill',
                },
            });
            expect(created.id).toBe(delegatedSkillId);

            const updated = await userB.clients.fullAuth.skills.update({
                frameworkId,
                id: delegatedSkillId,
                statement: 'Delegated Skill Updated',
            });
            expect(updated.statement).toBe('Delegated Skill Updated');

            const deleted = await userB.clients.fullAuth.skills.delete({
                frameworkId,
                id: delegatedSkillId,
            });
            expect(deleted.success).toBe(true);

            await userA.clients.fullAuth.skillFrameworks.removeFrameworkAdmin({
                frameworkId,
                profileId: delegatedProfileId,
            });

            await expect(
                userB.clients.fullAuth.skills.create({
                    frameworkId,
                    skill: {
                        id: `${frameworkId}-post-removal`,
                        statement: 'Should fail',
                    },
                })
            ).rejects.toThrow();
        });

        it('creates skills inside a managed framework', async () => {
            const { frameworkId } = await setupManagedFramework();
            const parentSkillId = `${frameworkId}-parent`;
            const childSkillId = `${frameworkId}-child`;

            const parent = await userA.clients.fullAuth.skills.create({
                frameworkId,
                skill: {
                    id: parentSkillId,
                    statement: 'Local Parent Skill',
                    code: 'LP1',
                    type: 'skill',
                },
            });
            expect(parent.id).toBe(parentSkillId);
            expect(parent.frameworkId).toBe(frameworkId);
            expect(parent).not.toHaveProperty('parentId');

            const child = await userA.clients.fullAuth.skills.create({
                frameworkId,
                parentId: parentSkillId,
                skill: {
                    id: childSkillId,
                    statement: 'Local Child Skill',
                },
            });
            expect(child).not.toHaveProperty('parentId');

            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: frameworkId });
            expect(pluckSkillIds(fetched.skills.records)).toEqual(
                expect.arrayContaining([parentSkillId, childSkillId])
            );
            const fetchedChild = findSkillById(fetched.skills.records, childSkillId);
            expect(fetchedChild?.parentRef).toBe(parentSkillId);
            const fetchedParent = findSkillById(fetched.skills.records, parentSkillId);
            expect(fetchedParent?.children?.some((c: any) => c.id === childSkillId)).toBe(true);
        });

        it('creates nested skills in a single create call', async () => {
            const { frameworkId } = await setupManagedFramework();
            const rootSkillId = `${frameworkId}-root`;
            const childSkillId = `${frameworkId}-child`;

            const created = await userA.clients.fullAuth.skills.create({
                frameworkId,
                skill: {
                    id: rootSkillId,
                    statement: 'Root from tree',
                    children: [
                        {
                            id: childSkillId,
                            statement: 'Child from tree',
                        },
                    ],
                },
            });

            expect(created.id).toBe(rootSkillId);

            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: frameworkId });
            const ids = pluckSkillIds(fetched.skills.records);
            expect(ids).toEqual(expect.arrayContaining([rootSkillId, childSkillId]));
            const child = findSkillById(fetched.skills.records, childSkillId);
            expect(child?.parentRef).toBe(rootSkillId);
        });

        it('creates many skills within a framework via batch endpoint', async () => {
            const { frameworkId } = await setupManagedFramework();

            const results = await userA.clients.fullAuth.skills.createMany({
                frameworkId,
                skills: [
                    {
                        id: `${frameworkId}-batch-parent`,
                        statement: 'Batch Parent',
                        code: 'BP1',
                        children: [
                            {
                                id: `${frameworkId}-batch-child`,
                                statement: 'Batch Child',
                            },
                        ],
                    },
                ],
            });

            expect(results).toHaveLength(2);
            const parent = results.find(s => s.id === `${frameworkId}-batch-parent`);
            const child = results.find(s => s.id === `${frameworkId}-batch-child`);
            expect(parent).toBeDefined();
            expect(child).not.toHaveProperty('parentId');

            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: frameworkId });
            expect(pluckSkillIds(fetched.skills.records)).toEqual(
                expect.arrayContaining([`${frameworkId}-batch-parent`, `${frameworkId}-batch-child`])
            );
            const flattened = flattenSkillTree(fetched.skills.records);
            const fetchedChild = flattened.find(s => s.id === `${frameworkId}-batch-child`);
            expect(fetchedChild?.parentRef).toBe(`${frameworkId}-batch-parent`);
        });

        it('updates skill metadata for a managed framework', async () => {
            const { frameworkId } = await setupManagedFramework();
            const parentSkillId = `${frameworkId}-parent`;
            const childSkillId = `${frameworkId}-child`;

            await userA.clients.fullAuth.skills.create({
                frameworkId,
                skill: {
                    id: parentSkillId,
                    statement: 'Primary Parent',
                    code: 'PP1',
                },
            });
            await userA.clients.fullAuth.skills.create({
                frameworkId,
                parentId: parentSkillId,
                skill: {
                    id: childSkillId,
                    statement: 'Child Skill',
                },
            });

            const updated = await userA.clients.fullAuth.skills.update({
                frameworkId,
                id: childSkillId,
                statement: 'Child Skill Updated',
                code: 'CS2',
                status: 'archived',
            });

            expect(updated.statement).toBe('Child Skill Updated');
            expect(updated.status).toBe('archived');
            expect(updated).not.toHaveProperty('parentId');

            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: frameworkId });
            const fetchedChild = findSkillById(fetched.skills.records, childSkillId);
            expect(fetchedChild?.parentRef).toBe(parentSkillId);
            expect(fetchedChild?.status).toBe('archived');
            expect(fetchedChild?.code).toBe('CS2');
        });

        it('deletes a skill that I manage', async () => {
            const { frameworkId } = await setupManagedFramework();
            const parentSkillId = `${frameworkId}-parent`;
            const childSkillId = `${frameworkId}-child`;

            await userA.clients.fullAuth.skills.create({
                frameworkId,
                skill: {
                    id: parentSkillId,
                    statement: 'Parent Skill',
                },
            });
            await userA.clients.fullAuth.skills.create({
                frameworkId,
                parentId: parentSkillId,
                skill: {
                    id: childSkillId,
                    statement: 'Child to delete',
                },
            });

            const deleted = await userA.clients.fullAuth.skills.delete({
                frameworkId,
                id: childSkillId,
            });

            expect(deleted.success).toBe(true);

            const fetched = await userA.clients.fullAuth.skillFrameworks.getById({ id: frameworkId });
            const ids = pluckSkillIds(fetched.skills.records);
            expect(ids).not.toContain(childSkillId);
            expect(ids).toContain(parentSkillId);
        });

        it('enforces management and scopes on skill CRUD', async () => {
            const { frameworkId } = await setupManagedFramework();
            const skillId = `${frameworkId}-skill`;

            const created = await userA.clients.fullAuth.skills.create({
                frameworkId,
                skill: {
                    id: skillId,
                    statement: 'Owner Skill',
                },
            });
            expect(created.id).toBe(skillId);

            await createProfileFor(userB, 'userb');
            await expect(
                userB.clients.fullAuth.skills.create({
                    frameworkId,
                    skill: { id: `${frameworkId}-other`, statement: 'Unauthorized' },
                })
            ).rejects.toThrow();

            await expect(
                userB.clients.fullAuth.skills.update({
                    frameworkId,
                    id: skillId,
                    statement: 'Nope',
                })
            ).rejects.toThrow();

            await expect(
                userB.clients.fullAuth.skills.delete({ frameworkId, id: skillId })
            ).rejects.toThrow();

            await createProfileFor(userReader, 'reader');
            await expect(
                userReader.clients.fullAuth.skills.create({
                    frameworkId,
                    skill: { id: `${frameworkId}-reader`, statement: 'Read only' },
                })
            ).rejects.toThrow();
        });
    });

    it('searches skills in a framework with regex pattern', async () => {
        await createProfileFor(userA, 'usera');
        const frameworkId = `fw-search-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Search Test Framework',
            skills: [
                {
                    id: `${frameworkId}-javascript`,
                    statement: 'JavaScript Programming',
                    code: 'JS101',
                    description: 'Learn JavaScript fundamentals',
                },
                {
                    id: `${frameworkId}-python`,
                    statement: 'Python Programming',
                    code: 'PY101',
                    description: 'Learn Python basics',
                },
                {
                    id: `${frameworkId}-typescript`,
                    statement: 'TypeScript Development',
                    code: 'TS101',
                    description: 'Advanced JavaScript with types',
                },
                {
                    id: `${frameworkId}-database`,
                    statement: 'Database Design',
                    code: 'DB101',
                    description: 'Learn database fundamentals',
                },
            ],
        });

        // Search by description with case-insensitive regex
        const jsResults = await userA.clients.fullAuth.skills.searchFrameworkSkills({
            id: frameworkId,
            query: { description: { $regex: /javascript/i } },
            limit: 10,
        });
        expect(jsResults.records.length).toBe(2); // JavaScript and TypeScript (has "JavaScript with types" in description)
        expect(jsResults.records.map(s => s.id)).toEqual(
            expect.arrayContaining([`${frameworkId}-javascript`, `${frameworkId}-typescript`])
        );
        expect(jsResults.hasMore).toBe(false);

        // Search by code using $in
        const codeResults = await userA.clients.fullAuth.skills.searchFrameworkSkills({
            id: frameworkId,
            query: { code: { $in: ['JS101', 'TS101'] } },
            limit: 10,
        });
        expect(codeResults.records.length).toBe(2);

        // Search with pagination
        const page1 = await userA.clients.fullAuth.skills.searchFrameworkSkills({
            id: frameworkId,
            query: { statement: { $regex: /.*/ } },
            limit: 2,
        });
        expect(page1.records.length).toBe(2);
        expect(page1.hasMore).toBe(true);
        expect(page1.cursor).toBeTruthy();

        const page2 = await userA.clients.fullAuth.skills.searchFrameworkSkills({
            id: frameworkId,
            query: { statement: { $regex: /.*/ } },
            limit: 2,
            cursor: page1.cursor,
        });
        expect(page2.records.length).toBe(2);
        expect(page2.hasMore).toBe(false);

        // Search with no results
        const noResults = await userA.clients.fullAuth.skills.searchFrameworkSkills({
            id: frameworkId,
            query: { statement: { $regex: /ruby/i } },
            limit: 10,
        });
        expect(noResults.records.length).toBe(0);
        expect(noResults.hasMore).toBe(false);
    });

    it('enforces management permissions on framework skill search', async () => {
        await createProfileFor(userA, 'usera');
        const frameworkId = `fw-search-${crypto.randomUUID()}`;

        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Private Framework',
            skills: [{ id: `${frameworkId}-skill`, statement: 'Private Skill' }],
        });

        // User B cannot search in A's framework
        await createProfileFor(userB, 'userb');
        await expect(
            userB.clients.fullAuth.skills.searchFrameworkSkills({
                id: frameworkId,
                query: { statement: { $regex: /.*/ } },
                limit: 10,
            })
        ).rejects.toThrow();
    });

    it('requires skills:read scope for framework search', async () => {
        await createProfileFor(userWriter, 'writer');
        const frameworkId = `fw-search-${crypto.randomUUID()}`;

        await userWriter.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'Writer Framework',
            skills: [{ id: `${frameworkId}-skill`, statement: 'Test Skill' }],
        });

        // Writer has skills:write but not skills:read
        await expect(
            userWriter.clients.fullAuth.skills.searchFrameworkSkills({
                id: frameworkId,
                query: { statement: { $regex: /.*/ } },
                limit: 10,
            })
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

        await expect(
            noAuthClient.skills.create({
                frameworkId: FW_ID,
                skill: { id: 'noauth-skill', statement: 'No auth' },
            })
        ).rejects.toThrow();

        await expect(
            noAuthClient.skills.update({ frameworkId: FW_ID, id: 'noauth-skill', statement: 'Nope' })
        ).rejects.toThrow();

        await expect(
            noAuthClient.skills.delete({ frameworkId: FW_ID, id: 'noauth-skill' })
        ).rejects.toThrow();

        await expect(
            noAuthClient.skills.searchFrameworkSkills({ id: FW_ID, query: { statement: { $regex: /.*/ } }, limit: 10 })
        ).rejects.toThrow();
    });
});
