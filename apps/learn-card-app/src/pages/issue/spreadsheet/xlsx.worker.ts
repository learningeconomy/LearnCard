import { readXlsx } from './readXlsx';
import { SpreadsheetError } from './parseSpreadsheet';
import type { XlsxWorkerResult } from './readXlsxInWorker';

self.onmessage = ({ data }: MessageEvent<{ bytes: ArrayBuffer; name: string }>): void => {
    let result: XlsxWorkerResult;
    try {
        result = { source: readXlsx(data.bytes, data.name) };
    } catch (error) {
        result = {
            error:
                error instanceof SpreadsheetError
                    ? { code: error.code, cell: error.cell }
                    : { code: 'malformed' },
        };
    }
    self.postMessage(result);
};
