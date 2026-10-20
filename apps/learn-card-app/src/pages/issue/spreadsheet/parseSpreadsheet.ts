import Papa from 'papaparse';
import { ContactMethodQueryValidator } from '@learncard/types';
import {
    EXPORT_EXAMPLE_COLUMN,
    EXPORT_ROW_COLUMN,
    EXPORT_RUN_COLUMN,
    normalizeColumn,
    normalizeEmail,
    type ParsedSpreadsheet,
    type SpreadsheetCell,
    type SpreadsheetSource,
} from './types';

export const SPREADSHEET_LIMITS = {
    bytes: 10 * 1024 * 1024,
    rows: 10_000,
    columns: 200,
    cells: 2_000_000,
};

export type SpreadsheetErrorCode =
    'file' | 'limit' | 'malformed' | 'emailColumn' | 'mapping' | 'run';

export class SpreadsheetError extends Error {
    constructor(readonly code: SpreadsheetErrorCode) {
        super(code);
        this.name = 'SpreadsheetError';
    }
}

export const isValidRosterEmail = (value: string): boolean =>
    ContactMethodQueryValidator.safeParse({ type: 'email', value: normalizeEmail(value) }).success;

export const readSpreadsheetText = (text: string, name = 'spreadsheet.csv'): SpreadsheetSource => {
    if (new TextEncoder().encode(text).length > SPREADSHEET_LIMITS.bytes)
        throw new SpreadsheetError('limit');
    const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), {
        header: false,
        dynamicTyping: false,
        delimiter: name.toLowerCase().endsWith('.tsv') ? '\t' : '',
        delimitersToGuess: [',', '\t', ';'],
    });
    if (parsed.errors.some(error => error.code === 'MissingQuotes'))
        throw new SpreadsheetError('malformed');
    const matrix = parsed.data.map(row => row.map(value => ({ text: value ?? '' })));
    checkMatrixLimits(matrix);
    return { name, sheets: { Sheet1: matrix } };
};

export const checkMatrixLimits = (matrix: SpreadsheetCell[][]): void => {
    if (
        matrix.length > SPREADSHEET_LIMITS.rows + 100 ||
        matrix.some(row => row.length > SPREADSHEET_LIMITS.columns)
    )
        throw new SpreadsheetError('limit');
};

export const readSpreadsheetFile = async (file: File): Promise<SpreadsheetSource> => {
    if (file.size > SPREADSHEET_LIMITS.bytes) throw new SpreadsheetError('limit');
    if (/\.xlsx$/i.test(file.name)) {
        const { readXlsx } = await import('./readXlsx');
        return readXlsx(await file.arrayBuffer(), file.name);
    }
    if (!/\.(csv|tsv)$/i.test(file.name)) throw new SpreadsheetError('file');
    return readSpreadsheetText(await file.text(), file.name);
};

/** Multi-line cells are a roster candidate, never a hosted-credential URL. */
export const looksLikeSpreadsheet = (text: string): boolean => {
    const lines = text.trim().split(/\r?\n/);
    return (
        lines.length > 1 &&
        (lines.some(line => line.includes('\t') || line.includes(',')) ||
            lines.some(line => isValidRosterEmail(line)))
    );
};

const lastIndex = <T>(items: T[], predicate: (item: T) => boolean): number => {
    for (let index = items.length - 1; index >= 0; index--)
        if (predicate(items[index]!)) return index;
    return -1;
};

const blank = (row: SpreadsheetCell[]): boolean => row.every(cell => !cell.text.trim());
const headerWords =
    /^(email|emailaddress|studentemail|recipientemail|recipient|name|fullname|firstname|lastname|score|grade|hours|credits|evidence|portfolio)$/;

