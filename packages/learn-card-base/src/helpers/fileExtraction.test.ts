import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureLoggerContext } from '../logging/logger';
import { clearDiagnosticLogs, getDiagnosticLogs } from '../logging/diagnosticLogBuffer';
import {
    createFileExtractionAttempt,
    extractFileCredentials,
    FileExtractionError,
    recordFilePersistenceDiagnostic,
} from './fileExtraction';
import type { FileExtractionAttempt } from './fileExtraction';

const { fetchMock, reservationMock, scopeState } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    reservationMock: vi.fn(),
    scopeState: { controller: new AbortController() },
}));
vi.mock('./aiPassportAuth', () => ({
    aiPassportFetch: (url: string, init: RequestInit, did: string) =>
        url.includes('/reservations') ? reservationMock(url, init, did) : fetchMock(url, init, did),
    createAiPassportRequestScope: () => ({
        signal: scopeState.controller.signal,
        dispose: () => {},
    }),
}));
vi.mock('../i18n', () => ({ addActiveLocaleToUrl: (url: string) => url }));
vi.mock('../stores/NetworkStore', () => ({
    networkStore: { get: { aiServiceUrl: () => 'https://synthetic.invalid' } },
}));

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:synthetic',
    credentialSubject: { id: 'did:example:synthetic' },
};
const metadata = (attempt: FileExtractionAttempt, count = 0) => ({
    ...attempt,
    version: 1,
    stage: 'complete',
    outcome: count ? 'success' : 'empty',
    code: count ? 'OK' : 'ZERO_STRUCTURED_ITEMS',
    durationMs: 10,
    sizeBucket: 'under_100kb',
    fileType: 'resume',
    credentialCount: count,
    pipelineVersion: 'file-extraction-v1',
    model: 'gpt-6-luna-none',
    ocrModel: 'not_used',
});
const input = (attempt: FileExtractionAttempt) => ({
    did: 'did:example:synthetic',
    file: 'data:text/plain;base64,c3ludGhldGlj',
    fileType: 'resume',
    attempt,
});
const respond = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
    reservationMock.mockReset().mockImplementation(async (_url, init) =>
        init.method === 'DELETE'
            ? Response.json({ released: true })
            : Response.json(
                  {
                      token: 'a'.repeat(43),
                      expiresAt: Date.now() + 15000,
                  },
                  { status: 201 }
              )
    );
    scopeState.controller = new AbortController();
    configureLoggerContext({
        bugReportsEnabled: true,
        diagnosticLogCollectionEnabled: true,
        diagnosticIdentity: 'synthetic-adult',
    });
    clearDiagnosticLogs();
    vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('file extraction outcomes', () => {
    it('reuses the extraction attempt across automatic admission retries', async () => {
        vi.useFakeTimers();
        try {
            const attempt = createFileExtractionAttempt();
            const waiting = vi.fn();
            const onAttempt = vi.fn();
            reservationMock.mockResolvedValueOnce(
                Response.json(
                    { code: 'upload_capacity_exceeded' },
                    { status: 503, headers: { 'Retry-After': '0' } }
                )
            );
            fetchMock.mockImplementationOnce(async (_url, options) => {
                const request = JSON.parse(options.body);
                return Response.json({ vcs: [], processing: metadata(request.diagnostics) });
            });
            const pending = extractFileCredentials({
                ...input(attempt),
                onWaiting: waiting,
                onAttempt,
            });
            await vi.runAllTimersAsync();
            expect((await pending).processing.outcome).toBe('empty');
            expect(reservationMock).toHaveBeenCalledTimes(2);
            expect(reservationMock.mock.calls.every(([, init]) => init.body === undefined)).toBe(
                true
            );
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const sent = JSON.parse(fetchMock.mock.calls[0][1].body).diagnostics;
            expect(sent).toMatchObject(attempt);
            expect(onAttempt).toHaveBeenCalledExactlyOnceWith(attempt);
            expect(waiting).toHaveBeenCalledWith(true);
            expect(waiting).toHaveBeenLastCalledWith(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it('can still retry admission at the final extraction attempt', async () => {
        vi.useFakeTimers();
        try {
            const attempt = { ...createFileExtractionAttempt(), attempt: 100 };
            reservationMock.mockResolvedValueOnce(
                Response.json(
                    { code: 'upload_capacity_exceeded' },
                    { status: 503, headers: { 'Retry-After': '5' } }
                )
            );
            respond({ vcs: [], processing: metadata(attempt) });
            const pending = extractFileCredentials(input(attempt));
            await vi.runAllTimersAsync();
            expect((await pending).processing.attempt).toBe(100);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it('does not consume extraction attempts across repeated busy waits', async () => {
        vi.useFakeTimers();
        try {
            let attempt = createFileExtractionAttempt();
            reservationMock.mockImplementation(async () =>
                Response.json(
                    { code: 'upload_capacity_exceeded' },
                    { status: 503, headers: { 'Retry-After': '5' } }
                )
            );
            for (let manual = 0; manual < 6; manual += 1) {
                if (manual) attempt = createFileExtractionAttempt(attempt);
                const onAttempt = vi.fn();
                const pending = expect(
                    extractFileCredentials({ ...input(attempt), onAttempt })
                ).rejects.toMatchObject({ code: 'UPLOAD_BUSY' });
                await vi.runAllTimersAsync();
                await pending;
                expect(onAttempt.mock.calls.every(([sent]) => sent.attempt === manual + 1)).toBe(
                    true
                );
            }
            expect(attempt.attempt).toBe(6);
            reservationMock.mockReset().mockImplementation(async () =>
                Response.json(
                    {
                        token: 'a'.repeat(43),
                        expiresAt: Date.now() + 15000,
                    },
                    { status: 201 }
                )
            );
            fetchMock.mockReset();
            const next = createFileExtractionAttempt(attempt);
            respond({ vcs: [], processing: metadata(next) });
            expect((await extractFileCredentials(input(next))).processing.attempt).toBe(7);
        } finally {
            vi.useRealTimers();
        }
    });

    it('preserves a transport failure after a foreground Cancel on an in-flight request', async () => {
        const controller = new AbortController();
        fetchMock.mockImplementationOnce(async () => {
            controller.abort();
            throw new TypeError('synthetic transport failure');
        });
        await expect(
            extractFileCredentials({
                ...input(createFileExtractionAttempt()),
                waitSignal: controller.signal,
            })
        ).rejects.toMatchObject({ code: 'NETWORK_FAILED' });
    });

    it('treats a session abort during JSON reading as cancellation', async () => {
        const response = Response.json({});
        vi.spyOn(response, 'json').mockImplementationOnce(async () => {
            scopeState.controller.abort();
            throw new DOMException('synthetic abort', 'AbortError');
        });
        fetchMock.mockResolvedValueOnce(response);
        await expect(
            extractFileCredentials(input(createFileExtractionAttempt()))
        ).rejects.toMatchObject({ code: 'UPLOAD_CANCELLED' });
        expect(
            getDiagnosticLogs().filter(entry => entry.message === 'file.extraction.completed')
        ).toEqual([]);
    });

    it('records capacity deadline exhaustion with the final attempt and HTTP status', async () => {
        vi.useFakeTimers();
        try {
            const attempt = createFileExtractionAttempt();
            reservationMock.mockImplementation(async () =>
                Response.json({ code: 'upload_capacity_exceeded' }, { status: 503 })
            );
            const pending = expect(extractFileCredentials(input(attempt))).rejects.toMatchObject({
                code: 'UPLOAD_BUSY',
                statusCode: 503,
            });
            await vi.runAllTimersAsync();
            await pending;
            const finalAttempt = attempt;
            expect(fetchMock).not.toHaveBeenCalled();
            expect(
                getDiagnosticLogs().filter(entry => entry.message === 'file.extraction.completed')
            ).toMatchObject([
                {
                    data: {
                        operationId: attempt.operationId,
                        attemptId: finalAttempt.attemptId,
                        attempt: finalAttempt.attempt,
                        code: 'UPLOAD_BUSY',
                        statusCode: 503,
                        outcome: 'failed',
                    },
                },
            ]);
        } finally {
            vi.useRealTimers();
        }
    });

    it('accepts genuine empty output and returns validated credentials for nonempty output', async () => {
        const attempt = createFileExtractionAttempt();
        respond({ vcs: [], processing: metadata(attempt) });
        expect((await extractFileCredentials(input(attempt))).processing.outcome).toBe('empty');
        const retry = createFileExtractionAttempt(attempt);
        respond({ vcs: [{ vc: credential }], processing: metadata(retry, 1) });
        expect((await extractFileCredentials(input(retry))).vcs[0].vc).toEqual(credential);
        expect(retry.operationId).toBe(attempt.operationId);
        expect(retry.attemptId).not.toBe(attempt.attemptId);
        expect(retry.attempt).toBe(2);
    });

    it.each([
        'missing-vcs',
        'wrong-count',
        'wrong-operation',
        'invalid-credential',
        'failure-as-success',
    ])('rejects %s instead of treating an invalid success as empty', async kind => {
        const attempt = createFileExtractionAttempt();
        const body = { vcs: [] as unknown[], processing: metadata(attempt) };
        if (kind === 'missing-vcs') respond({ processing: body.processing });
        else {
            if (kind === 'wrong-count') body.processing.credentialCount = 1;
            if (kind === 'wrong-operation') body.processing.operationId = crypto.randomUUID();
            if (kind === 'invalid-credential') {
                body.vcs = [{ vc: { privatePayload: 'PRIVATE_SENTINEL' } }];
                Object.assign(body.processing, metadata(attempt, 1));
            }
            if (kind === 'failure-as-success')
                Object.assign(body.processing, {
                    outcome: 'failed',
                    code: 'MODEL_FAILED',
                    stage: 'extract',
                });
            respond(body);
        }
        await expect(extractFileCredentials(input(attempt))).rejects.toMatchObject({
            code: 'RESPONSE_INVALID',
        });
        expect(JSON.stringify(getDiagnosticLogs())).not.toContain('PRIVATE_SENTINEL');
    });

    it('uses fixed copy and retains safe stage/status without leaking server error text', async () => {
        const attempt = createFileExtractionAttempt();
        const processing = {
            ...metadata(attempt),
            outcome: 'failed',
            code: 'MODEL_FAILED',
            stage: 'extract',
        };
        respond({ error: 'PRIVATE_SENTINEL alice@example.com', processing }, 503);
        const error = await extractFileCredentials(input(attempt)).catch(value => value);
        expect(error).toBeInstanceOf(FileExtractionError);
        expect(error).toMatchObject({
            code: 'MODEL_FAILED',
            statusCode: 503,
            processing: { stage: 'extract' },
        });
        expect(error.message).toBe('We could not process this file right now. Please try again.');
        expect(JSON.stringify(getDiagnosticLogs())).not.toContain('PRIVATE_SENTINEL');
        expect(JSON.stringify(getDiagnosticLogs())).not.toContain('alice@example.com');
    });

    it('classifies a transport rejection without logging the thrown message', async () => {
        const attempt = createFileExtractionAttempt();
        fetchMock.mockRejectedValue(new Error('PRIVATE_SENTINEL'));
        await expect(extractFileCredentials(input(attempt))).rejects.toMatchObject({
            code: 'NETWORK_FAILED',
        });
        expect(JSON.stringify(getDiagnosticLogs())).not.toContain('PRIVATE_SENTINEL');
    });
});

describe('file diagnostics consent and isolation', () => {
    it.each(['opted-out', 'ineligible', 'identity-change'])(
        'suppresses diagnostics for %s even when an earlier operation was eligible',
        async kind => {
            const attempt = createFileExtractionAttempt();
            if (kind === 'opted-out') configureLoggerContext({ bugReportsEnabled: false });
            if (kind === 'ineligible')
                configureLoggerContext({ diagnosticLogCollectionEnabled: false });
            if (kind === 'identity-change')
                configureLoggerContext({ diagnosticIdentity: 'another-profile' });
            respond({ vcs: [], processing: metadata(attempt) });
            await extractFileCredentials(input(attempt));
            const request = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(request.diagnostics.enabled).toBe(false);
            recordFilePersistenceDiagnostic({
                attempt,
                fileType: 'resume',
                outcome: 'failed',
                stage: 'artifact_save',
                extractedCount: 0,
                selectedCount: 0,
                storedCount: 0,
            });
            expect(getDiagnosticLogs()).toEqual([]);
        }
    );

    it('suppresses settlement diagnostics after a profile switch during processing', async () => {
        const attempt = createFileExtractionAttempt();
        const { promise, resolve } = Promise.withResolvers<Response>();
        fetchMock.mockReturnValue(promise);
        const pending = extractFileCredentials(input(attempt));
        configureLoggerContext({ diagnosticIdentity: 'another-profile' });
        resolve(new Response(JSON.stringify({ vcs: [], processing: metadata(attempt) })));
        await pending;
        expect(getDiagnosticLogs()).toEqual([]);
    });

    it('keeps extraction and storage outcomes separate and drops unexpected provider fields', async () => {
        const attempt = createFileExtractionAttempt();
        respond({
            vcs: [],
            processing: {
                ...metadata(attempt),
                privateText: 'PRIVATE_SENTINEL',
                model: 'PRIVATE_SENTINEL',
            },
        });
        await extractFileCredentials(input(attempt));
        recordFilePersistenceDiagnostic({
            attempt,
            fileType: 'resume',
            outcome: 'failed',
            stage: 'artifact_save',
            extractedCount: 0,
            selectedCount: 0,
            storedCount: 0,
        });
        expect(getDiagnosticLogs().map(entry => entry.message)).toEqual([
            'file.extraction.completed',
            'file.persistence.completed',
        ]);
        expect(getDiagnosticLogs()[1].data).toMatchObject({
            stage: 'artifact_save',
            outcome: 'failed',
            code: 'ARTIFACT_SAVE_FAILED',
        });
        expect(getDiagnosticLogs()[0].data).toMatchObject({ model: 'unknown' });
        expect(JSON.stringify(getDiagnosticLogs())).not.toContain('PRIVATE_SENTINEL');
    });

    it('does not rebind an unknown prior operation to the current profile', async () => {
        const attempt = createFileExtractionAttempt({
            operationId: crypto.randomUUID(),
            attemptId: crypto.randomUUID(),
            attempt: 1,
        });
        respond({ vcs: [], processing: metadata(attempt) });
        await extractFileCredentials(input(attempt));
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).diagnostics.enabled).toBe(false);
        expect(getDiagnosticLogs()).toEqual([]);
    });

    it('retains audited backend model identifiers without admitting provider text', async () => {
        const attempt = createFileExtractionAttempt();
        respond({
            vcs: [],
            processing: {
                ...metadata(attempt),
                model: 'us.openai.gpt-6-luna',
                ocrModel: 'tesseract-local',
            },
        });
        await extractFileCredentials(input(attempt));
        expect(getDiagnosticLogs()[0].data).toMatchObject({
            model: 'us.openai.gpt-6-luna',
            ocrModel: 'tesseract-local',
        });
    });
});
