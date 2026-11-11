import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import googleCsv from './fixtures/google-sheets-roster.csv?raw';
import { readXlsx } from './readXlsx';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import { mergeSpreadsheet } from './roster';
import { makeRun } from './fixtures.test-support';
import {
    credentialRowProblems,
    mapSpreadsheetColumn,
    materializePreview,
    suggestMapping,
} from './columnMapping';
import { templateToJson } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { validateCredentialJsonLd } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import { applyVariableValues } from '../components/variableSubstitution';

describe('files exported by Google Sheets (see fixtures/README.md)', () => {
    it.each(['csv', 'xlsx'] as const)('preserves and maps the actual %s export', async format => {
        // Keep the downloaded XLSX bytes intact: rewriting them with SheetJS would
        // test our writer instead of the producer's date, style and numeric encoding.
        const source =
            format === 'csv'
                ? readSpreadsheetText(googleCsv, 'google-sheets-roster.csv')
                : readXlsx(
                      new Uint8Array(
                          readFileSync(
                              resolve(
                                  process.cwd(),
                                  'src/pages/issue/spreadsheet/fixtures/google-sheets-roster.xlsx'
                              )
                          )
                      ).buffer,
                      'google-sheets-roster.xlsx'
                  );
        const parsed = parseSpreadsheet(source);
        expect(parsed.rows.map(row => [row.email, row.displayName])).toEqual([
            ['ada@example.test', 'Ada Rivera'],
            ['bao@example.test', 'Bao Patel'],
        ]);
        const run = makeRun(0);
        let state = {
            template: run.template,
            draft: mergeSpreadsheet(run.draft, parsed, []).draft,
        };
        for (const column of parsed.columns.slice(2)) {
            const target = suggestMapping(
                column,
                parsed.rows.map(row => row.cells[column.id])
            );
            state = mapSpreadsheetColumn(state.template, state.draft, column, target, {
                dateFormat: 'iso',
                numericFormat: 'dot',
            });
        }
        for (const [index, row] of state.draft.recipients.entries()) {
            const values = state.draft.values[row.rowId!];
            expect(credentialRowProblems(state.template, values)).toEqual([]);
            const json = materializePreview(
                applyVariableValues(templateToJson(state.template), values)
            );
            expect(json).toMatchObject({
                credentialSubject: {
                    result: [
                        { value: index === 0 ? '95' : '85' },
                        { value: index === 0 ? 'A-' : 'B+' },
                    ],
                    creditsEarned: index === 0 ? 1.5 : 0,
                    achievement: {
                        description: `Description\nStudent Code: ${index === 0 ? '0012' : '0009'}\nHours: ${index === 0 ? '12' : '8'}`,
                    },
                },
                awardedDate: `2026-10-0${index + 1}T00:00:00.000Z`,
                evidence: [
                    {
                        id: `https://example.org/${index === 0 ? 'ada' : 'bao'}`,
                        type: ['Evidence'],
                    },
                ],
            });
            expect(await validateCredentialJsonLd(json)).toEqual({ valid: true, errors: [] });
        }
    });
});