export const parseSpreadsheet = (
    source: SpreadsheetSource,
    options: { sheetName?: string; emailColumn?: number; headerRow?: number } = {}
): ParsedSpreadsheet => {
    const sheetName = options.sheetName ?? Object.keys(source.sheets)[0] ?? '';
    const matrix = source.sheets[sheetName];
    if (!matrix) throw new SpreadsheetError('file');
    checkMatrixLimits(matrix);
    const width = Math.max(0, ...matrix.map(row => row.length));
    const sample = matrix.filter(row => !blank(row)).slice(0, 200);
    const scores = Array.from({ length: width }, (_, index) => {
        const cells = sample.map(row => row[index]?.text ?? '').filter(value => value.trim());
        return { index, count: cells.filter(isValidRosterEmail).length, total: cells.length };
    }).sort((a, b) => b.count - a.count);
    const best = scores[0];
    const emailCandidates = scores.filter(score => score.count > 0).map(score => score.index);
    const confident =
        best &&
        best.count > 0 &&
        best.count / best.total >= 0.5 &&
        best.count > (scores[1]?.count ?? 0);
    const emailColumn = options.emailColumn ?? (confident ? best.index : undefined);
    const firstEmailRow =
        emailColumn === undefined
            ? -1
            : matrix.findIndex(row => isValidRosterEmail(row[emailColumn]?.text ?? ''));
    // A misspelled address is data, not a header. Header recognition only discards
    // known labels, with a manual header/start chooser for arbitrary title layouts.
    const inferredHeader = lastIndex(
        matrix.slice(0, firstEmailRow < 0 ? 25 : firstEmailRow),
        row =>
            row.filter(cell => headerWords.test(normalizeColumn(cell.text))).length >= 2 ||
            (emailColumn !== undefined &&
                /^(email|emailaddress|studentemail|recipientemail|recipient)$/.test(
                    normalizeColumn(row[emailColumn]?.text ?? '')
                ))
    );
    const headerRow = options.headerRow ?? (inferredHeader >= 0 ? inferredHeader : undefined);
    const header = headerRow === undefined ? undefined : matrix[headerRow];
    const columns = Array.from({ length: width }, (_, index) => ({
        id: `column-${index}`,
        index,
        label: header?.[index]?.text.trim() || `Column ${index + 1}`,
    }));
    const named = (name: string): number =>
        columns.findIndex(column => normalizeColumn(column.label) === normalizeColumn(name));
    const fullName = ['recipient name', 'name', 'full name', 'display name', 'student name']
        .map(named)
        .find(i => i >= 0);
    const firstName = ['first name', 'first'].map(named).find(i => i >= 0);
    const lastName = ['last name', 'last'].map(named).find(i => i >= 0);
    const meta = (row: SpreadsheetCell[], label: string): string | undefined => {
        const index = named(label);
        return index < 0 ? undefined : row[index]?.text.trim() || undefined;
    };
    let skipped = headerRow === undefined || headerRow < 0 ? 0 : headerRow + 1;
    const lastNonblank = lastIndex(matrix, row => !blank(row));
    const rows: ParsedSpreadsheet['rows'] = [];
    if (emailColumn !== undefined) {
        for (let index = (headerRow ?? -1) + 1; index < matrix.length; index++) {
            const row = matrix[index]!;
            if (
                blank(row) ||
                (index === lastNonblank &&
                    !isValidRosterEmail(row[emailColumn]?.text ?? '') &&
                    row.some(cell => /^totals?$/i.test(cell.text.trim())))
            ) {
                skipped++;
                continue;
            }
            rows.push({
                rowId: crypto.randomUUID(),
                sourceRow: index + 1,
                email: normalizeEmail(row[emailColumn]?.text ?? ''),
                displayName:
                    fullName !== undefined
                        ? (row[fullName]?.text.trim() ?? '')
                        : [firstName, lastName]
                              .filter(i => i !== undefined)
                              .map(i => row[i!]?.text.trim())
                              .filter(Boolean)
                              .join(' '),
                cells: Object.fromEntries(
                    columns.map(column => [column.id, row[column.index] ?? { text: '' }])
                ),
                exportedRunId: meta(row, EXPORT_RUN_COLUMN),
                exportedRowId: meta(row, EXPORT_ROW_COLUMN),
                example: meta(row, EXPORT_EXAMPLE_COLUMN) === 'true',
            });
        }
    }
    if (rows.length > SPREADSHEET_LIMITS.rows) throw new SpreadsheetError('limit');
    return { source, sheetName, columns, rows, emailColumn, emailCandidates, headerRow, skipped };
};
