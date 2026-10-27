import cache from '../utils/cache';
import { getPrivacySubjectRef } from '../ai/privacy-keys';
import {
    assertOwnerOperationActive,
    isDataErasureRequested,
    withOwnerOperation,
} from '../services/dataErasure';

export type CredentialIngestionPhase = 'queued' | 'active' | 'ready' | 'error';

export type CredentialIngestionMetrics = {
    totalSeen: number;
    indexed: number;
    repaired: number;
    alreadyComplete: number;
    failed: number;
    /** Retained but not eligible for AI; separate from invalid/failed inputs. */
    excludedUnsupported?: number;
    excludedVerification?: number;
    durationMs: number;
    changed: boolean;
};

export type CredentialIngestionState = {
    phase: CredentialIngestionPhase;
    source: string;
    requestedAt: number;
    startedAt?: number;
    completedAt?: number;
    error?: string;
    metrics?: CredentialIngestionMetrics;
};

const STATE_TTL_SECONDS = 24 * 60 * 60;
const states = new Map<string, CredentialIngestionState>();
const getStateKey = (did: string) => `credential-ingestion-state:${getPrivacySubjectRef(did)}`;

const storeState = async (did: string, state: CredentialIngestionState): Promise<void> => {
    await cache.set(getStateKey(did), JSON.stringify(state), STATE_TTL_SECONDS);
    await assertOwnerOperationActive(did);
    states.set(did, state);
};

export const clearCredentialIngestionState = (did: string): void => {
    states.delete(did);
};

export const refreshCredentialIngestionState = async (
    did: string
): Promise<CredentialIngestionState | undefined> => {
    if (await isDataErasureRequested(did)) {
        states.delete(did);
        return undefined;
    }
    const serialized = await cache.get(getStateKey(did));
    if (!serialized || (await isDataErasureRequested(did))) {
        states.delete(did);
        return undefined;
    }
    const state = JSON.parse(serialized) as CredentialIngestionState;
    states.set(did, state);
    return state;
};

export const markCredentialIngestionQueued = async (did: string, source: string): Promise<void> =>
    withOwnerOperation(did, async () => {
        const current = await refreshCredentialIngestionState(did);

        await storeState(did, {
            phase: 'queued',
            source,
            requestedAt: Date.now(),
            ...(current?.completedAt ? { completedAt: current.completedAt } : {}),
            ...(current?.metrics ? { metrics: current.metrics } : {}),
        });
    });

export const markCredentialIngestionActive = async (did: string, source: string): Promise<void> =>
    withOwnerOperation(did, async () => {
        const current = await refreshCredentialIngestionState(did);

        await storeState(did, {
            phase: 'active',
            source,
            requestedAt: current?.requestedAt ?? Date.now(),
            startedAt: Date.now(),
            ...(current?.completedAt ? { completedAt: current.completedAt } : {}),
            ...(current?.metrics ? { metrics: current.metrics } : {}),
        });
    });

export const markCredentialIngestionReady = async (
    did: string,
    source: string,
    metrics: CredentialIngestionMetrics
): Promise<void> =>
    withOwnerOperation(did, async () => {
        const current = await refreshCredentialIngestionState(did);

        await storeState(did, {
            phase: 'ready',
            source,
            requestedAt: current?.requestedAt ?? Date.now(),
            startedAt: current?.startedAt,
            completedAt: Date.now(),
            metrics,
        });
    });

export const markCredentialIngestionError = async (did: string, source: string): Promise<void> =>
    withOwnerOperation(did, async () => {
        const current = await refreshCredentialIngestionState(did);

        await storeState(did, {
            phase: 'error',
            source,
            requestedAt: current?.requestedAt ?? Date.now(),
            startedAt: current?.startedAt,
            completedAt: Date.now(),
            error: 'credential_ingestion_failed',
            metrics: current?.metrics,
        });
    });

export const getCredentialIngestionState = (did: string): CredentialIngestionState | undefined =>
    states.get(did);

export const isCredentialIngestionPending = (did: string): boolean => {
    const phase = states.get(did)?.phase;
    return phase === 'queued' || phase === 'active';
};

export const waitForCredentialIngestion = async (
    did: string,
    timeoutMs: number
): Promise<CredentialIngestionState | undefined> => {
    const deadline = Date.now() + Math.max(0, timeoutMs);

    while (true) {
        const current = await refreshCredentialIngestionState(did);
        if (current?.phase !== 'queued' && current?.phase !== 'active') {
            return current;
        }

        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) return current;

        await Bun.sleep(Math.min(25, remainingMs));
    }
};
