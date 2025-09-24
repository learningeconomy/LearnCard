import crypto from 'crypto';
import { describe, test, expect, beforeEach } from 'vitest';
import { unwrapBoostCredential } from '@learncard/helpers';
import { SkillTreeInput } from '@learncard/types';

import { getLearnCardForUser, getLearnCard, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';
import { findSkillIdInTree } from './helpers/skill.helpers';

let a: LearnCard;
let b: LearnCard;
let noAuth: LearnCard;

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
        noAuth = await getLearnCard(crypto.randomBytes(32).toString('hex'));
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
        const { skills: syncedSkills } = await a.invoke.getSkillFrameworkById(fwId);

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
            skillIds: [parentSkillIdSynced, childSkillIdSynced],
        });

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
        const names = alignment
            .map((a: any) => a?.targetName)
            .filter(Boolean)
            .sort();
        expect(names).toEqual(['Alignment Skill 1']);
        expect(names).not.toContain('Alignment Skill 2');

        // Basic shape assertions
        alignment.forEach((aItem: any) => {
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
        const { skills: syncedSkills } = await a.invoke.getSkillFrameworkById(fwId);

        const parentSkillIdSynced =
            findSkillIdInTree(
                syncedSkills,
                node => node.statement === 'A1' || node.code === 'S1'
            ) ?? skill1Id;
        const childSkillIdSynced =
            findSkillIdInTree(
                syncedSkills,
                node => node.statement === 'A2' || node.code === 'S2'
            ) ??
            findSkillIdInTree(
                syncedSkills,
                (_node, { parent }) => parent?.id === parentSkillIdSynced
            ) ??
            skill2Id;

        const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
            skillIds: [parentSkillIdSynced, childSkillIdSynced],
        });

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

    test('fails to create a boost when skills span multiple frameworks', async () => {
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

        await expect(
            a.invoke.createBoost(testUnsignedBoost, { skillIds: [fw1Skill, fw2Skill] })
        ).rejects.toThrow(/same framework/i);
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
});
