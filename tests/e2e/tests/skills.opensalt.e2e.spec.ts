import { describe, expect, test } from 'vitest';
import { unwrapBoostCredential } from '@learncard/helpers';
import type { UnsignedVC } from '@learncard/types';

import { getLearnCardForUser, type LearnCard } from './helpers/learncard.helpers';
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

const listAllAvailableFrameworkIds = async (learnCard: LearnCard): Promise<string[]> => {
    const ids = new Set<string>();
    let cursor: string | null | undefined = null;

    for (let i = 0; i < 25; i++) {
        const page = await learnCard.invoke.getAllAvailableFrameworks({
            limit: 1,
            cursor,
        });

        for (const framework of page.records) ids.add(framework.id);

        if (!page.hasMore || !page.cursor) break;
        cursor = page.cursor;
    }

    return [...ids];
};

describe('Skills OpenSALT E2E', () => {
    test('shows public OpenSALT frameworks but not other users private frameworks', async ({
        skip,
    }) => {
        if (process.env.E2E_REAL_OPENSALT !== 'true') {
            skip();
            return;
        }

        const a: LearnCard = await getLearnCardForUser('a');
        const b: LearnCard = await getLearnCardForUser('b');

        const frameworkRef =
            process.env.E2E_OPENSALT_FRAMEWORK_ID || DEFAULT_OPENSALT_FRAMEWORK_REF;
        const linked = await a.invoke.createSkillFramework({ frameworkId: frameworkRef });

        const privateFrameworkId = `private-fw-${Date.now()}`;
        await a.invoke.createManagedSkillFramework({
            id: privateFrameworkId,
            name: 'A Private Framework',
        });

        const availableToB = await listAllAvailableFrameworkIds(b);

        expect(availableToB).toContain(linked.id);
        expect(availableToB).not.toContain(privateFrameworkId);
    }, 120000);

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

        const unsignedBoost = {
            ...testUnsignedBoost,
            issuer: a.id.did('key'),
        };

        const boostUri = await a.invoke.createBoost(unsignedBoost, {
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

        const issued = await a.invoke.issueCredential(boostRecord.boost as UnsignedVC);
        const vc = unwrapBoostCredential(issued);

        const issuedSubject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        const issuedAlignmentNames = getAlignmentNames(issuedSubject as SubjectLike | undefined);
        expect(issuedAlignmentNames).toContain(skillToAlign.statement);

        const verification = await b.invoke.verifyCredential(vc);
        expect(verification.errors).toHaveLength(0);
    }, 120000);
});
