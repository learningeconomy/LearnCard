import crypto from 'crypto';
import { describe, test, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, getLearnCard, LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let b: LearnCard;
let noAuth: LearnCard;

// Helper to seed a provider framework and skills via E2E-only test routes
const seedProviderFrameworkAndSkills = async (
    lc: LearnCard,
    frameworkId: string,
    skills: Array<{
        id: string;
        statement: string;
        description?: string;
        code?: string;
        type?: string;
        status?: string;
        parentId?: string | null;
    }>
) => {
    const client = lc.invoke.getLCNClient();

    // Access test-only router (enabled when IS_E2E_TEST=true)
    const testClient = (client as any).test;
    if (!testClient) throw new Error('Test router is not available. Ensure IS_E2E_TEST=true.');

    await testClient.seedSkillsProviderFramework.mutate({
        id: frameworkId,
        name: `E2E Framework ${frameworkId}`,
        description: 'E2E seeded framework',
        sourceURI: 'https://example.com/framework',
    });

    await testClient.seedSkillsProviderSkills.mutate({
        frameworkId,
        skills,
    });
};

// Helper to create/link a framework to a user profile
const linkFrameworkForUser = async (lc: LearnCard, frameworkId: string) => {
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

        await seedProviderFrameworkAndSkills(a, fwId, [
            {
                id: skill1Id,
                statement: 'Skill 1',
                description: 'First skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: skill2Id,
                statement: 'Skill 2',
                description: 'Second skill',
                code: 'S2',
                type: 'container',
                status: 'active',
                parentId: skill1Id,
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
        const syncedSkillIds = synced.skills.map(s => s.id).sort();
        expect(syncedSkillIds).toEqual([skill1Id, skill2Id].sort());
        const s2 = synced.skills.find(s => s.id === skill2Id)!;

        expect(s2.parentId).toBe(skill1Id);
        expect(s2.type).toBe('container');

        // Retrieve framework by id (provider-based read, allowed only for manager)
        const fetched = await a.invoke.getSkillFrameworkById(fwId);
        expect(fetched.framework.id).toBe(fwId);
        const fetchedIds = fetched.skills.map(s => s.id).sort();
        expect(fetchedIds).toEqual([skill1Id, skill2Id].sort());
        expect(fetched.skills.find(s => s.id === skill2Id)?.type).toBe('container');
    });

    test('can manage tags on synced skills (list/add/remove)', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skill1Id = `${fwId}-S1`;
        const skill2Id = `${fwId}-S2`;

        await seedProviderFrameworkAndSkills(a, fwId, [
            {
                id: skill1Id,
                statement: 'Skill 1',
                description: 'First skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: skill2Id,
                statement: 'Skill 2',
                description: 'Second skill',
                code: 'S2',
                type: 'container',
                status: 'active',
                parentId: skill1Id,
            },
        ]);

        await linkFrameworkForUser(a, fwId);
        const { skills } = await a.invoke.syncFrameworkSkills({ id: fwId });
        const targetSkillId = skills[0]!.id;

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

        await seedProviderFrameworkAndSkills(a, fwId, [
            {
                id: skill1Id,
                statement: 'Skill 1',
                description: 'First skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: skill2Id,
                statement: 'Skill 2',
                description: 'Second skill',
                code: 'S2',
                type: 'container',
                status: 'active',
                parentId: skill1Id,
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
        const targetSkillId = skills[0]!.id;

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
});
