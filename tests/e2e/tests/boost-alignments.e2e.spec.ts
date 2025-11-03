import crypto from 'crypto';
import { describe, test, expect, beforeEach } from 'vitest';
import { unwrapBoostCredential } from '@learncard/helpers';
import { SkillTreeInput } from '@learncard/types';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';
import { findSkillIdInTree } from './helpers/skill.helpers';

let a: LearnCard;
let b: LearnCard;

// Helper to create a managed framework with skills through the real CRUD routes
const createFrameworkAndSkills = async (
    lc: LearnCard,
    frameworkId: string,
    skills: SkillTreeInput[]
) => {
    await lc.invoke.createManagedSkillFrameworks({
        frameworks: [
            {
                id: frameworkId,
                name: `E2E OBv3 FW ${frameworkId}`,
                description: 'E2E managed provider framework for OBv3 alignment test',
                sourceURI: 'https://example.com/framework',
                status: 'active',
                skills: skills,
            },
        ],
    });
};

describe('Boost OBv3 Alignment Injection (via Signing Authority)', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('aligns boost frameworks when creating managed frameworks with boostUris', async () => {
        const boostUri = await a.invoke.createBoost(testUnsignedBoost);
        const frameworkId = `fw-${crypto.randomUUID()}`;
        const skillId = `${frameworkId}-skill`;

        await a.invoke.createManagedSkillFrameworks({
            frameworks: [
                {
                    id: frameworkId,
                    name: `Managed Framework ${frameworkId}`,
                    description: 'Framework aligned during creation',
                    boostUris: [boostUri],
                    skills: [
                        {
                            id: skillId,
                            statement: 'Seed Skill',
                            status: 'active',
                        },
                    ],
                },
            ],
        });

        const frameworks = await a.invoke.getBoostFrameworks(boostUri);

        expect(Array.isArray(frameworks.records)).toBe(true);
        expect(frameworks.records.map(fw => fw.id)).toContain(frameworkId);

        const frameworkAdmins = await a.invoke.getSkillFrameworkAdmins(frameworkId);
        expect(frameworkAdmins.some(admin => admin.profileId === USERS.a.profileId)).toBe(true);
    });

    test('allows managing framework admins via plugin', async () => {
        const frameworkId = `fw-${crypto.randomUUID()}`;

        await a.invoke.createManagedSkillFrameworks({
            frameworks: [
                {
                    id: frameworkId,
                    name: `Admin Framework ${frameworkId}`,
                    skills: [],
                },
            ],
        });

        const initialAdmins = await a.invoke.getSkillFrameworkAdmins(frameworkId);
        expect(initialAdmins.some(admin => admin.profileId === USERS.a.profileId)).toBe(true);

        const addResult = await a.invoke.addSkillFrameworkAdmin(frameworkId, USERS.b.profileId);
        expect(addResult.success).toBe(true);

        const afterAdd = await a.invoke.getSkillFrameworkAdmins(frameworkId);
        expect(afterAdd.some(admin => admin.profileId === USERS.b.profileId)).toBe(true);

        const removeResult = await a.invoke.removeSkillFrameworkAdmin(
            frameworkId,
            USERS.b.profileId
        );
        expect(removeResult.success).toBe(true);

        const afterRemove = await a.invoke.getSkillFrameworkAdmins(frameworkId);
        expect(afterRemove.some(admin => admin.profileId === USERS.b.profileId)).toBe(false);
    });

    test('enforces framework admin permissions for skill CRUD via plugin', async () => {
        const frameworkId = `fw-${crypto.randomUUID()}`;
        const delegatedSkillId = `${frameworkId}-delegated`;

        await a.invoke.createManagedSkillFrameworks({
            frameworks: [
                {
                    id: frameworkId,
                    name: `Delegated Framework ${frameworkId}`,
                },
            ],
        });

        await expect(
            b.invoke.createSkill({
                frameworkId,
                skill: {
                    id: delegatedSkillId,
                    statement: 'Should fail',
                },
            })
        ).rejects.toThrow();

        await a.invoke.addSkillFrameworkAdmin(frameworkId, USERS.b.profileId);

        const created = await b.invoke.createSkill({
            frameworkId,
            skill: {
                id: delegatedSkillId,
                statement: 'Delegated Skill',
            },
        });
        expect(created.id).toBe(delegatedSkillId);

        const updated = await b.invoke.updateSkill({
            frameworkId,
            id: delegatedSkillId,
            statement: 'Delegated Skill Updated',
        });
        expect(updated.statement).toBe('Delegated Skill Updated');

        const deleted = await b.invoke.deleteSkill({
            frameworkId,
            id: delegatedSkillId,
            strategy: 'reparent',
        });
        expect(deleted.success).toBe(true);

        await a.invoke.removeSkillFrameworkAdmin(frameworkId, USERS.b.profileId);

        await expect(
            b.invoke.createSkill({
                frameworkId,
                skill: {
                    id: `${frameworkId}-post-removal`,
                    statement: 'Should fail again',
                },
            })
        ).rejects.toThrow();
    });

    test('enforces boost admin permissions when attaching frameworks and aligning skills', async () => {
        const frameworkId = `fw-${crypto.randomUUID()}`;
        const skillId = `${frameworkId}-skill`;
        const boostUri = await a.invoke.createBoost(testUnsignedBoost);

        await a.invoke.createManagedSkillFrameworks({
            frameworks: [
                {
                    id: frameworkId,
                    name: `Boost Framework ${frameworkId}`,
                    skills: [
                        {
                            id: skillId,
                            statement: 'Boost Alignment Skill',
                        },
                    ],
                },
            ],
        });

        await expect(b.invoke.attachFrameworkToBoost(boostUri, frameworkId)).rejects.toThrow();
        await expect(b.invoke.alignBoostSkills(boostUri, [{ frameworkId, id: skillId }])).rejects.toThrow();

        await a.invoke.addBoostAdmin(boostUri, USERS.b.profileId);

        const attachResult = await b.invoke.attachFrameworkToBoost(boostUri, frameworkId);
        expect(attachResult).toBe(true);

        const alignResult = await b.invoke.alignBoostSkills(boostUri, [{ frameworkId, id: skillId }]);
        expect(alignResult).toBe(true);

        await a.invoke.removeBoostAdmin(boostUri, USERS.b.profileId);

        await expect(b.invoke.alignBoostSkills(boostUri, [{ frameworkId, id: skillId }])).rejects.toThrow();
    });

    test('allows child boost admins to align skills from ancestor frameworks (explicit attach required for injection)', async () => {
        const frameworkId = `fw-${crypto.randomUUID()}`;
        const skillId = `${frameworkId}-skill`;

        await a.invoke.createManagedSkillFrameworks({
            frameworks: [
                {
                    id: frameworkId,
                    name: `Ancestor Framework ${frameworkId}`,
                    skills: [
                        {
                            id: skillId,
                            statement: 'Ancestor Skill',
                        },
                    ],
                },
            ],
        });

        const parentUri = await a.invoke.createBoost(testUnsignedBoost);
        await a.invoke.attachFrameworkToBoost(parentUri, frameworkId);

        const childUri = await a.invoke.createChildBoost(parentUri, testUnsignedBoost);

        await a.invoke.addBoostAdmin(childUri, USERS.b.profileId);

        await expect(b.invoke.getSkillFrameworkAdmins(frameworkId)).rejects.toThrow(
            'Profile does not manage this framework'
        );

        // Sanity check: B should be able to see the skills available even though they are not an admin of the framework
        const result = await b.invoke.getSkillsAvailableForBoost(childUri);
        expect(result).toHaveLength(1);
        expect(result[0]!.framework.id).toBe(frameworkId);
        expect(result[0]!.skills.some(skill => skill.id === skillId)).toBe(true);

        // Explicitly attach the framework to the child (no auto-attach from skills)
        await a.invoke.attachFrameworkToBoost(childUri, frameworkId);

        const aligned = await b.invoke.alignBoostSkills(childUri, [{ frameworkId, id: skillId }]);
        expect(aligned).toBe(true);

        const boostRecord = await b.invoke.getBoost(childUri);
        const boostSubject = Array.isArray(boostRecord.boost.credentialSubject)
            ? boostRecord.boost.credentialSubject[0]
            : boostRecord.boost.credentialSubject;
        const alignment = boostSubject?.achievement?.alignment || boostSubject?.alignment || [];
        const names = alignment.map((aItem: any) => aItem?.targetName).filter(Boolean);
        expect(names).toContain('Ancestor Skill');
    });

    test('injects alignments from linked framework + aligned skills into issued VC', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skill1Id = `${fwId}-S1`;
        const skill2Id = `${fwId}-S2`;

        const skills: SkillTreeInput[] = [
            {
                id: skill1Id,
                statement: 'Alignment Skill 1',
                description: 'First test skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                children: [
                    {
                        id: skill2Id,
                        statement: 'Alignment Skill 2',
                        description: 'Second test skill',
                        code: 'S2',
                        type: 'container',
                        status: 'active',
                    },
                ],
            },
        ];

        // 1) Seed provider with framework + skills
        await createFrameworkAndSkills(a, fwId, skills);

        // 2) Link framework to user A and sync local skill nodes
        const { skills: syncedSkillsPage } = await a.invoke.getSkillFrameworkById(fwId);
        const syncedSkills = syncedSkillsPage.records;

        const parentSkillIdSynced =
            findSkillIdInTree(
                syncedSkills,
                node => node.statement === 'Alignment Skill 1' || node.code === 'S1'
            ) ?? skill1Id;
        const childSkillIdSynced =
            findSkillIdInTree(
                syncedSkills,
                node => node.statement === 'Alignment Skill 2' || node.code === 'S2'
            ) ??
            findSkillIdInTree(
                syncedSkills,
                (_node, { parent }) => parent?.id === parentSkillIdSynced
            ) ??
            skill2Id;

        // 3) Create a boost with skill attachments in a single call
        const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
            skills: [
                { frameworkId: fwId, id: parentSkillIdSynced },
                { frameworkId: fwId, id: childSkillIdSynced },
            ],
        });

        // Explicitly attach the framework to the boost to enable alignment injection
        await a.invoke.attachFrameworkToBoost(boostUri, fwId);

        // Fetch boost template and ensure alignments injected (container excluded)
        const boostRecord = await a.invoke.getBoost(boostUri);
        const boostSubject = Array.isArray(boostRecord.boost.credentialSubject)
            ? boostRecord.boost.credentialSubject[0]
            : boostRecord.boost.credentialSubject;
        const boostAlignment = boostSubject?.achievement?.alignment || boostSubject?.alignment;
        expect(Array.isArray(boostAlignment)).toBe(true);
        const boostAlignmentNames = (boostAlignment || [])
            .map((a: any) => a?.targetName)
            .filter(Boolean)
            .sort();
        expect(boostAlignmentNames).toEqual(['Alignment Skill 1']);
        expect(boostAlignmentNames).not.toContain('Alignment Skill 2');

        // 4) Send the boost via plugin (plugin injects alignments)
        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
        });
        expect(credentialUri).toBeDefined();

        // 7) Resolve the issued credential and verify OBv3 alignments
        const vc = unwrapBoostCredential(await a.invoke.resolveFromLCN(credentialUri));
        const subject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        const alignment = subject?.achievement?.alignment || subject?.alignment;

        expect(Array.isArray(alignment)).toBe(true);
        const names = (alignment || [])
            .map((a: any) => a?.targetName)
            .filter(Boolean)
            .sort();
        expect(names).toEqual(['Alignment Skill 1']);
        expect(names).not.toContain('Alignment Skill 2');

        // Basic shape assertions
        (alignment || []).forEach((aItem: any) => {
            expect(aItem).toHaveProperty('targetCode');
            expect(aItem).toHaveProperty('targetName');
            expect(aItem).toHaveProperty('targetFramework');
        });
    });

    test('injects alignments when issuing via claim link (signing authority path)', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skill1Id = `${fwId}-S1`;
        const skill2Id = `${fwId}-S2`;

        const skills: SkillTreeInput[] = [
            {
                id: skill1Id,
                statement: 'A1',
                code: 'S1',
                type: 'skill',
                status: 'active',
                children: [
                    {
                        id: skill2Id,
                        statement: 'A2',
                        code: 'S2',
                        type: 'container',
                        status: 'active',
                    },
                ],
            },
        ];

        await createFrameworkAndSkills(a, fwId, skills);
        const { skills: syncedSkills } = await a.invoke.getSkillFrameworkById(fwId, {
            limit: 10,
            childrenLimit: 10,
        });
        const syncedSkillRecords = syncedSkills.records;

        const parentSkillIdSynced =
            findSkillIdInTree(
                syncedSkillRecords,
                node => node.statement === 'A1' || node.code === 'S1'
            ) ?? skill1Id;
        const childSkillIdSynced =
            findSkillIdInTree(
                syncedSkillRecords,
                node => node.statement === 'A2' || node.code === 'S2'
            ) ??
            findSkillIdInTree(
                syncedSkillRecords,
                (_node, { parent }) => parent?.id === parentSkillIdSynced
            ) ??
            skill2Id;

        const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
            skills: [
                { frameworkId: fwId, id: parentSkillIdSynced },
                { frameworkId: fwId, id: childSkillIdSynced },
            ],
        });
        // Explicitly attach the framework to the boost to enable alignment injection
        await a.invoke.attachFrameworkToBoost(boostUri, fwId);

        // Register SA and generate claim link
        const sa = await a.invoke.createSigningAuthority('skills');

        if (!sa) throw new Error('Could not create Signing Authority');

        await a.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
        const saResult = await a.invoke.getRegisteredSigningAuthority(sa.endpoint!, sa.name!);
        const { challenge } = await a.invoke.generateClaimLink(boostUri, {
            endpoint: saResult!.signingAuthority.endpoint,
            name: saResult!.relationship.name,
        });

        // User B claims
        const credentialUri = await b.invoke.claimBoostWithLink(boostUri, challenge);
        expect(credentialUri).toBeDefined();

        const vc = unwrapBoostCredential(await a.invoke.resolveFromLCN(credentialUri));
        const subject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        const alignment = subject?.achievement?.alignment || subject?.alignment;

        expect(Array.isArray(alignment)).toBe(true);
        const names = alignment
            .map((a: any) => a?.targetName)
            .filter(Boolean)
            .sort();
        expect(names).toEqual(['A1']);
        expect(names).not.toContain('A2');
    });

    test('creates a boost when skills span multiple frameworks (no auto-attach of frameworks)', async () => {
        const fw1 = `fw-${crypto.randomUUID()}`;
        const fw2 = `fw-${crypto.randomUUID()}`;
        const fw1Skill = `${fw1}-S1`;
        const fw2Skill = `${fw2}-S1`;

        await createFrameworkAndSkills(a, fw1, [
            {
                id: fw1Skill,
                statement: 'Framework 1 Skill',
                code: 'FW1',
                type: 'skill',
                status: 'active',
            },
        ]);
        await createFrameworkAndSkills(a, fw2, [
            {
                id: fw2Skill,
                statement: 'Framework 2 Skill',
                code: 'FW2',
                type: 'skill',
                status: 'active',
            },
        ]);

        const uri = await a.invoke.createBoost(testUnsignedBoost, {
            skillIds: [fw1Skill, fw2Skill],
        });
        expect(typeof uri).toBe('string');

        // No frameworks are auto-attached simply by aligning skills
        const frameworks = await a.invoke.getBoostFrameworks(uri);
        expect(frameworks.records.length).toBe(0);
    });

    test('lists skills from ancestor boost frameworks', async () => {
        const fwId = `fw-${crypto.randomUUID()}`;
        const skillIds = [`${fwId}-S1`, `${fwId}-S2`, `${fwId}-S3`];

        await createFrameworkAndSkills(
            a,
            fwId,
            skillIds.map((id, index) => ({
                id,
                statement: `Skill ${index + 1}`,
                code: `S${index + 1}`,
                type: 'skill',
                status: 'active',
            }))
        );

        const rootBoostUri = await a.invoke.createBoost(testUnsignedBoost, {
            skillIds,
        });
        // Explicitly attach the framework to the root boost
        await a.invoke.attachFrameworkToBoost(rootBoostUri, fwId);

        const childBoostUri = await a.invoke.createChildBoost(rootBoostUri, testUnsignedBoost);
        const grandChildBoostUri = await a.invoke.createChildBoost(
            childBoostUri,
            testUnsignedBoost
        );

        const available = await a.invoke.getSkillsAvailableForBoost(grandChildBoostUri);

        expect(Array.isArray(available)).toBe(true);
        expect(available.length).toBe(1);
        expect(available[0]!.framework.id).toBe(fwId);

        const returnedSkillIds = available[0]!.skills.map(s => s.id).sort();
        expect(returnedSkillIds).toEqual([...skillIds].sort());
    });

    test('allows detaching a framework from a boost', async () => {
        const frameworkId = `fw-${crypto.randomUUID()}`;
        const skillId = `${frameworkId}-skill`;

        await createFrameworkAndSkills(a, frameworkId, [
            {
                id: skillId,
                statement: 'Detach Test Skill',
                status: 'active',
            },
        ]);

        const boostUri = await a.invoke.createBoost(testUnsignedBoost);

        // Attach framework
        await a.invoke.attachFrameworkToBoost(boostUri, frameworkId);

        // Verify it's attached
        const frameworksBefore = await a.invoke.getBoostFrameworks(boostUri);
        expect(frameworksBefore.records.map(fw => fw.id)).toContain(frameworkId);

        // Detach framework
        const result = await a.invoke.detachFrameworkFromBoost(boostUri, frameworkId);
        expect(result).toBe(true);

        // Verify it's removed
        const frameworksAfter = await a.invoke.getBoostFrameworks(boostUri);
        expect(frameworksAfter.records.map(fw => fw.id)).not.toContain(frameworkId);
    });

    test('detaching a framework does not affect aligned skills', async () => {
        const frameworkId = `fw-${crypto.randomUUID()}`;
        const skillId = `${frameworkId}-skill`;

        await createFrameworkAndSkills(a, frameworkId, [
            {
                id: skillId,
                statement: 'Detach Skill Test',
                status: 'active',
            },
        ]);

        const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
            skillIds: [skillId],
        });

        // Attach framework
        await a.invoke.attachFrameworkToBoost(boostUri, frameworkId);

        // Detach framework
        await a.invoke.detachFrameworkFromBoost(boostUri, frameworkId);

        // Skills should still be aligned
        const available = await a.invoke.getSkillsAvailableForBoost(boostUri);
        expect(available.length).toBe(0); // No frameworks attached, so no skills available through frameworks

        // Re-attach the framework to verify alignments still work
        await a.invoke.attachFrameworkToBoost(boostUri, frameworkId);
        const availableAfterReattach = await a.invoke.getSkillsAvailableForBoost(boostUri);
        expect(availableAfterReattach.length).toBe(1);
        expect(availableAfterReattach[0]!.skills.map(s => s.id)).toContain(skillId);
    });
});
