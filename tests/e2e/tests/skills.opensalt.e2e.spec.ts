import { describe, expect, test } from 'vitest';
import { unwrapBoostCredential } from '@learncard/helpers';

import { getLearnCardForUser, type LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

const DEFAULT_OPENSALT_FRAMEWORK_REF =
    'https://opensalt.net/ims/case/v1p0/CFDocuments/c6085394-d7cb-11e8-824f-0242ac160002';

type SyncedSkillNode = {
    id: string;
    statement: string;
    type?: string;
    children?: SyncedSkillNode[];
};

type AlignmentLike = {
    targetName?: string;
};

type SubjectLike = {
    achievement?: { alignment?: AlignmentLike[] };
    alignment?: AlignmentLike[];
};

const getAlignmentNames = (subject: SubjectLike | undefined): string[] => {
    const alignment = subject?.achievement?.alignment || subject?.alignment || [];
    return alignment.map(item => item?.targetName).filter((name): name is string => Boolean(name));
};

const flattenSkillTree = (skillsInput: SyncedSkillNode[]): SyncedSkillNode[] => {
    const collected: SyncedSkillNode[] = [];

    const visit = (nodes: SyncedSkillNode[]) => {
        for (const node of nodes) {
            collected.push(node);
            if (node.children?.length) visit(node.children);
        }
    };

    visit(skillsInput);
    return collected;
};

describe('Skills OpenSALT E2E', () => {
    test('links, syncs, aligns, issues, and verifies using real OpenSALT skills', async ({
        skip,
    }) => {
        if (process.env.E2E_REAL_OPENSALT !== 'true') {
            skip();
            return;
        }

        const a: LearnCard = await getLearnCardForUser('a');
        const b: LearnCard = await getLearnCardForUser('b');

        const frameworkId = process.env.E2E_OPENSALT_FRAMEWORK_ID || DEFAULT_OPENSALT_FRAMEWORK_REF;

        const linked = await a.invoke.createSkillFramework({ frameworkId });
        expect(linked.id).toBeTruthy();
        expect(linked.name?.length).toBeGreaterThan(0);

        const synced = await a.invoke.syncFrameworkSkills({ id: linked.id });
        expect(synced.framework.id).toBe(linked.id);

        const flattened = flattenSkillTree((synced.skills.records as SyncedSkillNode[]) ?? []);
        expect(flattened.length).toBeGreaterThan(0);

        const firstRealSkill = flattened.find(
            skill => typeof skill.id === 'string' && typeof skill.statement === 'string'
        );
        expect(firstRealSkill).toBeDefined();
        expect((firstRealSkill?.statement ?? '').trim().length).toBeGreaterThan(0);

        const skillToAlign =
            flattened.find(skill => skill.type?.toLowerCase() !== 'container') || firstRealSkill;
        if (!skillToAlign?.id) throw new Error('No OpenSALT skill available for alignment');

        const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
            skills: [{ frameworkId: linked.id, id: skillToAlign.id }],
        });

        await a.invoke.attachFrameworkToBoost(boostUri, linked.id);
        await a.invoke.alignBoostSkills(boostUri, [
            { frameworkId: linked.id, id: skillToAlign.id },
        ]);

        const boostRecord = await a.invoke.getBoost(boostUri);
        const boostSubject = Array.isArray(boostRecord.boost.credentialSubject)
            ? boostRecord.boost.credentialSubject[0]
            : boostRecord.boost.credentialSubject;

        const boostAlignmentNames = getAlignmentNames(boostSubject as SubjectLike | undefined);
        expect(boostAlignmentNames).toContain(skillToAlign.statement);

        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
        });
        const vc = unwrapBoostCredential(await a.invoke.resolveFromLCN(credentialUri));

        const issuedSubject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        const issuedAlignmentNames = getAlignmentNames(issuedSubject as SubjectLike | undefined);
        expect(issuedAlignmentNames).toContain(skillToAlign.statement);

        const verification = await b.invoke.verifyCredential(vc);
        expect(verification.errors).toHaveLength(0);
    }, 120000);
});
