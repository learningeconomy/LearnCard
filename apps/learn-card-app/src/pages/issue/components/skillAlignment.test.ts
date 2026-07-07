import { describe, it, expect } from 'vitest';

import { isSkillAlignment, mergeSkillAlignments } from './skillAlignment';
import type { ResolvedSkill } from './skillAlignment';
import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { AlignmentTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

const ctdlAlignments: AlignmentTemplate[] = [
    {
        id: 'ce-9437231a-ce6c-4bf6-8aea-e3752080c960',
        targetName: staticField('BA/MAEd Accelerated Program'),
        targetUrl: staticField('https://credentialfinder.org/credential/ce-9437231a'),
        targetType: staticField('ceterms:Credential'),
        targetCode: staticField('ce-9437231a-ce6c-4bf6-8aea-e3752080c960'),
        targetFramework: staticField('Credential Engine Registry'),
    },
    {
        id: 'onet-11-9151',
        targetName: staticField('Social and Community Service Managers'),
        targetUrl: staticField('https://www.onetonline.org/link/summary/11-9151.00'),
        targetType: staticField('CTDL'),
        targetCode: staticField('11-9151.00'),
        targetFramework: staticField('Standard Occupational Classification'),
    },
];

const skill: ResolvedSkill = {
    id: 'skill-1',
    frameworkId: 'framework-a',
    targetName: 'Critical Thinking',
};

describe('isSkillAlignment', () => {
    it('flags framework-skill alignments by their :: id', () => {
        expect(isSkillAlignment({ ...ctdlAlignments[0], id: 'framework-a::skill-1' })).toBe(true);
    });

    it('flags framework-skill alignments by their /frameworks/.../skills/ url', () => {
        expect(
            isSkillAlignment({
                id: 'plain',
                targetName: staticField('X'),
                targetUrl: staticField('https://network.learncard.com/frameworks/fa/skills/s1'),
            })
        ).toBe(true);
    });

    it('does not flag CTDL / Credential Engine alignments', () => {
        expect(isSkillAlignment(ctdlAlignments[0])).toBe(false);
        expect(isSkillAlignment(ctdlAlignments[1])).toBe(false);
    });
});

describe('mergeSkillAlignments — imported CTDL alignments survive a skills cycle', () => {
    it('adding a skill preserves imported CTDL alignments', () => {
        const afterAdd = mergeSkillAlignments(ctdlAlignments, [skill]);
        const ids = afterAdd.map(a => a.id);
        expect(ids).toContain('ce-9437231a-ce6c-4bf6-8aea-e3752080c960');
        expect(ids).toContain('onet-11-9151');
        expect(ids).toContain('framework-a::skill-1');
    });

    it('removing the last skill leaves the CTDL alignments intact', () => {
        const afterAdd = mergeSkillAlignments(ctdlAlignments, [skill]);
        const afterRemove = mergeSkillAlignments(afterAdd, []);
        expect(afterRemove).toHaveLength(2);
        expect(afterRemove.map(a => a.id)).toEqual([
            'ce-9437231a-ce6c-4bf6-8aea-e3752080c960',
            'onet-11-9151',
        ]);
    });

    it('does not duplicate skill alignments across repeated syncs', () => {
        const once = mergeSkillAlignments(ctdlAlignments, [skill]);
        const twice = mergeSkillAlignments(once, [skill]);
        expect(twice.filter(a => a.id === 'framework-a::skill-1')).toHaveLength(1);
    });
});
