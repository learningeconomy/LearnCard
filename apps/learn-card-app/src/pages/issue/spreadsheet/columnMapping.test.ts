import { describe, expect, it, vi } from 'vitest';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { mergeSpreadsheet, exportRosterCsv } from './roster';
import {
    credentialRowProblems,
    mapSpreadsheetColumn,
    materializePreview,
    normalizeMappedCell,
    removeSpreadsheetMapping,
    replaceSpreadsheetTemplate,
    suggestMapping,
} from './columnMapping';
import { makeRun } from './fixtures.test-support';
import { readResultState, getResultValidationError } from '../components/resultField';
import { applyVariableValues } from '../components/variableSubstitution';
import {
    templateToJson,
    jsonToTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import type { ColumnMapping } from './types';

const options = { dateFormat: 'iso', numericFormat: 'dot' } as const;
const sample = () => {
    const run = makeRun(0);
    const source = parseSpreadsheet(
        readSpreadsheetText(
            'Email,Name,Percent,Letter Grade,Credits,Hours,Awarded Date,Work URL,Student Code\na@test.com,Ada,95%,A-,0,12,2024-02-29,https://proof.test/ada,0012\nb@test.com,Bob,85%,B+,3,8,2024-03-01,https://proof.test/bob,0009'
        )
    );
    return { template: run.template, draft: mergeSpreadsheet(run.draft, source, []).draft };
};
describe('opt-in standard credential column mappings', () => {
    it('adds independent linked results without replacing earlier grades', () => {
        let state = sample();
        state = mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[2],
            'Percent',
            options
        );
        state = mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[3],
            'LetterGrade',
            options
        );
        expect(state.template.credentialSubject.result).toHaveLength(2);
        expect(readResultState(state.template, 0)).toMatchObject({ resultType: 'Percent' });
        expect(readResultState(state.template, 1)).toMatchObject({ resultType: 'LetterGrade' });
        const values = Object.values(state.draft.values)[0];
        expect(getResultValidationError(state.template, values)).toBeNull();
        const percent = state.template.credentialSubject.result![0].value!.variableName;
        expect(getResultValidationError(state.template, { ...values, [percent]: '120' })).toContain(
            '100'
        );
        expect(
            getResultValidationError(state.template, { ...values, [percent]: '0x10' })
        ).toContain('numeric');
        const report = vi.fn();
        expect(
            credentialRowProblems(state.template, { ...values, [percent]: '120' }, report)
        ).toEqual(['result']);
        expect(report.mock.calls).toEqual([['result', percent]]);
    });
    it('materializes zero credits, standard Evidence and awardedDate independently of validFrom', () => {
        let state = sample();
        for (const [index, target] of [
            [4, 'credits'],
            [6, 'awardedDate'],
            [7, 'evidence'],
        ] as const)
            state = mapSpreadsheetColumn(
                state.template,
                state.draft,
                state.draft.source!.columns[index],
                target,
                options
            );
        const values = Object.values(state.draft.values)[0];
        const json = materializePreview(
            applyVariableValues(templateToJson(state.template), values)
        );
        expect(json.credentialSubject).toMatchObject({ creditsEarned: 0 });
        expect(json.evidence).toEqual([
            expect.objectContaining({ id: 'https://proof.test/ada', type: ['Evidence'] }),
        ]);
        expect(json.awardedDate).toBe('2024-02-29T00:00:00.000Z');
        expect(json.validFrom).toBe('{{issue_date}}');
        expect(JSON.stringify(json['@context'])).not.toContain('ctx.learncard');
        const roundtrip = templateToJson(jsonToTemplate(json));
        expect(roundtrip.credentialSubject).toMatchObject({ creditsEarned: 0 });
        expect(roundtrip.awardedDate).toBe(json.awardedDate);
    });
    it('keeps hours as description text unless a credit unit is chosen explicitly', () => {
        const original = sample();
        const column = original.draft.source!.columns[5];
        const description = mapSpreadsheetColumn(
            original.template,
            original.draft,
            column,
            'description',
            options
        );
        expect(description.template.credentialSubject.creditsEarned).toBeUndefined();
        expect(() =>
            mapSpreadsheetColumn(original.template, original.draft, column, 'credits', options)
        ).toThrow('mapping');
        const credits = mapSpreadsheetColumn(original.template, original.draft, column, 'credits', {
            ...options,
            creditUnit: 'hours',
        });
        expect(credits.template.credentialSubject.achievement.description.value).toContain(
            'Hours (hours):'
        );
    });
    it('retains leading-zero identifiers and preserves explicit date/numeric format choices', () => {
        const state = sample();
        const code = mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[8],
            'description',
            options
        );
        expect(Object.values(code.draft.values)[0][code.variable]).toBe('0012');
        const mapping: ColumnMapping = {
            ...options,
            columnId: 'column',
            label: 'date',
            variable: 'date',
            target: 'awardedDate',
        };
        expect(normalizeMappedCell({ text: '03/04/2024' }, mapping)).toBe('03/04/2024');
        expect(normalizeMappedCell({ text: '03/04/2024' }, { ...mapping, dateFormat: 'dmy' })).toBe(
            '2024-04-03T00:00:00.000Z'
        );
        expect(
            normalizeMappedCell(
                { text: '1,5' },
                { ...mapping, target: 'credits', numericFormat: 'comma' }
            )
        ).toBe('1.5');
        expect(
            normalizeMappedCell(
                { text: '29%', value: 0.29, percent: true },
                { ...mapping, target: 'Percent' }
            )
        ).toBe('29');
    });
    it('requires resolving a conflicting decimal format before adding the column', () => {
        const state = sample();
        const source = parseSpreadsheet(readSpreadsheetText('Email,Credits\na@test.com,1.234'));
        const draft = mergeSpreadsheet(state.draft, source, []).draft;
        expect(() =>
            mapSpreadsheetColumn(state.template, draft, source.columns[1], 'credits', {
                ...options,
                numericFormat: 'comma',
            })
        ).toThrow('format');
        const mapped = mapSpreadsheetColumn(
            state.template,
            draft,
            source.columns[1],
            'credits',
            options
        );
        expect(Object.values(mapped.draft.values)[0][mapped.variable]).toBe('1.234');
    });

    it('validates mapped values inline instead of silently omitting invalid fields', () => {
        let state = sample();
        state = mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[4],
            'credits',
            options
        );
        state = mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[6],
            'awardedDate',
            options
        );
        const mappings = state.draft.mappings!;
        const report = vi.fn();
        expect(
            credentialRowProblems(
                state.template,
                {
                    [mappings[0].variable]: '12 hours',
                    [mappings[1].variable]: '2023-02-29',
                },
                report
            )
        ).toEqual(['number', 'date']);
        expect(report.mock.calls).toEqual([
            ['number', mappings[0].variable],
            ['date', mappings[1].variable],
        ]);
    });
    it('normalizes evidence cells and rejects whitespace within links while preserving static URNs', () => {
        const state = sample();
        const mapped = mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[7],
            'evidence',
            options
        );
        const mapping = mapped.draft.mappings![0];
        expect(normalizeMappedCell({ text: ' https://proof.test/ada ' }, mapping)).toBe(
            'https://proof.test/ada'
        );
        expect(
            credentialRowProblems(mapped.template, { [mapping.variable]: 'https://proof.test/a b' })
        ).toContain('evidence');
        mapped.template.credentialSubject.evidence![0].evidenceUrl = {
            isDynamic: false,
            value: 'urn:uuid:7e23ea3c-5df3-4fa8-b378-f47a1e987234',
            variableName: '',
        };
        expect(credentialRowProblems(mapped.template, {})).toEqual([]);
    });

    it('keeps source rows aligned after an external email-matched upload adds a column', () => {
        const state = sample();
        const sheet = parseSpreadsheet(
            readSpreadsheetText('Email,Extra Field\na@test.com,New value')
        );
        const updated = mergeSpreadsheet(state.draft, sheet, []).draft;
        const mapped = mapSpreadsheetColumn(
            state.template,
            updated,
            updated.source!.columns[1],
            'description',
            options
        );
        expect(mapped.draft.values[updated.recipients[0].rowId!][mapped.variable]).toBe(
            'New value'
        );
    });

    it('removes a selected chip without losing other fields or original cells', () => {
        const original = sample();
        const percent = mapSpreadsheetColumn(
            original.template,
            original.draft,
            original.draft.source!.columns[2],
            'Percent',
            options
        );
        const credits = mapSpreadsheetColumn(
            percent.template,
            percent.draft,
            percent.draft.source!.columns[4],
            'credits',
            options
        );
        const removed = removeSpreadsheetMapping(credits.template, credits.draft, percent.variable);
        expect(removed.template.credentialSubject.result).toEqual([]);
        expect(removed.template.credentialSubject.creditsEarned?.variableName).toBe(
            credits.variable
        );
        expect(removed.draft.source).toBe(credits.draft.source);
        expect(removed.draft.values).toEqual(credits.draft.values);
    });

    it('re-uploads original column labels and app exports using the same field binding and row IDs', () => {
        const original = sample();
        const state = mapSpreadsheetColumn(
            original.template,
            original.draft,
            original.draft.source!.columns[2],
            'Percent',
            options
        );
        const next = parseSpreadsheet(readSpreadsheetText('Email,Percent\na@test.com,75%'));
        const merged = mergeSpreadsheet(state.draft, next, [state.variable]);
        expect(merged.draft.recipients).toHaveLength(2);
        expect(merged.draft.values[merged.draft.recipients[0].rowId!][state.variable]).toBe('75');
        const exported = exportRosterCsv(
            merged.draft,
            [state.variable],
            { [state.variable]: 'perRecipient' },
            {}
        );
        const roundtrip = mergeSpreadsheet(
            merged.draft,
            parseSpreadsheet(readSpreadsheetText(exported)),
            [state.variable]
        );
        expect(roundtrip.draft.values).toEqual(merged.draft.values);
    });
});

