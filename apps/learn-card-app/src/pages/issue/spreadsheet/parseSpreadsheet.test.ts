import canvasGradebook from './fixtures/canvas-gradebook.csv?raw';
import { describe, it, expect } from 'vitest';
import { utils, write } from 'xlsx';
import JSZip from 'jszip';
import Papa from 'papaparse';
import {
    parseSpreadsheet,
    readSpreadsheetFile,
    readSpreadsheetText,
    looksLikeSpreadsheet,
    SPREADSHEET_LIMITS,
} from './parseSpreadsheet';
import { readXlsx } from './readXlsx';
import { mergeSpreadsheet, exportRosterCsv, getRowProblems } from './roster';
import { makeRun } from './fixtures.test-support';

const parse = (text: string) => parseSpreadsheet(readSpreadsheetText(text));
describe('spreadsheet parsing and editable roster', () => {
    it('handles the upstream Canvas gradebook header and metadata without guessing login IDs are emails', () => {
        const source = readSpreadsheetText(canvasGradebook, 'canvas.csv');
        const withoutEmails = parseSpreadsheet(source);
        expect(withoutEmails.emailColumn).toBeUndefined();
        expect(withoutEmails.rows).toEqual([]);
        expect(withoutEmails.columns[2].label).toBe('SIS Login ID');
        const withEmails = structuredClone(source);
        withEmails.sheets.Sheet1.slice(2).forEach((row, index) => {
            if (!row.some(cell => cell.text.trim())) return;
            row[2] = { text: `person${index}@example.test` };
            row[6] = { text: String(90 + index) };
        });
        const parsed = parseSpreadsheet(withEmails);
        expect(parsed.rows).toHaveLength(7);
        expect(parsed.rows[0]).toMatchObject({
            displayName: 'Blend, Bill',
            email: 'person0@example.test',
        });
        expect(parsed.rows[0].cells['column-6'].text).toBe('90');
        expect(parsed.rows.some(row => row.displayName === 'Points Possible')).toBe(false);
    });
    it('reads UTF-8 names losslessly and rejects legacy CSV bytes before import', async () => {
        const file = (bytes: Uint8Array): File =>
            ({
                name: 'people.csv',
                size: bytes.length,
                arrayBuffer: async () => bytes.slice().buffer,
            }) as File;
        const utf8 = new TextEncoder().encode('Email,Name\na@test.com,José');
        const valid = parseSpreadsheet(await readSpreadsheetFile(file(utf8)));
        expect(valid.rows[0].displayName).toBe('José');
        const legacy = new Uint8Array([
            ...new TextEncoder().encode('Email,Name\na@test.com,Jos'),
            0xe9,
        ]);
        await expect(readSpreadsheetFile(file(legacy))).rejects.toThrow('encoding');
        expect(() => readSpreadsheetText('Email,Name\na@test.com,Jos\uFFFD')).toThrow('encoding');
    });
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
    it('bounds expanded cells across visible XLSX worksheets', () => {
        const workbook = utils.book_new();
        for (const name of ['One', 'Two'])
            utils.book_append_sheet(
                workbook,
                utils.aoa_to_sheet([
                    ['Email', 'Name'],
                    ['a@test.com', 'Ada'],
                ]),
                name
            );
        const limit = SPREADSHEET_LIMITS.cells;
        try {
            SPREADSHEET_LIMITS.cells = 6;
            expect(() =>
                readXlsx(write(workbook, { type: 'array', bookType: 'xlsx' }), 'many.xlsx')
            ).toThrow('limit');
        } finally {
            SPREADSHEET_LIMITS.cells = limit;
        }
    });

    it('ignores a full-sheet formatting range but still rejects distant actual data', async () => {
        const workbook = utils.book_new();
        const sheet = utils.aoa_to_sheet([
            ['Email', 'Score'],
            ['a@test.com', 0],
        ]);
        utils.book_append_sheet(workbook, sheet, 'People');
        const zip = await JSZip.loadAsync(write(workbook, { type: 'array', bookType: 'xlsx' }));
        const path = 'xl/worksheets/sheet1.xml';
        const xml = (await zip.file(path)!.async('string')).replace(
            /<dimension ref="[^"]+"\/>/,
            '<dimension ref="A1:XFD1048576"/>'
        );
        zip.file(path, xml);
        const bytes = await zip.generateAsync({ type: 'arraybuffer' });
        const parsed = parseSpreadsheet(readXlsx(bytes, 'formatted.xlsx'));
        expect(parsed.rows).toHaveLength(1);
        expect(parsed.rows[0].cells['column-1'].text).toBe('0');
        zip.file(
            path,
            xml.replace(
                '</sheetData>',
                '<row r="1048576"><c r="XFD1048576"><v>1</v></c></row></sheetData>'
            )
        );
        const tooFar = await zip.generateAsync({ type: 'arraybuffer' });
        expect(() => readXlsx(tooFar, 'too-far.xlsx')).toThrow('bounds');
        try {
            readXlsx(tooFar, 'too-far.xlsx');
        } catch (error) {
            expect(error).toMatchObject({ code: 'bounds', cell: 'People!XFD1048576' });
        }
    });
    it('blocks duplicate profiles even when their stable row IDs differ', () => {
        const rows = ['first', 'second'].map(rowId => ({
            kind: 'profile' as const,
            rowId,
            profileId: 'same-profile',
            displayName: 'Person',
        }));
        expect(getRowProblems(rows, [], {}, {}, {}, {})).toEqual({
            first: ['duplicate'],
            second: ['duplicate'],
        });
    });
    it.each([
        { t: 'n', f: '1/0', expected: '', problems: ['required', 'formula'] },
        { t: 'e', f: '1/0', v: 7, expected: '#DIV/0!', problems: ['formula'] },
        { t: 'e', f: 'A99', v: 23, expected: '#REF!', problems: ['formula'] },
        { t: 'n', f: 'SUM(90,5)', v: 95, expected: '95', problems: [] },
    ] as const)('validates imported XLSX formula results: $expected', cell => {
        const workbook = utils.book_new();
        const worksheet = utils.aoa_to_sheet([
            ['Email', 'Score'],
            ['a@test.com', ''],
        ]);
        worksheet.B2 = { t: cell.t, f: cell.f, ...('v' in cell ? { v: cell.v } : {}) };
        utils.book_append_sheet(workbook, worksheet, 'People');
        const source = readXlsx(
            write(workbook, { type: 'array', bookType: 'xlsx' }),
            'people.xlsx'
        );
        const { draft } = mergeSpreadsheet(makeRun(0).draft, parseSpreadsheet(source), ['score']);
        const key = draft.recipients[0].rowId!;
        const problems = () =>
            getRowProblems(
                draft.recipients,
                ['score'],
                { score: 'perRecipient' },
                {},
                draft.values,
                draft.evidence,
                draft.formulaCells
            );

        expect(draft.values[key].score).toBe(cell.expected);
        expect(problems()[key]).toEqual(cell.problems);
        // An actual edit resolves the problem; a nonblank XLSX error is never valid by itself.
        draft.values[key].score = '95';
        expect(problems()[key]).toEqual([]);
    });
    it('clears formula flags on corrected re-import and retains flags on untouched rows', () => {
        const original = makeRun(2).draft;
        original.values = { 'row-0': { score: '#REF!' }, 'row-1': { score: '#DIV/0!' } };
        original.formulaCells = {
            'row-0': { score: '#REF!' },
            'row-1': { score: '#DIV/0!' },
        };
        const { draft } = mergeSpreadsheet(original, parse('Email,Score\nperson0@test.com,95'), [
            'score',
        ]);
        expect(
            getRowProblems(
                draft.recipients,
                ['score'],
                { score: 'perRecipient' },
                {},
                draft.values,
                draft.evidence,
                draft.formulaCells
            )
        ).toEqual({ 'row-0': [], 'row-1': ['formula'] });
        expect(draft.formulaCells?.['row-0']).toEqual({});
        expect(original.formulaCells['row-0']).toEqual({ score: '#REF!' });
    });
    it('retains unresolved XLSX errors through an unchanged app CSV roundtrip', () => {
        const original = makeRun(2).draft;
        original.values = { 'row-0': { score: '#REF!' }, 'row-1': { score: '#DIV/0!' } };
        original.evidence = { 'row-0': '#REF!' };
        original.formulaCells = {
            'row-0': { score: '#REF!', Evidence: '#REF!' },
            'row-1': { score: '#DIV/0!' },
        };
        const csv = exportRosterCsv(original, ['score'], { score: 'perRecipient' }, {});
        const unchanged = mergeSpreadsheet(original, parse(csv), ['score']).draft;
        expect(unchanged.formulaCells).toEqual(original.formulaCells);
        const corrected = mergeSpreadsheet(unchanged, parse(csv.replaceAll('#REF!', '95')), [
            'score',
        ]).draft;
        expect(corrected.formulaCells).toEqual({ 'row-0': {}, 'row-1': { score: '#DIV/0!' } });
        expect(original.formulaCells['row-0'].score).toBe('#REF!');
    });
    it.each(['+ada@example.com', '-ada@example.com', "'+ada@example.com"])(
        'round-trips the exact recipient address %s without decoding unrelated CSV input',
        email => {
            const original = makeRun().draft;
            original.recipients[0] = { kind: 'email', rowId: 'row-0', email, displayName: 'Ada' };
            const csv = exportRosterCsv(original, [], {}, {});
            const restored = mergeSpreadsheet(original, parse(csv), []).draft;
            expect(restored.recipients).toEqual(original.recipients);
            const arbitrary = mergeSpreadsheet(
                makeRun(0).draft,
                parse(`Email\n"'+ada@example.com"`),
                []
            ).draft;
            expect(arbitrary.recipients[0]).toMatchObject({ email: "'+ada@example.com" });
        }
    );
    it.each([
        "'=SUM(A1:A2)",
        "''=SUM(A1:A2)",
        "'plain",
        '=SUM(A1:A2)',
        '+note',
        '-42',
        '@coach',
        '\ttext',
        '\rtext',
    ])('round-trips literal credential text %j without losing or adding apostrophes', value => {
        const draft = makeRun().draft;
        draft.values = { 'row-0': { score: value } };
        const csv = exportRosterCsv(draft, ['score'], { score: 'perRecipient' }, {});
        const imported = mergeSpreadsheet(draft, parse(csv), ['score']).draft;
        expect(imported.values).toEqual(draft.values);
        expect(mergeSpreadsheet(imported, imported.source!, ['score']).draft.values).toEqual(
            draft.values
        );
    });
    it.each([
        ["'=NEW(A1)", "''=NEW(A1)"],
        ["''literal", "'''literal"],
        ['=NEW(A1)', "'=NEW(A1)"],
        ['+new', "'+new"],
    ])('decodes edited versioned CSV cells reversibly: %j', (value, encoded) => {
        const draft = makeRun().draft;
        draft.values = { 'row-0': { score: 'Original' } };
        const csv = exportRosterCsv(draft, ['score'], { score: 'perRecipient' }, {});
        const imported = mergeSpreadsheet(draft, parse(csv.replace('Original', encoded)), [
            'score',
        ]).draft;
        expect(imported.values['row-0'].score).toBe(value);
    });
    it.each(["'=SUM(A1:A2)", '=SUM(A1:A2)', "'plain"])(
        'decodes copied versioned rows before matching or adding recipients: %j',
        value => {
            const draft = makeRun().draft;
            draft.recipients[0] = {
                kind: 'email',
                rowId: 'row-0',
                email: '+ada@example.com',
                displayName: 'Ada',
            };
            draft.values = { 'row-0': { score: value } };
            const exported = Papa.parse<Record<string, string>>(
                exportRosterCsv(draft, ['score'], { score: 'perRecipient' }, {}),
                { header: true, skipEmptyLines: true }
            ).data;
            const copied = {
                ...exported[0],
                'Recipient Email': "'+bob@example.com",
                __lc_row_id: '',
            };
            const csv = Papa.unparse([...exported, copied]);
            const imported = mergeSpreadsheet(draft, parse(csv), ['score']).draft;
            expect(imported.recipients).toHaveLength(2);
            const added = imported.recipients[1];
            expect(added).toMatchObject({ kind: 'email', email: '+bob@example.com' });
            const addedKey = added.kind === 'email' ? added.rowId! : '';
            expect(imported.values[addedKey].score).toBe(value);
            expect(mergeSpreadsheet(imported, imported.source!, ['score']).draft.values).toEqual(
                imported.values
            );
            const matched = mergeSpreadsheet(imported, parse(csv), ['score']).draft;
            expect(matched.recipients).toHaveLength(2);
            expect(matched.recipients[1]).toEqual(added);
            const external = { ...copied, __lc_run_id: '' };
            const unmarked = mergeSpreadsheet(makeRun(0).draft, parse(Papa.unparse([external])), [
                'score',
            ]).draft;
            expect(unmarked.recipients[0]).toMatchObject({ email: "'+bob@example.com" });
            expect(Object.values(unmarked.values)[0].score).toBe(copied.score);
            expect(() =>
                mergeSpreadsheet(makeRun(0).draft, parse(Papa.unparse([copied])), ['score'])
            ).toThrow('run');
        }
    );
    it.each(["'=SUM(A1:A2)", '=SUM(A1:A2)', "'plain"])(
        'restores legacy exports only when the saved value proves the encoding: %j',
        value => {
            const draft = makeRun().draft;
            draft.values = { 'row-0': { score: value } };
            const escaped = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
            const legacy = `Recipient Email,score,__lc_run_id,__lc_row_id\nperson0@test.com,${escaped},${draft.id},row-0`;
            expect(mergeSpreadsheet(draft, parse(legacy), ['score']).draft.values).toEqual(
                draft.values
            );
            const edited = legacy.replace(escaped, "'=NEW(A1)");
            expect(
                mergeSpreadsheet(draft, parse(edited), ['score']).draft.values['row-0'].score
            ).toBe("'=NEW(A1)");
        }
    );
    it('normalizes placeholder headers, preserves duplicates and leaves evidence opt-in', () => {
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
        expect(Object.values(problems)).toEqual([['duplicate'], ['duplicate']]);
        expect(draft.evidence).toEqual({});
        expect(draft.source!.rows[1].cells['column-2'].text).toBe('https://');
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
