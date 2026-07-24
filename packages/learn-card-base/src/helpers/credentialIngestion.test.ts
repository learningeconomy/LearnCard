import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { networkStore } from '../stores/NetworkStore';
import { ensureCredentialIngestion } from './credentialIngestion';

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn(async () =>
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
    )
);

describe('ensureCredentialIngestion', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock.mockClear();
        globalThis.fetch = fetchMock as typeof fetch;
        networkStore.set.aiServiceUrl('https://ai.example.test');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('deduplicates simultaneous app-open and consent requests for one account', async () => {
        const did = 'did:example:deduplicated';
        const first = ensureCredentialIngestion(did, 'app_open');
        const second = ensureCredentialIngestion(did, 'consent');

        expect(second).toBe(first);
        await expect(first).resolves.toMatchObject({ jobId: 'job-1' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://ai.example.test/credentials/ingestion',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ did, source: 'app_open' }),
            })
        );
    });

    it('keeps in-flight requests deduplicated beyond the success-cache window', async () => {
        const did = 'did:example:slow';
        const response = Promise.withResolvers<Response>();
        fetchMock.mockReturnValueOnce(response.promise);

        const first = ensureCredentialIngestion(did, 'app_open');
        await vi.advanceTimersByTimeAsync(60_000);
        const second = ensureCredentialIngestion(did, 'consent');

        expect(second).toBe(first);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        response.resolve(Response.json({ jobId: 'job-slow' }, { status: 202 }));
        await expect(first).resolves.toMatchObject({ jobId: 'job-slow' });
    });

    it('expires successful requests after the deduplication window', async () => {
        const did = 'did:example:expiry';

        await ensureCredentialIngestion(did, 'app_open');
        await vi.advanceTimersByTimeAsync(60_000);
        await ensureCredentialIngestion(did, 'consent');

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('allows a failed request to be retried', async () => {
        const did = 'did:example:retry';
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

        await expect(ensureCredentialIngestion(did, 'app_open')).rejects.toThrow(
            'Credential indexing request failed (503)'
        );
        await expect(ensureCredentialIngestion(did, 'consent')).resolves.toMatchObject({
            jobId: 'job-1',
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
