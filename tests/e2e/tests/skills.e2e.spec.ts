import crypto from 'crypto';
import { describe, test, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, getLearnCard, LearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: LearnCard;
let b: LearnCard;
let noAuth: LearnCard;

type SkillInputNode = {
    id: string;
    statement: string;
    description?: string;
    code?: string;
    type?: string;
    status?: string;
    children?: SkillInputNode[];
};

type SyncedSkillNode = SkillInputNode & {
    hasChildren: boolean;
    children: SyncedSkillNode[];
    childrenCursor?: string | null;
};
type FlattenedSyncedSkillNode = SyncedSkillNode & { parentRef?: string };

type SkillTreeLike = SyncedSkillNode[] | { records: SyncedSkillNode[] };

const normalizeNodes = (input: SkillTreeLike): SyncedSkillNode[] => {
    if (Array.isArray(input)) return input;
    if (input && Array.isArray(input.records)) return input.records;
    return [];
};

const flattenSkillTree = (skillsInput: SkillTreeLike): FlattenedSyncedSkillNode[] => {
    const skills = normalizeNodes(skillsInput);
    const collected: FlattenedSyncedSkillNode[] = [];

    const visit = (nodes: SyncedSkillNode[], parentId?: string) => {
        nodes.forEach(node => {
            const flattened: FlattenedSyncedSkillNode = {
                ...node,
                parentRef: parentId,
            };

            collected.push(flattened);

            if (node.children?.length) visit(node.children, node.id);
        });
    };

    visit(skills);

    return collected;
};

const createFrameworkWithSkills = async (
    lc: LearnCard,
    frameworkId: string,
    skills: SkillInputNode[]
) => {
    await lc.invoke.createManagedSkillFrameworks({
        frameworks: [
            {
                id: frameworkId,
                name: `E2E Framework ${frameworkId}`,
                description: 'E2E managed framework',
                sourceURI: 'https://example.com/framework',
                status: 'active',
                skills: skills.map(skill => sanitizeSkillNode(skill)),
            },
        ],
    });
};

const sanitizeSkillNode = (skill: any): any => ({
    id: skill.id,
    statement: skill.statement,
    description: skill.description,
    code: skill.code,
    type: skill.type,
    status: skill.status === 'archived' ? 'archived' : 'active',
    children: (skill.children ?? []).map((child: any) => sanitizeSkillNode(child)),
});

// Helper to create/link a framework to a user profile
const linkFrameworkForUser = async (lc: LearnCard, frameworkId: string) => {
    const mine = await lc.invoke.listMySkillFrameworks();
    const existing = mine.find(f => f.id === frameworkId);
    if (existing) return existing;

    const linked = await lc.invoke.createSkillFramework({ frameworkId });
    expect(linked).toBeDefined();
    expect(linked.id).toBe(frameworkId);
    return linked;
};

describe('Skills & Frameworks E2E', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
        // noAuth client: has no profile/account
        noAuth = await getLearnCard(crypto.randomBytes(32).toString('hex'));
    });

    test('can seed provider, link framework, sync skills, and retrieve framework with skills', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skill1Id = `${fwId}-S1`;
        const skill2Id = `${fwId}-S2`;

        await createFrameworkWithSkills(a, fwId, [
            {
                id: skill1Id,
                statement: 'Skill 1',
                description: 'First skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                children: [
                    {
                        id: skill2Id,
                        statement: 'Skill 2',
                        description: 'Second skill',
                        code: 'S2',
                        type: 'container',
                        status: 'active',
                    },
                ],
            },
        ]);

        // Link framework to user A's profile (becomes manager)
        await linkFrameworkForUser(a, fwId);

        // List frameworks managed by user A
        const mine = await a.invoke.listMySkillFrameworks();
        expect(mine.map(f => f.id)).toContain(fwId);

        // Sync skills for that framework
        const synced = await a.invoke.syncFrameworkSkills({ id: fwId });
        expect(synced.framework.id).toBe(fwId);
        const flattenedSynced = flattenSkillTree(synced.skills as any);
        const syncedSkillIds = flattenedSynced.map(s => s.id).sort();
        expect(syncedSkillIds).toEqual([skill1Id, skill2Id].sort());
        const s2 = flattenedSynced.find(s => s.id === skill2Id)!;

        expect(s2.parentRef).toBe(skill1Id);
        expect(s2.type).toBe('container');

        // Retrieve framework by id (provider-based read, allowed only for manager)
        const fetched = await a.invoke.getSkillFrameworkById(fwId);
        expect(fetched.framework.id).toBe(fwId);
        const fetchedSynced = flattenSkillTree(fetched.skills as any);
        const fetchedIds = fetchedSynced.map(s => s.id).sort();
        expect(fetchedIds).toEqual([skill1Id, skill2Id].sort());
        expect(fetchedSynced.find(s => s.id === skill2Id)?.type).toBe('container');
    });

    test('can manage tags on synced skills (list/add/remove)', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skill1Id = `${fwId}-S1`;
        const skill2Id = `${fwId}-S2`;

        await createFrameworkWithSkills(a, fwId, [
            {
                id: skill1Id,
                statement: 'Skill 1',
                description: 'First skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                children: [
                    {
                        id: skill2Id,
                        statement: 'Skill 2',
                        description: 'Second skill',
                        code: 'S2',
                        type: 'container',
                        status: 'active',
                    },
                ],
            },
        ]);

        await linkFrameworkForUser(a, fwId);
        const { skills } = await a.invoke.syncFrameworkSkills({ id: fwId });
        const flattened = flattenSkillTree(skills as any);
        const targetSkillId = flattened.find(s => s.id === skill1Id)?.id ?? skill1Id;

        // Initially no tags
        let tags = await a.invoke.listSkillTags(targetSkillId);
        expect(tags).toHaveLength(0);

        // Add a tag
        const tag = { slug: `subject:${fwId}`, name: 'Subject' };
        tags = await a.invoke.addSkillTag(targetSkillId, tag);
        expect(tags.map(t => t.slug)).toContain(tag.slug);

        // Remove the tag
        const removeRes = await a.invoke.removeSkillTag(targetSkillId, tag.slug);
        expect(removeRes.success).toBe(true);

        // Verify tag removed
        tags = await a.invoke.listSkillTags(targetSkillId);
        expect(tags).toHaveLength(0);
    });

    test('enforces authorization: must manage framework/skill and must have a profile', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skill1Id = `${fwId}-S1`;
        const skill2Id = `${fwId}-S2`;

        await createFrameworkWithSkills(a, fwId, [
            {
                id: skill1Id,
                statement: 'Skill 1',
                description: 'First skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                children: [
                    {
                        id: skill2Id,
                        statement: 'Skill 2',
                        description: 'Second skill',
                        code: 'S2',
                        type: 'container',
                        status: 'active',
                    },
                ],
            },
        ]);

        // Link to A only
        await linkFrameworkForUser(a, fwId);

        // No-auth client cannot call plugin methods that require a profile
        await expect(noAuth.invoke.createSkillFramework({ frameworkId: fwId })).rejects.toThrow(
            /Please make an account first/i
        );

        // Sync to get local skills and pick a skill id
        const { skills } = await a.invoke.syncFrameworkSkills({ id: fwId });
        const flattened = flattenSkillTree(skills as any);
        const targetSkillId = flattened.find(s => s.id === skill1Id)?.id ?? skill1Id;

        // User B does not manage A's framework -> should be unauthorized for framework read
        await expect(b.invoke.getSkillFrameworkById(fwId)).rejects.toBeDefined();

        // User B unauthorized for tags on A-managed skill
        await expect(b.invoke.listSkillTags(targetSkillId)).rejects.toBeDefined();
        await expect(
            b.invoke.addSkillTag(targetSkillId, { slug: 'unauth', name: 'Unauth' })
        ).rejects.toBeDefined();
        await expect(b.invoke.removeSkillTag(targetSkillId, 'unauth')).rejects.toBeDefined();

        // User B should not list A's frameworks
        const bMine = await b.invoke.listMySkillFrameworks();
        expect(bMine.find(f => f.id === fwId)).toBeUndefined();
    });

    test('can search skills in a framework with regex patterns', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;

        await createFrameworkWithSkills(a, fwId, [
            {
                id: `${fwId}-javascript`,
                statement: 'JavaScript Programming',
                code: 'JS101',
                description: 'Learn JavaScript fundamentals',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-python`,
                statement: 'Python Programming',
                code: 'PY101',
                description: 'Learn Python basics',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-typescript`,
                statement: 'TypeScript Development',
                code: 'TS101',
                description: 'Advanced JavaScript with types',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-react`,
                statement: 'React Framework',
                code: 'REACT101',
                description: 'Building user interfaces with React',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-java`,
                statement: 'Java Programming',
                code: 'JAVA101',
                description: 'Enterprise Java development',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-rust`,
                statement: 'Rust Programming',
                code: 'RUST101',
                description: 'Systems programming with Rust',
                type: 'skill',
                status: 'active',
            },
        ]);
        await a.invoke.syncFrameworkSkills({ id: fwId });

        // Test 1: Case-insensitive partial match using $regex
        const jsResults = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /script/i },
        }, {
            limit: 10,
        });
        expect(jsResults.records.length).toBe(2); // JavaScript and TypeScript
        expect(jsResults.records.map(s => s.id).sort()).toEqual(
            [`${fwId}-javascript`, `${fwId}-typescript`].sort()
        );
        expect(jsResults.hasMore).toBe(false);

        // Test 2: Exact match on statement
        const exactMatch = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /^Java Programming$/i },
        }, {
            limit: 10,
        });
        expect(exactMatch.records.length).toBe(1);
        expect(exactMatch.records[0]?.id).toBe(`${fwId}-java`);

        // Test 3: Search by code using $in operator
        const codeResults = await a.invoke.searchFrameworkSkills(fwId, {
            code: { $in: ['JS101', 'TS101', 'PY101'] },
        }, {
            limit: 10,
        });
        expect(codeResults.records.length).toBe(3);
        expect(codeResults.records.map((s: any) => s.code).sort()).toEqual(
            ['JS101', 'PY101', 'TS101'].sort()
        );

        // Test 4: Search ending with specific word using $regex
        const endingResults = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /Programming$/i },
        }, {
            limit: 10,
        });
        expect(endingResults.records.length).toBe(4); // JavaScript, Python, Java, Rust
        expect(endingResults.hasMore).toBe(false);

        // Test 5: Comprehensive pagination - page through all results one at a time
        const allPages = [];
        let currentCursor = null;
        let hasMore = true;

        while (hasMore) {
            const page = await a.invoke.searchFrameworkSkills(fwId, {
                statement: { $regex: /.*/ },
            }, {
                limit: 1,
                cursor: currentCursor,
            });
            allPages.push(...page.records);
            currentCursor = page.cursor;
            hasMore = page.hasMore;

            // Safety check to avoid infinite loops
            if (allPages.length > 10) break;
        }

        expect(allPages.length).toBe(6);
        expect(currentCursor).toBeNull(); // Should be null on last page

        // Test 6: Pagination with limit of 2
        const page1 = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /.*/ },
        }, { limit: 2 });
        expect(page1.records.length).toBe(2);
        expect(page1.hasMore).toBe(true);
        expect(page1.cursor).toBeTruthy();

        const page2 = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /.*/ },
        }, {
            limit: 2,
            cursor: page1.cursor,
        });
        expect(page2.records.length).toBe(2);
        expect(page2.hasMore).toBe(true);
        expect(page2.cursor).toBeTruthy();

        const page3 = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /.*/ },
        }, {
            limit: 2,
            cursor: page2.cursor,
        });
        expect(page3.records.length).toBe(2);
        expect(page3.hasMore).toBe(false);
        expect(page3.cursor).toBeNull();

        // Test 7: Pagination with filtered results
        const filteredPage1 = await a.invoke.searchFrameworkSkills(fwId, {
            code: { $regex: /101$/i },
        }, {
            limit: 3,
        });
        expect(filteredPage1.records.length).toBe(3);
        expect(filteredPage1.hasMore).toBe(true);

        const filteredPage2 = await a.invoke.searchFrameworkSkills(fwId, {
            code: { $regex: /101$/i },
        }, {
            limit: 3,
            cursor: filteredPage1.cursor,
        });
        expect(filteredPage2.records.length).toBe(3);
        expect(filteredPage2.hasMore).toBe(false);

        // Test 8: Search with word boundary
        const reactResults = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /\bReact\b/i },
        }, {
            limit: 10,
        });
        expect(reactResults.records.length).toBe(1);
        expect(reactResults.records[0]?.id).toBe(`${fwId}-react`);

        // Test 9: Search with no results
        const noResults = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /ruby/i },
        }, { limit: 10 });
        expect(noResults.records.length).toBe(0);
        expect(noResults.hasMore).toBe(false);
        expect(noResults.cursor).toBeNull();

        // Test 10: Empty cursor at end of results
        const lastPage = await a.invoke.searchFrameworkSkills(fwId, {
            statement: { $regex: /.*/ },
        }, { limit: 100 });
        expect(lastPage.hasMore).toBe(false);
        expect(lastPage.cursor).toBeNull();

        // Test 11: Authorization check - User B cannot search in A's framework
        await expect(
            b.invoke.searchFrameworkSkills(fwId, { statement: { $regex: /.*/ } }, { limit: 10 })
        ).rejects.toBeDefined();
    });

    test('can search skills available for a boost with regex patterns', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;

        await createFrameworkWithSkills(a, fwId, [
            {
                id: `${fwId}-react`,
                statement: 'React Development',
                code: 'REACT101',
                description: 'Learn React fundamentals',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-vue`,
                statement: 'Vue.js Development',
                code: 'VUE101',
                description: 'Learn Vue.js basics',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-angular`,
                statement: 'Angular Development',
                code: 'ANG101',
                description: 'Learn Angular framework',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-svelte`,
                statement: 'Svelte Framework',
                code: 'SVELTE101',
                description: 'Cybernetically enhanced web apps',
                type: 'skill',
                status: 'active',
            },
            {
                id: `${fwId}-solid`,
                statement: 'SolidJS Framework',
                code: 'SOLID101',
                description: 'Simple and performant reactivity',
                type: 'skill',
                status: 'active',
            },
        ]);

        await linkFrameworkForUser(a, fwId);
        await a.invoke.syncFrameworkSkills({ id: fwId });

        // Create a boost
        const boostVc = {
            ...testUnsignedBoost,
            name: 'Test Boost for Skills',
        };
        const boostUri = await a.invoke.createBoost(boostVc);

        // Attach framework to boost
        await a.invoke.attachFrameworkToBoost(boostUri, fwId);

        // Test 1: Case-insensitive partial match using $regex on description
        const reactResults = await a.invoke.searchSkillsAvailableForBoost(
            boostUri,
            { description: { $regex: /react/i } },
            { limit: 10 }
        );
        expect(reactResults.records.length).toBe(2); // React and reactivity (SolidJS description)
        expect(reactResults.hasMore).toBe(false);

        // Test 2: Search across all skills
        const allResults = await a.invoke.searchSkillsAvailableForBoost(boostUri, {
            statement: { $regex: /.*/ },
        }, {
            limit: 10,
        });
        expect(allResults.records.length).toBe(5);
        expect(allResults.hasMore).toBe(false);

        // Test 3: Search for "Framework" ending using $regex
        const frameworkResults = await a.invoke.searchSkillsAvailableForBoost(
            boostUri,
            { statement: { $regex: /Framework$/i } },
            { limit: 10 }
        );
        // Matches: Svelte Framework, SolidJS Framework
        expect(frameworkResults.records.length).toBe(2);

        // Verify both have Framework in statement
        const frameworkInStatement = frameworkResults.records.filter((s: any) =>
            s.statement.endsWith('Framework')
        );
        expect(frameworkInStatement.length).toBe(2); // Svelte, SolidJS

        // Test 4: Search by code pattern using $regex
        const codePattern = await a.invoke.searchSkillsAvailableForBoost(
            boostUri,
            { code: { $regex: /^[A-Z]+101$/i } },
            { limit: 10 }
        );
        expect(codePattern.records.length).toBe(5); // All skills have *101 codes
        expect(codePattern.hasMore).toBe(false);

        // Test 5: Comprehensive pagination - iterate through all
        const allPaginatedPages = [];
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
            const page = await a.invoke.searchSkillsAvailableForBoost(boostUri, {
                statement: { $regex: /.*/ },
            }, {
                limit: 2,
                cursor,
            });
            allPaginatedPages.push(...page.records);
            cursor = page.cursor;
            hasMore = page.hasMore;

            if (allPaginatedPages.length > 10) break; // Safety
        }

        expect(allPaginatedPages.length).toBe(5);
        expect(cursor).toBeNull();

        // Verify no duplicates in paginated results
        const ids = allPaginatedPages.map((s: any) => s.id);
        expect(new Set(ids).size).toBe(ids.length);

        // Test 6: Standard pagination
        const page1 = await a.invoke.searchSkillsAvailableForBoost(boostUri, {
            statement: { $regex: /.*/ },
        }, { limit: 2 });
        expect(page1.records.length).toBe(2);
        expect(page1.hasMore).toBe(true);
        expect(page1.cursor).toBeTruthy();

        const page2 = await a.invoke.searchSkillsAvailableForBoost(boostUri, {
            statement: { $regex: /.*/ },
        }, {
            limit: 2,
            cursor: page1.cursor,
        });
        expect(page2.records.length).toBe(2);
        expect(page2.hasMore).toBe(true);

        const page3 = await a.invoke.searchSkillsAvailableForBoost(boostUri, {
            statement: { $regex: /.*/ },
        }, {
            limit: 2,
            cursor: page2.cursor,
        });
        expect(page3.records.length).toBe(1);
        expect(page3.hasMore).toBe(false);
        expect(page3.cursor).toBeNull();

        // Test 7: Filtered pagination using $in
        const filteredPage1 = await a.invoke.searchSkillsAvailableForBoost(
            boostUri,
            { code: { $in: ['VUE101', 'ANG101', 'SOLID101'] } },
            { limit: 2 }
        );
        expect(filteredPage1.records.length).toBe(2);
        expect(filteredPage1.hasMore).toBe(true);

        const filteredPage2 = await a.invoke.searchSkillsAvailableForBoost(
            boostUri,
            { code: { $in: ['VUE101', 'ANG101', 'SOLID101'] } },
            { limit: 2, cursor: filteredPage1.cursor }
        );
        expect(filteredPage2.records.length).toBe(1);
        expect(filteredPage2.hasMore).toBe(false);

        // Test 8: No results
        const noResults = await a.invoke.searchSkillsAvailableForBoost(boostUri, {
            statement: { $regex: /ember/i },
        }, {
            limit: 10,
        });
        expect(noResults.records.length).toBe(0);
        expect(noResults.hasMore).toBe(false);
        expect(noResults.cursor).toBeNull();

        // Test 9: Single result with pagination
        const singleResult = await a.invoke.searchSkillsAvailableForBoost(
            boostUri,
            { statement: { $regex: /Svelte/i } },
            { limit: 1 }
        );
        expect(singleResult.records.length).toBe(1);
        expect(singleResult.hasMore).toBe(false);
        expect(singleResult.cursor).toBeNull();

        // Test 10: Authorization - User B (not a boost admin) cannot search skills
        await expect(
            b.invoke.searchSkillsAvailableForBoost(boostUri, { statement: { $regex: /.*/ } }, { limit: 10 })
        ).rejects.toBeDefined();
    });

    test('can search skills from parent boost frameworks', async () => {
        const parentFwId = `fw-parent-${crypto.randomUUID()}`;
        const childFwId = `fw-child-${crypto.randomUUID()}`;

        await createFrameworkWithSkills(a, parentFwId, [
            {
                id: `${parentFwId}-parent-skill`,
                statement: 'Parent Skill',
                code: 'P101',
                type: 'skill',
                status: 'active',
            },
        ]);

        await createFrameworkWithSkills(a, childFwId, [
            {
                id: `${childFwId}-child-skill`,
                statement: 'Child Skill',
                code: 'C101',
                type: 'skill',
                status: 'active',
            },
        ]);

        await linkFrameworkForUser(a, parentFwId);
        await a.invoke.syncFrameworkSkills({ id: parentFwId });

        await linkFrameworkForUser(a, childFwId);
        await a.invoke.syncFrameworkSkills({ id: childFwId });

        // Create parent boost
        const parentVc = {
            ...testUnsignedBoost,
            name: 'Parent Boost for Skills',
        };
        const parentUri = await a.invoke.createBoost(parentVc);
        await a.invoke.attachFrameworkToBoost(parentUri, parentFwId);

        // Create child boost
        const childVc = {
            ...testUnsignedBoost,
            name: 'Child Boost for Skills',
        };
        const childUri = await a.invoke.createChildBoost(parentUri, childVc);
        await a.invoke.attachFrameworkToBoost(childUri, childFwId);

        // Child boost can search skills from both frameworks
        const results = await a.invoke.searchSkillsAvailableForBoost(childUri, {
            statement: { $regex: /.*/ },
        }, { limit: 10 });

        expect(results.records.length).toBe(2);
        expect(results.records.map((s: any) => s.id).sort()).toEqual(
            [`${parentFwId}-parent-skill`, `${childFwId}-child-skill`].sort()
        );
    });
});
