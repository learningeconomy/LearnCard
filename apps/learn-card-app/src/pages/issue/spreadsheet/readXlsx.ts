import { read, utils, SSF } from 'xlsx';
import { checkMatrixLimits, SpreadsheetError, SPREADSHEET_LIMITS } from './parseSpreadsheet';
import type { SpreadsheetCell, SpreadsheetSource } from './types';

/** Loaded only for XLSX uploads. Formulae are never evaluated by the importer. */
export const readXlsx = (bytes: ArrayBuffer, name: string): SpreadsheetSource => {
    let workbook: ReturnType<typeof read>;
    try {
        workbook = read(bytes, { cellNF: true, cellText: true });
    } catch {
        throw new SpreadsheetError('malformed');
    }
    const sheets: SpreadsheetSource['sheets'] = {};
    for (const [index, sheetName] of workbook.SheetNames.entries()) {
        if (workbook.Workbook?.Sheets?.[index]?.Hidden) continue;
        const sheet = workbook.Sheets[sheetName]!;
        const range = utils.decode_range(sheet['!ref'] ?? 'A1');
        if (range.e.r >= SPREADSHEET_LIMITS.rows + 100 || range.e.c >= SPREADSHEET_LIMITS.columns)
            throw new SpreadsheetError('limit');
        const matrix: SpreadsheetCell[][] = [];
        for (let row = 0; row <= range.e.r; row++) {
            const cells: SpreadsheetCell[] = [];
            for (let col = 0; col <= range.e.c; col++) {
                const cell = sheet[utils.encode_cell({ r: row, c: col })];
                if (!cell) {
                    cells.push({ text: '' });
                    continue;
                }
                const result: SpreadsheetCell = {
                    text: cell.w ?? String(cell.v ?? ''),
                    value:
                        typeof cell.v === 'string' ||
                        typeof cell.v === 'number' ||
                        typeof cell.v === 'boolean'
                            ? cell.v
                            : undefined,
                    ...(cell.f && (cell.v === undefined || cell.t === 'e')
                        ? { problem: 'formula' }
                        : {}),
                    ...(cell.z?.includes('%') ? { percent: true } : {}),
                };
                if (cell.t === 'n' && cell.z && SSF.is_date(cell.z)) {
                    const date = SSF.parse_date_code(cell.v as number, {
                        date1904: workbook.Workbook?.WBProps?.date1904,
                    });
                    if (date && !(date.y === 1900 && date.m === 2 && date.d === 29))
                        result.date = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                }
                cells.push(result);
            }
            matrix.push(cells);
        }
        checkMatrixLimits(matrix);
        sheets[sheetName] = matrix;
    }
    if (!Object.keys(sheets).length) throw new SpreadsheetError('file');
    return { name, sheets };
};