describe('source identity across reimports', () => {
    const credits = () => {
        const state = sample();
        return mapSpreadsheetColumn(
            state.template,
            state.draft,
            state.draft.source!.columns[4],
            'credits',
            options
        );
    };
    it('retains credits through export, reimport, and a credential type change', () => {
        const state = credits();
        const csv = exportRosterCsv(
            state.draft,
            [state.variable],
            { [state.variable]: 'perRecipient' },
            {}
        );
        const draft = mergeSpreadsheet(state.draft, parseSpreadsheet(readSpreadsheetText(csv)), [
            state.variable,
        ]).draft;
        const replaced = replaceSpreadsheetTemplate(makeRun(0).template, draft, true);
        expect(replaced.draft.mappings).toHaveLength(1);
        const row = replaced.draft.recipients[1].rowId!;
        const json = materializePreview(
            applyVariableValues(templateToJson(replaced.template), replaced.draft.values[row])
        );
        expect(json.credentialSubject).toMatchObject({ creditsEarned: 3 });
        expect(draft.mappings![0].columnId).toBe('column-2');
    });
    it('uses Credits identity rather than Code at its former position after a reorder', () => {
        const state = credits();
        const sheet = parseSpreadsheet(
            readSpreadsheetText(
                'Email,Credits,Name,Other,Code\na@test.com,3,Ada,x,0012\nb@test.com,4,Bob,x,0009'
            )
        );
        const draft = mergeSpreadsheet(state.draft, sheet, [state.variable]).draft;
        const replaced = replaceSpreadsheetTemplate(makeRun(0).template, draft, true);
        const variable = replaced.draft.mappings![0].variable;
        // Import once more after switching types: no accidental Code binding.
        const again = mergeSpreadsheet(replaced.draft, sheet, [variable]).draft;
        expect(again.values[again.recipients[0].rowId!][variable]).toBe('3');
        expect(replaced.draft.mappings![0]).toMatchObject({
            label: 'Credits',
            columnId: 'column-1',
        });
    });
    it('preserves canonical Evidence aliases and their original credential labels on a type change', () => {
        const original = sample();
        const sheet = parseSpreadsheet(
            readSpreadsheetText('Email,Evidence\na@test.com,https://proof.test/ada')
        );
        const draft = mergeSpreadsheet(makeRun(0).draft, sheet, []).draft;
        const state = mapSpreadsheetColumn(
            original.template,
            draft,
            sheet.columns[1],
            'evidence',
            options
        );
        const csv = exportRosterCsv(
            state.draft,
            [state.variable],
            { [state.variable]: 'perRecipient' },
            {}
        );
        const imported = mergeSpreadsheet(state.draft, parseSpreadsheet(readSpreadsheetText(csv)), [
            state.variable,
        ]).draft;
        const replaced = replaceSpreadsheetTemplate(makeRun(0).template, imported, true);
        const json = materializePreview(
            applyVariableValues(
                templateToJson(replaced.template),
                replaced.draft.values[replaced.draft.recipients[0].rowId!]
            )
        );
        expect(json.evidence).toEqual([
            expect.objectContaining({ id: 'https://proof.test/ada', name: 'Evidence' }),
        ]);
    });
    it('uses normalized formats after canonical export instead of reinterpreting comma decimals', () => {
        const sheet = parseSpreadsheet(
            readSpreadsheetText('Email,Credits,Completed Date\na@test.com,"1,5",04/03/2024')
        );
        const run = makeRun(0);
        let state = { template: run.template, draft: mergeSpreadsheet(run.draft, sheet, []).draft };
        for (const [index, target] of [
            [1, 'credits'],
            [2, 'awardedDate'],
        ] as const)
            state = mapSpreadsheetColumn(
                state.template,
                state.draft,
                sheet.columns[index],
                target,
                { numericFormat: 'comma', dateFormat: 'dmy' }
            );
        const variables = state.draft.mappings!.map(mapping => mapping.variable);
        const csv = exportRosterCsv(
            state.draft,
            variables,
            Object.fromEntries(variables.map(name => [name, 'perRecipient' as const])),
            {}
        );
        const imported = mergeSpreadsheet(
            state.draft,
            parseSpreadsheet(
                readSpreadsheetText(csv + '\r\nb@test.com,Bob,2.5,2024-03-05T00:00:00.000Z,,,,,')
            ),
            variables
        ).draft;
        const replaced = replaceSpreadsheetTemplate(makeRun(0).template, imported, true);
        const json = materializePreview(
            applyVariableValues(
                templateToJson(replaced.template),
                replaced.draft.values[replaced.draft.recipients[0].rowId!]
            )
        );
        expect(json.credentialSubject).toMatchObject({ creditsEarned: 1.5 });
        expect(json.awardedDate).toBe('2024-03-04T00:00:00.000Z');
        // A newly added export row has no saved identity, but uses the export's normalized format.
        const added = materializePreview(
            applyVariableValues(
                templateToJson(replaced.template),
                replaced.draft.values[replaced.draft.recipients[1].rowId!]
            )
        );
        expect(added.credentialSubject).toMatchObject({ creditsEarned: 2.5 });
        expect(added.awardedDate).toBe('2024-03-05T00:00:00.000Z');
    });
    it('rejects a missing selected source column instead of silently dropping the mapping', () => {
        const state = credits();
        expect(() =>
            mergeSpreadsheet(
                state.draft,
                parseSpreadsheet(readSpreadsheetText('Email,Code\na@test.com,0012')),
                [state.variable]
            )
        ).toThrow();
        expect(state.draft.mappings![0].label).toBe('Credits');
        const missing = { ...state.draft, source: { ...state.draft.source!, columns: [] } };
        expect(() => replaceSpreadsheetTemplate(makeRun(0).template, missing, true)).toThrow();
    });
    it('does not block import on stale metadata after a mapped field was explicitly removed', () => {
        const state = credits();
        // The JSON editor can remove the dynamic field, leaving no active variable.
        const draft = mergeSpreadsheet(
            state.draft,
            parseSpreadsheet(readSpreadsheetText('Email,Code\na@test.com,0012')),
            []
        ).draft;
        expect(draft.mappings).toEqual([]);
        expect(draft.source!.columns[1].label).toBe('Code');
    });
    it('repairs positional IDs from older saved drafts by column identity', () => {
        const state = credits();
        state.draft.mappings![0].columnId = 'column-8'; // Student Code, never Credits.
        const replaced = replaceSpreadsheetTemplate(makeRun(0).template, state.draft, true);
        expect(replaced.draft.mappings![0].columnId).toBe('column-4');
    });
});

