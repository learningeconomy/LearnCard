import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readXlsxInWorker, type XlsxWorkerResult } from './readXlsxInWorker';
import { readSpreadsheetFile, SPREADSHEET_LIMITS } from './parseSpreadsheet';

class TestWorker {
    static instances: TestWorker[] = [];
    onmessage?: (event: MessageEvent<XlsxWorkerResult>) => void;
    onerror?: (event: ErrorEvent) => void;
    onmessageerror?: () => void;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor(
        readonly url: URL,
        readonly options: WorkerOptions
    ) {
        TestWorker.instances.push(this);
    }
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', TestWorker);
    TestWorker.instances = [];
});
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('XLSX worker lifecycle', () => {
    it('routes selected XLSX bytes through a module worker and terminates it after success', async () => {
        const bytes = new ArrayBuffer(3);
        const result = readSpreadsheetFile({
            name: 'people.xlsx',
            size: 3,
            arrayBuffer: async () => bytes,
        } as File);
        await vi.waitFor(() => expect(TestWorker.instances).toHaveLength(1));
        const worker = TestWorker.instances[0];
        expect(worker.url.pathname).toMatch(/\/xlsx.worker.ts$/);
        expect(worker.options).toEqual({ type: 'module' });
        expect(worker.postMessage).toHaveBeenCalledWith({ bytes, name: 'people.xlsx' }, [bytes]);
        const source = { name: 'people.xlsx', sheets: { People: [[{ text: 'Email' }]] } };
        worker.onmessage!(new MessageEvent<XlsxWorkerResult>('message', { data: { source } }));
        await expect(result).resolves.toEqual(source);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('preserves actionable parser errors across the worker boundary', async () => {
        const result = readXlsxInWorker(new ArrayBuffer(0), 'bad.xlsx');
        const assertion = expect(result).rejects.toMatchObject({
            code: 'bounds',
            cell: 'People!XFD1048576',
        });
        const worker = TestWorker.instances[0];
        worker.onmessage!(
            new MessageEvent<XlsxWorkerResult>('message', {
                data: { error: { code: 'bounds', cell: 'People!XFD1048576' } },
            })
        );
        await assertion;
        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('terminates a parser that exceeds its deadline', async () => {
        const result = readXlsxInWorker(new ArrayBuffer(0), 'slow.xlsx');
        const assertion = expect(result).rejects.toMatchObject({ code: 'complexity' });
        await vi.advanceTimersByTimeAsync(SPREADSHEET_LIMITS.parseTimeoutMs);
        await assertion;
        expect(TestWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['crash', 'message'])('cleans up after a %s failure', async failure => {
        const result = readXlsxInWorker(new ArrayBuffer(0), 'broken.xlsx');
        const assertion = expect(result).rejects.toBeDefined();
        const worker = TestWorker.instances[0];
        if (failure === 'crash') worker.onerror!(new ErrorEvent('error', { cancelable: true }));
        else worker.onmessageerror!();
        await assertion;
        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });
});
