import { networkStore } from '../stores/NetworkStore';

export type CredentialIngestionSource = 'app_open' | 'consent' | 'manual';

export type CredentialIngestionResponse = {
    jobId: string;
    status: string;
    deduplicated: boolean;
    ingestion: {
        phase: 'queued' | 'active' | 'ready' | 'error';
        source: string;
        requestedAt: number;
        startedAt?: number;
        completedAt?: number;
        metrics?: {
            totalSeen: number;
            indexed: number;
            repaired: number;
            alreadyComplete: number;
            failed: number;
            durationMs: number;
        };
        error?: string;
    };
};

type CachedIngestionRequest = {
    expiresAt?: number;
    request: Promise<CredentialIngestionResponse>;
};

const REQUEST_DEDUPLICATION_MS = 60_000;
const ingestionRequests = new Map<string, CachedIngestionRequest>();

/**
 * Starts credential indexing without duplicating simultaneous app-open and consent requests.
 */
export const ensureCredentialIngestion = (
    did: string,
    source: CredentialIngestionSource
): Promise<CredentialIngestionResponse> => {
    const cached = ingestionRequests.get(did);

    if (cached && (cached.expiresAt === undefined || Date.now() < cached.expiresAt))
        return cached.request;

    const request = fetch(`${networkStore.get.aiServiceUrl()}/credentials/ingestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, source }),
    }).then(async response => {
        if (!response.ok)
            throw new Error(`Credential indexing request failed (${response.status})`);

        return (await response.json()) as CredentialIngestionResponse;
    });

    ingestionRequests.set(did, { request });

    void request.then(
        () => {
            if (ingestionRequests.get(did)?.request !== request) return;

            ingestionRequests.set(did, {
                expiresAt: Date.now() + REQUEST_DEDUPLICATION_MS,
                request,
            });
            setTimeout(() => {
                if (ingestionRequests.get(did)?.request === request) ingestionRequests.delete(did);
            }, REQUEST_DEDUPLICATION_MS);
        },
        () => {
            if (ingestionRequests.get(did)?.request === request) ingestionRequests.delete(did);
        }
    );

    return request;
};
