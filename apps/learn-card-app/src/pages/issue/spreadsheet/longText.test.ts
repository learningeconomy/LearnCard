import { describe, expect, it, vi } from 'vitest';
import {
    dynamicField,
    staticField,
    systemField,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { makeRun } from './fixtures.test-support';
import { credentialRowProblems, mapSpreadsheetColumn } from './columnMapping';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { mergeSpreadsheet } from './roster';
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
        template.credentialSubject.result = [{ id: 'score', value: dynamicField('score') }];
        template.credentialSubject.evidence = [
            { id: 'work', type: staticField('Evidence'), evidenceUrl: dynamicField('url') },
        ];
        expect(getLongTextVariables(template)).toEqual([]);
        template.credentialSubject.achievement.description = staticField('{{notes}}');
        expect(getLongTextVariables(template)).toEqual(['notes']);
        template.credentialSubject.achievement.description = systemField('issuer_did');
        expect(getLongTextVariables(template)).toEqual([]);
    });
    it('recognizes imported description columns appended to existing text and validates their limit', () => {
        const run = makeRun(0);
        const text = 'First paragraph.\nSecond paragraph.\n' + 'x'.repeat(ROSTER_LONG_TEXT_LIMIT);
        const source = parseSpreadsheet(
            readSpreadsheetText(`Email,Description\nada@example.test,"${text}"`)
        );
        const draft = mergeSpreadsheet(run.draft, source, []).draft;
        const mapped = mapSpreadsheetColumn(
            run.template,
            draft,
            source.columns.find(column => column.label === 'Description')!,
            'description',
            { dateFormat: 'iso', numericFormat: 'dot' }
        );
        const variable = mapped.draft.mappings![0]!.variable;
        expect(mapped.template.credentialSubject.achievement.description.value).toBe(
            `Description\nDescription: {{${variable}}}`
        );
        expect(getLongTextVariables(mapped.template)).toEqual([variable]);
        const values = Object.values(mapped.draft.values)[0]!;
        expect(values[variable]).toBe(text);
        const report = vi.fn();
        expect(credentialRowProblems(mapped.template, values, report)).toContain('length');
        expect(report).toHaveBeenCalledWith('length', variable);
        expect(
            getOverlongTextVariables(mapped.template, { [variable]: 'Corrected\ntext' })
        ).toEqual([]);
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
    it('measures the editable value rather than the prose surrounding it in the rendered credential', () => {
        const { template } = makeRun();
        template.credentialSubject.achievement.description = staticField('Great work! {{note}}');
        const variables = getLongTextVariables(template);
        expect(
            getOverlongTextVariables(
                template,
                { note: 'x'.repeat(ROSTER_LONG_TEXT_LIMIT) },
                variables
            )
        ).toEqual([]);
        expect(
            getOverlongTextVariables(
                template,
                { note: 'x'.repeat(ROSTER_LONG_TEXT_LIMIT + 1) },
                variables
            )
        ).toEqual(['note']);
    });
    it('keeps description editors for custom-schema templates and excludes system placeholders', () => {
        const { template } = makeRun();
        template.schemaType = 'custom';
        template.rawJson = { description: 'Notes: {{notes}}' };
        template.description = staticField('Notes: {{notes}} ({{issuer_did}})');
        expect(getLongTextVariables(template)).toEqual(['notes']);
    });
});
