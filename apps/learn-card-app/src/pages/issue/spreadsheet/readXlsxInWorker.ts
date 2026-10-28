import {
    SPREADSHEET_LIMITS,
    SpreadsheetError,
    type SpreadsheetErrorCode,
} from './parseSpreadsheet';
import type { SpreadsheetSource } from './types';

export type XlsxWorkerResult =
    { source: SpreadsheetSource } | { error: { code: SpreadsheetErrorCode; cell?: string } };

/** Keep workbook parsing off the UI thread, with a deadline that terminates its work. */
export const readXlsxInWorker = (bytes: ArrayBuffer, name: string): Promise<SpreadsheetSource> =>
    new Promise((resolve, reject) => {
        if (bytes.byteLength > SPREADSHEET_LIMITS.bytes) {
            reject(new SpreadsheetError('limit'));
            return;
        }
        const worker = new Worker(new URL('./xlsx.worker.ts', import.meta.url), { type: 'module' });
        const finish = (): void => {
            clearTimeout(timeout);
            worker.terminate();
        };
        const timeout = setTimeout(() => {
            finish();
            reject(new SpreadsheetError('complexity'));
        }, SPREADSHEET_LIMITS.parseTimeoutMs);
        worker.onmessage = ({ data }: MessageEvent<XlsxWorkerResult>) => {
            finish();
            if ('error' in data) reject(new SpreadsheetError(data.error.code, data.error.cell));
            else resolve(data.source);
        };
        worker.onerror = event => {
            event.preventDefault();
            finish();
            reject(new SpreadsheetError('malformed'));
        };
        worker.onmessageerror = () => {
            finish();
            reject(new SpreadsheetError('malformed'));
        };
        try {
            worker.postMessage({ bytes, name }, [bytes]);
        } catch (error) {
            finish();
            reject(error);
        }
    });
