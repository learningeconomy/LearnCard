import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeferred } from './deferred';

import type { BespokeLearnCard } from '../types/learn-card';

const { aiPassportFetchMock, ensureAiPassportSessionMock } = vi.hoisted(() => ({
    aiPassportFetchMock: vi.fn(),
    ensureAiPassportSessionMock: vi.fn(async () => 'session'),
}));

vi.mock('./aiPassportAuth', () => ({
    aiPassportFetch: aiPassportFetchMock,
    ensureAiPassportSession: ensureAiPassportSessionMock,
}));

import { ensureCredentialIngestion } from './credentialIngestion';

const response = () =>
    Response.json(
        {
            status: 'accepted',
            jobId: 'job-1',
            deduplicated: false,
            ingestion: {
                phase: 'queued',
                source: 'app_open',
                requestedAt: Date.now(),
            },
        },
        { status: 202 }
    );

const wallet = (did: string) => ({ id: { did: () => did } }) as unknown as BespokeLearnCard;

describe('ensureCredentialIngestion', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        aiPassportFetchMock.mockReset();
        aiPassportFetchMock.mockImplementation(async () => response());
        ensureAiPassportSessionMock.mockClear();
        ensureAiPassportSessionMock.mockResolvedValue('session');
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('authenticates and deduplicates simultaneous requests for one account', async () => {
        const account = wallet('did:example:deduplicated');
        const first = ensureCredentialIngestion(account, 'app_open');
        const second = ensureCredentialIngestion(account, 'consent');

        expect(second).toBe(first);
        await expect(first).resolves.toMatchObject({ jobId: 'job-1' });
        expect(ensureAiPassportSessionMock).toHaveBeenCalledOnce();
        expect(aiPassportFetchMock).toHaveBeenCalledWith(
            '/credentials/ingestion',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ source: 'app_open' }),
            }),
            'did:example:deduplicated'
        );
    });

    it('preserves the legacy ingestion identity only for a legacy backend', async () => {
        const did = 'did:example:legacy-ingestion';

        ensureAiPassportSessionMock.mockResolvedValueOnce('legacy');

        await ensureCredentialIngestion(wallet(did), 'app_open');

        expect(aiPassportFetchMock).toHaveBeenCalledWith(
            '/credentials/ingestion',
            expect.objectContaining({
                body: JSON.stringify({ did, source: 'app_open' }),
            }),
            did
        );
    });

    it('keeps in-flight requests deduplicated beyond the success-cache window', async () => {
        const account = wallet('did:example:slow');
        const pending = createDeferred<Response>();

        aiPassportFetchMock.mockReturnValueOnce(pending.promise);

        const first = ensureCredentialIngestion(account, 'app_open');

        await vi.advanceTimersByTimeAsync(60_000);

        const second = ensureCredentialIngestion(account, 'consent');

        expect(second).toBe(first);
        expect(aiPassportFetchMock).toHaveBeenCalledTimes(1);

        pending.resolve(Response.json({ jobId: 'job-slow' }, { status: 202 }));
        await expect(first).resolves.toMatchObject({ jobId: 'job-slow' });
    });

    it('expires successful requests after the deduplication window', async () => {
        const account = wallet('did:example:expiry');

        await ensureCredentialIngestion(account, 'app_open');
        await vi.advanceTimersByTimeAsync(60_000);
        await ensureCredentialIngestion(account, 'consent');

        expect(aiPassportFetchMock).toHaveBeenCalledTimes(2);
    });

    it('allows a failed request to be retried', async () => {
        const account = wallet('did:example:retry');

        aiPassportFetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

        await expect(ensureCredentialIngestion(account, 'app_open')).rejects.toThrow(
            'Credential indexing request failed (503)'
        );
        await expect(ensureCredentialIngestion(account, 'consent')).resolves.toMatchObject({
            jobId: 'job-1',
        });
        expect(aiPassportFetchMock).toHaveBeenCalledTimes(2);
    });
});
