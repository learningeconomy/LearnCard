import crypto from 'crypto';
import { describe, test, expect, beforeEach } from 'vitest';
import { unwrapBoostCredential } from '@learncard/helpers';

import { getLearnCardForUser, getLearnCard, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: LearnCard;
let b: LearnCard;
let noAuth: LearnCard;

// Helper to seed a provider framework + skills via E2E-only routes
const seedFrameworkAndSkills = async (
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
    const client = lc.invoke.getLCNClient() as any;
    const testClient = client.test;
    if (!testClient) throw new Error('Test router is not available. Ensure IS_E2E_TEST=true.');

    await testClient.seedSkillsProviderFramework.mutate({
        id: frameworkId,
        name: `E2E OBv3 FW ${frameworkId}`,
        description: 'E2E seeded provider framework for OBv3 alignment test',
        sourceURI: 'https://example.com/framework',
    });

    await testClient.seedSkillsProviderSkills.mutate({ frameworkId, skills });
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

        const skills = [
            {
                id: skill1Id,
                statement: 'Alignment Skill 1',
                description: 'First test skill',
                code: 'S1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: skill2Id,
                statement: 'Alignment Skill 2',
                description: 'Second test skill',
                code: 'S2',
                type: 'container',
                status: 'active',
                parentId: skill1Id,
            },
        ];

        // 1) Seed provider with framework + skills
        await seedFrameworkAndSkills(a, fwId, skills);

        // 2) Link framework to user A and sync local skill nodes
        await a.invoke.createSkillFramework({ frameworkId: fwId });
        await a.invoke.syncFrameworkSkills({ id: fwId });

        // 3) Create a boost
        const boostUri = await a.invoke.createBoost(testUnsignedBoost);

        // 4) Attach framework + align specific skills via production routes (plugin methods)
        await a.invoke.attachFrameworkToBoost(boostUri, fwId);
        await a.invoke.alignBoostSkills(boostUri, [skill1Id, skill2Id]);

        // 5) Send the boost via plugin (plugin injects alignments)
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
        expect(names).toEqual(['Alignment Skill 1', 'Alignment Skill 2']);

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

        const skills = [
            {
                id: skill1Id,
                statement: 'A1',
                code: 'S1',
                type: 'skill',
                status: 'active',
                parentId: null,
            },
            {
                id: skill2Id,
                statement: 'A2',
                code: 'S2',
                type: 'container',
                status: 'active',
                parentId: skill1Id,
            },
        ];

        await seedFrameworkAndSkills(a, fwId, skills);
        await a.invoke.createSkillFramework({ frameworkId: fwId });
        await a.invoke.syncFrameworkSkills({ id: fwId });

        const boostUri = await a.invoke.createBoost(testUnsignedBoost);
        await a.invoke.attachFrameworkToBoost(boostUri, fwId);
        await a.invoke.alignBoostSkills(boostUri, [skill1Id, skill2Id]);

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
        expect(names).toEqual(['A1', 'A2']);
    });
});
