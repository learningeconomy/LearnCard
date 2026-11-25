import { Unzip, UnzipInflate, zipSync } from 'fflate';
import { SPREADSHEET_LIMITS, SpreadsheetError } from './parseSpreadsheet';

/** Bound actual ZIP output, then give SheetJS only the validated, uncompressed members. */
export const boundedXlsxArchive = (bytes: ArrayBuffer): Uint8Array => {
    if (bytes.byteLength > SPREADSHEET_LIMITS.bytes) throw new SpreadsheetError('limit');
    const files: Record<string, Uint8Array> = Object.create(null);
    const names = new Set<string>();
    let expandedBytes = 0;
    let pending = 0;
    const unzip = new Unzip(file => {
        if (names.size >= SPREADSHEET_LIMITS.archiveEntries)
            throw new SpreadsheetError('complexity');
        // Reject aliases/duplicates instead of letting two ZIP readers disagree
        // about which member was checked. No members are extracted to disk.
        if (
            names.has(file.name) ||
            file.name.startsWith('/') ||
            file.name.includes('\\') ||
            file.name
                .split('/')
                .some(part =>
                    ['..', '.', '__proto__', 'constructor', 'prototype'].includes(part)
                ) ||
            file.name.includes('\0')
        )
            throw new SpreadsheetError('malformed');
        names.add(file.name);
        if (
            file.originalSize !== undefined &&
            file.originalSize > SPREADSHEET_LIMITS.expandedBytes - expandedBytes
        )
            throw new SpreadsheetError('complexity');
        pending++;
        const chunks: Uint8Array[] = [];
        let length = 0;
        file.ondata = (error, chunk, final) => {
            if (error) throw error;
            expandedBytes += chunk.byteLength;
            if (expandedBytes > SPREADSHEET_LIMITS.expandedBytes)
                throw new SpreadsheetError('complexity');
            chunks.push(chunk);
            length += chunk.byteLength;
            if (final) {
                const content = new Uint8Array(length);
                let offset = 0;
                for (const part of chunks) {
                    content.set(part, offset);
                    offset += part.length;
                }
                files[file.name] = content;
                pending--;
            }
        };
        file.start();
    });
    unzip.register(UnzipInflate);
    const input = new Uint8Array(bytes);
    // A small compressed chunk bounds a single inflate allocation too. Never
    // trust the archive's declared original sizes or inflate a whole entry first.
    for (let offset = 0; offset < input.length; offset += 1024)
        unzip.push(input.subarray(offset, offset + 1024), offset + 1024 >= input.length);
    if (pending || !files['[Content_Types].xml'] || !files['xl/workbook.xml'])
        throw new SpreadsheetError('malformed');
    // STORE avoids a second decompression pass and removes unvalidated metadata.
    return zipSync(files, { level: 0 });
};