describe('template replacement boundaries', () => {
    it('reapplies mappings to a new type, retaining corrected cells but dropping unrelated values', () => {
        const original = sample();
        const mapped = mapSpreadsheetColumn(
            original.template,
            original.draft,
            original.draft.source!.columns[4],
            'credits',
            options
        );
        const row = mapped.draft.recipients[0].rowId!;
        mapped.draft.values[row] = { [mapped.variable]: '1.5', stale_score: '99' };
        const replaced = replaceSpreadsheetTemplate(
            structuredClone(original.template),
            mapped.draft,
            true
        );
        const variable = replaced.draft.mappings![0].variable;
        expect(replaced.template.credentialSubject.creditsEarned?.variableName).toBe(variable);
        expect(replaced.draft.values[row]).toEqual({ [variable]: '1.5' });
        expect(credentialRowProblems(replaced.template, replaced.draft.values[row])).toEqual([]);
    });
    it('clears old mappings and values on explicit credential import while keeping source cells', () => {
        const original = sample();
        const mapped = mapSpreadsheetColumn(
            original.template,
            original.draft,
            original.draft.source!.columns[2],
            'Percent',
            options
        );
        const replaced = replaceSpreadsheetTemplate(original.template, mapped.draft, false);
        expect(replaced.draft.mappings).toEqual([]);
        expect(replaced.draft.values).toEqual({});
        expect(replaced.draft.source).toBe(mapped.draft.source);
        expect(replaced.template.credentialSubject.result).toBeUndefined();
    });
    it('removes generated labels from an edited description without deleting adjacent notes', () => {
        const original = sample();
        const mapped = mapSpreadsheetColumn(
            original.template,
            original.draft,
            original.draft.source!.columns[8],
            'description',
            options
        );
        mapped.template.credentialSubject.achievement.description.value += ' Custom note';
        const removed = removeSpreadsheetMapping(mapped.template, mapped.draft, mapped.variable);
        expect(removed.template.credentialSubject.achievement.description.value).toContain(
            'Custom note'
        );
        expect(removed.template.credentialSubject.achievement.description.value).not.toContain(
            'Student Code:'
        );
        expect(removed.template.credentialSubject.achievement.description.value).not.toContain(
            mapped.variable
        );
    });
    it('suggests Credit Points as credits rather than a score', () => {
        expect(suggestMapping({ id: 'credit', index: 0, label: 'Credit Points' }, [])).toBe(
            'credits'
        );
    });
});
