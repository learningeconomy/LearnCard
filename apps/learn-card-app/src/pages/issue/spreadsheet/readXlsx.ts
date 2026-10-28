import { read, utils, SSF } from 'xlsx';
import { checkMatrixLimits, SpreadsheetError, SPREADSHEET_LIMITS } from './parseSpreadsheet';
import { boundedXlsxArchive } from './xlsxArchive';
import type { SpreadsheetCell, SpreadsheetSource } from './types';

/** Loaded only for XLSX uploads. Formulae are never evaluated by the importer. */
export const readXlsx = (bytes: ArrayBuffer, name: string): SpreadsheetSource => {
    let workbook: ReturnType<typeof read>;
    try {
        workbook = read(boundedXlsxArchive(bytes), { cellNF: true, cellText: true });
    } catch (error) {
        if (error instanceof SpreadsheetError) throw error;
        throw new SpreadsheetError('malformed');
    }
    const sheets: SpreadsheetSource['sheets'] = Object.create(null);
    let expandedCells = 0;
    for (const [index, sheetName] of workbook.SheetNames.entries()) {
        if (workbook.Workbook?.Sheets?.[index]?.Hidden) continue;
        const sheet = workbook.Sheets[sheetName]!;
        // !ref often includes whole formatted columns. Bound actual content before
        // allocating a rectangular matrix; formatting-only cells don't extend it.
        const end = { r: 0, c: 0 };
        for (const address of Object.keys(sheet)) {
            if (!/^[A-Z]+[1-9]\d*$/.test(address)) continue;
            const cell = sheet[address];
            if (!cell?.f && (cell?.v == null || String(cell.v).trim() === '')) continue;
            const position = utils.decode_cell(address);
            if (
                position.r >= SPREADSHEET_LIMITS.rows + 100 ||
                position.c >= SPREADSHEET_LIMITS.columns
            )
                throw new SpreadsheetError('bounds', `${sheetName}!${address}`);
            end.r = Math.max(end.r, position.r);
            end.c = Math.max(end.c, position.c);
        }
        expandedCells += (end.r + 1) * (end.c + 1);
        if (expandedCells > SPREADSHEET_LIMITS.cells) throw new SpreadsheetError('limit');
        const matrix: SpreadsheetCell[][] = [];
        for (let row = 0; row <= end.r; row++) {
            const cells: SpreadsheetCell[] = [];
            for (let col = 0; col <= end.c; col++) {
                const cell = sheet[utils.encode_cell({ r: row, c: col })];
                if (!cell) {
                    cells.push({ text: '' });
                    continue;
                }
                const result: SpreadsheetCell = {
                    text: cell.w ?? String(cell.v ?? ''),
                    value:
                        typeof cell.v === 'string' ||
                        (typeof cell.v === 'number' && Number.isFinite(cell.v)) ||
                        typeof cell.v === 'boolean'
                            ? cell.v
                            : undefined,
                    ...(cell.t === 'e' ||
                    (cell.f &&
                        (cell.v === undefined ||
                            (typeof cell.v === 'number' && !Number.isFinite(cell.v))))
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
