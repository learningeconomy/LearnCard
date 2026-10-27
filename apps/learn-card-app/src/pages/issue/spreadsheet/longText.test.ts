import { describe, expect, it, vi } from 'vitest';
import {
    dynamicField,
    staticField,
    systemField,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { makeRun } from './fixtures.test-support';
import { credentialRowProblems } from './columnMapping';
import { getLongTextVariables, getOverlongTextVariables, ROSTER_LONG_TEXT_LIMIT } from './longText';

describe('long description authoring', () => {
    it('uses the actual description variable instead of guessing from its label', () => {
        const { template } = makeRun();
        template.credentialSubject.achievement.description = dynamicField('course_notes');
        template.credentialSubject.achievement.criteria.narrative = dynamicField('requirements');
        expect(getLongTextVariables(template)).toEqual(['course_notes', 'requirements']);
    });
    it('does not turn embedded scores and evidence links into description editors', () => {
        const { template } = makeRun();
        template.credentialSubject.achievement.description = staticField(
            'Score: {{score}}. Work: {{url}}'
        );
        expect(getLongTextVariables(template)).toEqual([]);
        template.credentialSubject.achievement.description = staticField('{{notes}}');
        expect(getLongTextVariables(template)).toEqual(['notes']);
        template.credentialSubject.achievement.description = systemField('issuer_did');
        expect(getLongTextVariables(template)).toEqual([]);
    });
    it('retains oversized imported text while blocking it with a field-specific problem', () => {
        const { template } = makeRun();
        template.credentialSubject.achievement.description = dynamicField('description');
        const values = { description: 'a'.repeat(ROSTER_LONG_TEXT_LIMIT + 1), name: 'Badge' };
        const report = vi.fn();
        expect(credentialRowProblems(template, values, report)).toContain('length');
        expect(report).toHaveBeenCalledWith('length', 'description');
        expect(values.description).toHaveLength(ROSTER_LONG_TEXT_LIMIT + 1);
        expect(
            getOverlongTextVariables(template, { description: 'a'.repeat(ROSTER_LONG_TEXT_LIMIT) })
        ).toEqual([]);
    });
});
