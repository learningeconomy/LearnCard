import { describe, it, expect } from 'vitest';
import { utils, write } from 'xlsx';
import {
    parseSpreadsheet,
    readSpreadsheetText,
    looksLikeSpreadsheet,
    SPREADSHEET_LIMITS,
} from './parseSpreadsheet';
import { readXlsx } from './readXlsx';
import { mergeSpreadsheet, exportRosterCsv, getRowProblems } from './roster';
import { makeRun } from './fixtures.test-support';

const parse = (text: string) => parseSpreadsheet(readSpreadsheetText(text));
describe('spreadsheet parsing and editable roster', () => {
    it('reads 250 quoted rows, BOM, preamble, normalized emails and trailing Total', () => {
        const sheet = parse(
            '\uFEFFClass roster\n\nFirst Name,Last Name,Student Email,Final Score\n' +
                Array.from(
                    { length: 250 },
                    (_, i) => `"Person, ${i}",Last, USER${i}@EXAMPLE.COM ,${i}`
                ).join('\n') +
                '\nTotal,,,31125\n'
        );
        expect(sheet.rows).toHaveLength(250);
        expect(sheet.rows[0]).toMatchObject({
            email: 'user0@example.com',
            displayName: 'Person, 0 Last',
        });
        expect(sheet.skipped).toBe(5);
    });
    it('detects headerless TSV and multiline URL-first spreadsheet cells', () => {
        expect(parse('ada@test.com\tAda\t95\ngrace@test.com\tGrace\t90').rows).toHaveLength(2);
        expect(
            looksLikeSpreadsheet(
                'https://proof.test/a\tada@test.com\nhttps://proof.test/b\tgrace@test.com'
            )
        ).toBe(true);
    });
    it('asks for an email column when student and guardian values are equally plausible', () => {
        const source = readSpreadsheetText(
            'Student Email,Guardian Email\na@test.com,g@test.com\nb@test.com,h@test.com'
        );
        expect(parseSpreadsheet(source).emailColumn).toBeUndefined();
        expect(parseSpreadsheet(source, { emailColumn: 0 }).rows.map(row => row.email)).toEqual([
            'a@test.com',
            'b@test.com',
        ]);
    });
    it('retains invalid initial rows and a person named Total', () => {
        const sheet = parse('Email,Name\nwrong,Invalid\na@test.com,Total\nb@test.com,Bob');
        expect(sheet.rows).toHaveLength(3);
        expect(sheet.rows[0].email).toBe('wrong');
    });
    it('rejects malformed quoting and file/column limits', () => {
        expect(() => parse('Email,Name\n"never closed')).toThrow('malformed');
        expect(() => parse('x'.repeat(SPREADSHEET_LIMITS.bytes + 1))).toThrow('limit');
        expect(() => parse(Array(201).fill('column').join(','))).toThrow('limit');
    });
    it('preserves formatted XLSX values and missing formula results, ignoring hidden sheets', () => {
        const wb = utils.book_new();
        const sheet = utils.aoa_to_sheet([
            ['Email', 'Score', 'Date', 'Missing'],
            ['a@test.com', 0.95, 45000, ''],
        ]);
        sheet.B2.z = '0%';
        sheet.C2.z = 'yyyy-mm-dd';
        sheet.D2 = { t: 'n', f: 'SUM(A1:A2)' };
        utils.book_append_sheet(wb, sheet, 'People');
        utils.book_append_sheet(wb, utils.aoa_to_sheet([['hidden']]), 'Hidden');
        wb.Workbook = {
            Sheets: [
                { name: 'People', Hidden: 0 },
                { name: 'Hidden', Hidden: 1 },
            ],
        };
        const source = readXlsx(write(wb, { type: 'array', bookType: 'xlsx' }), 'people.xlsx');
        expect(Object.keys(source.sheets)).toEqual(['People']);
        const cells = source.sheets.People[1];
        expect(cells[1]).toMatchObject({ text: '95%', value: 0.95, percent: true });
        expect(cells[2].date).toBe('2023-03-15');
        expect(cells[3].problem).toBe('formula');
    });
    it('normalizes placeholder headers, preserves duplicates and validates evidence', () => {
        const run = makeRun(0);
        const { draft, mapped } = mergeSpreadsheet(
            run.draft,
            parse(
                'Email,Final_Score,Evidence\n A@TEST.COM ,95,https://proof.test/a\na@test.com,90,https://'
            ),
            ['final score']
        );
        expect(mapped).toEqual(['final score']);
        expect(draft.recipients).toHaveLength(2);
        const problems = getRowProblems(
            draft.recipients,
            ['final score'],
            { 'final score': 'perRecipient' },
            {},
            draft.values,
            draft.evidence
        );
        expect(Object.values(problems)).toEqual([['duplicate'], ['duplicate', 'evidence']]);
    });
    it('round-trips stable row IDs after email correction and formula escaping', () => {
        const run = makeRun();
        run.draft.values = { 'row-0': { score: '=2+3' } };
        const csv = exportRosterCsv(run.draft, ['score'], { score: 'perRecipient' }, {}).replace(
            'person0@test.com',
            'corrected@test.com'
        );
        expect(csv).toContain("'=2+3");
        const merged = mergeSpreadsheet(run.draft, parse(csv), ['score']);
        expect(merged.draft.recipients).toHaveLength(1);
        expect(merged.draft.recipients[0]).toMatchObject({
            rowId: 'row-0',
            email: 'corrected@test.com',
        });
        expect(merged.draft.values['row-0'].score).toBe('=2+3');
        expect(() =>
            mergeSpreadsheet({ ...run.draft, id: 'other' }, parse(csv), ['score'])
        ).toThrow('run');
    });
    it('excludes example rows and rejects duplicate normalized variable headers', () => {
        const run = makeRun(0);
        expect(
            mergeSpreadsheet(run.draft, parse(exportRosterCsv(run.draft, ['score'], {}, {})), [
                'score',
            ]).draft.recipients
        ).toHaveLength(0);
        expect(() =>
            mergeSpreadsheet(run.draft, parse('Email,Final Score,final_score\na@test.com,95,90'), [
                'final score',
            ])
        ).toThrow('mapping');
    });
});
