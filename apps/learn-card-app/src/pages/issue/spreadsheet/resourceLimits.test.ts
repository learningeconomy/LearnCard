import { afterEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { utils, write } from 'xlsx';
import { boundedXlsxArchive } from './xlsxArchive';
import { readXlsx } from './readXlsx';
import {
    checkMatrixLimits,
    parseSpreadsheet,
    readSpreadsheetFile,
    readSpreadsheetText,
    SPREADSHEET_LIMITS,
} from './parseSpreadsheet';

const original = { ...SPREADSHEET_LIMITS };
afterEach(() => {
    Object.assign(SPREADSHEET_LIMITS, original);
    vi.restoreAllMocks();
});
const workbook = (): ArrayBuffer => {
    const book = utils.book_new();
    utils.book_append_sheet(
        book,
        utils.aoa_to_sheet([
            ['Email', 'Name'],
            ['ada@test.com', 'Ada'],
        ]),
        'People'
    );
    return write(book, { type: 'array', bookType: 'xlsx' });
};
const compressed = (zip: JSZip, streamFiles = false): Promise<ArrayBuffer> =>
    zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE', streamFiles });

describe('spreadsheet resource limits', () => {
    it('rejects oversized selected files before reading or creating a parser', async () => {
        const arrayBuffer = vi.fn();
        await expect(
            readSpreadsheetFile({
                name: 'huge.xlsx',
                size: original.bytes + 1,
                arrayBuffer,
            } as unknown as File)
        ).rejects.toMatchObject({ code: 'limit' });
        expect(arrayBuffer).not.toHaveBeenCalled();
        expect(() => readXlsx(new ArrayBuffer(original.bytes + 1), 'huge.xlsx')).toThrow('limit');
    });

    it.each([false, true])(
        'bounds actual decompression including unused ZIP members (streamed headers: %s)',
        async stream => {
            const zip = await JSZip.loadAsync(workbook());
            zip.file('xl/unused.xml', 'x'.repeat(128 * 1024));
            const bytes = await compressed(zip, stream);
            expect(bytes.byteLength).toBeLessThan(original.bytes);
            SPREADSHEET_LIMITS.expandedBytes = 64 * 1024;
            expect(() => boundedXlsxArchive(bytes)).toThrow('complexity');
        }
    );

    it('does not trust forged small original sizes in ZIP headers', async () => {
        const zip = await JSZip.loadAsync(workbook());
        zip.file('xl/unused.xml', 'x'.repeat(128 * 1024));
        const bytes = await compressed(zip);
        const view = new DataView(bytes);
        // Understate both local and central sizes; actual DEFLATE output is unchanged.
        for (let i = 0; i <= bytes.byteLength - 30; i++) {
            const signature = view.getUint32(i, true);
            if (signature === 0x04034b50) view.setUint32(i + 22, 1, true);
            if (signature === 0x02014b50) view.setUint32(i + 24, 1, true);
        }
        SPREADSHEET_LIMITS.expandedBytes = 64 * 1024;
        expect(() => boundedXlsxArchive(bytes)).toThrow('complexity');
    });

    it('counts the expanded archive in aggregate, including hidden worksheets', async () => {
        const zip = await JSZip.loadAsync(workbook());
        zip.file('xl/worksheets/hidden.xml', 'x'.repeat(40 * 1024));
        zip.file('xl/media/image.bin', 'x'.repeat(40 * 1024));
        SPREADSHEET_LIMITS.expandedBytes = 64 * 1024;
        const bytes = await compressed(zip);
        expect(() => boundedXlsxArchive(bytes)).toThrow('complexity');
    });

    it('rejects excessive members before parsing a workbook', async () => {
        const zip = await JSZip.loadAsync(workbook());
        SPREADSHEET_LIMITS.archiveEntries = 3;
        expect(() => boundedXlsxArchive(workbook())).toThrow('complexity');
        expect(Object.keys(zip.files).length).toBeGreaterThan(3);
    });

    it('rejects duplicate paths and path aliases rather than checking different members than SheetJS', async () => {
        const zip = await JSZip.loadAsync(workbook());
        zip.file('xl/../unused.xml', 'bad');
        const bytes = await compressed(zip);
        expect(() => readXlsx(bytes, 'bad.xlsx')).toThrow('malformed');
    });

    it('rejects duplicate physical members even when central-directory names agree', async () => {
        const zip = await JSZip.loadAsync(workbook());
        zip.file('one.xml', 'one');
        zip.file('two.xml', 'two');
        const bytes = new Uint8Array(await compressed(zip));
        const from = new TextEncoder().encode('two.xml');
        const to = new TextEncoder().encode('one.xml');
        for (let i = 0; i <= bytes.length - from.length; i++) {
            if (from.every((value, index) => bytes[i + index] === value)) bytes.set(to, i);
        }
        expect(() => readXlsx(bytes.buffer, 'duplicate.xlsx')).toThrow('malformed');
    });

    it('keeps valid compressed and streamed XLSX imports lossless', async () => {
        for (const stream of [false, true]) {
            const zip = await JSZip.loadAsync(workbook());
            const source = readXlsx(await compressed(zip, stream), 'valid.xlsx');
            expect(parseSpreadsheet(source).rows[0]).toMatchObject({
                email: 'ada@test.com',
                displayName: 'Ada',
            });
        }
    });

    it('stops CSV parsing at row/column/cell budgets and applies the same cell limit to raw matrices', () => {
        SPREADSHEET_LIMITS.cells = 4;
        expect(readSpreadsheetText('Email,Name\na@test.com,Ada').sheets.Sheet1).toHaveLength(2);
        expect(() => readSpreadsheetText('Email,Name\na@test.com,Ada\nb@test.com,Bob')).toThrow(
            'limit'
        );
        expect(() =>
            checkMatrixLimits(Array.from({ length: 3 }, () => [{ text: 'a' }, { text: 'b' }]))
        ).toThrow('limit');
        SPREADSHEET_LIMITS.rows = 0;
        expect(() => readSpreadsheetText(Array(101).fill('a').join('\n'))).toThrow('limit');
        expect(() =>
            readSpreadsheetText(
                Array(original.columns + 1)
                    .fill('a')
                    .join(',')
            )
        ).toThrow('limit');
    });
});
