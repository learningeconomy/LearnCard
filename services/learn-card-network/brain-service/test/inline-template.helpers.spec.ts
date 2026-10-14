import { describe, expect, it } from 'vitest';

import {
    computeInlineTemplateHash,
    validateInlineTemplateDataOrThrow,
    validateInlineTemplateOrThrow,
} from '../src/helpers/inline-template.helpers';

describe('inline-template.helpers', () => {
    it('throws developer-readable template validation errors', () => {
        expect(() =>
            validateInlineTemplateOrThrow({
                name: '',
                image: 'http://not-https.example.com/badge.png',
            })
        ).toThrow(/TEMPLATE_INVALID:/);
    });

    it('throws strict templateData validation errors with suggestions', () => {
        const compiled = computeInlineTemplateHash({
            name: 'Course Completion: {{courseName}}',
            description: 'Awarded to {{learnerName}}',
        });

        expect(() =>
            validateInlineTemplateDataOrThrow(compiled.variableManifest, {
                courseNmae: 'Broken key',
                learnerName: 'Ada',
            })
        ).toThrow(
            /TEMPLATE_DATA_INVALID: .*templateData.courseName is required.*did you mean "courseName"/
        );
    });

    it('hashes template content deterministically', () => {
        const first = computeInlineTemplateHash({
            name: 'Course Completion: {{courseName}}',
            description: 'Awarded to {{learnerName}}',
            walletSkills: [{ frameworkId: 'framework-1', id: 'skill-1' }],
        });
        const second = computeInlineTemplateHash({
            name: 'Course Completion: {{courseName}}',
            description: 'Awarded to {{learnerName}}',
            walletSkills: [{ frameworkId: 'framework-1', id: 'skill-1' }],
        });

        expect(first.contentHash).toBe(second.contentHash);
    });
});
