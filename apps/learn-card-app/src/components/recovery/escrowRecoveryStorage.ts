import { createAdaptiveStorage, isPublicComputerMode } from '@learncard/sss-key-manager';
import { z } from 'zod';

export interface PendingEscrowRecovery {
    holdId: string;
    resumeToken: string;
    clientEphemeralPrivateKey: string;
    releaseAfter: string;
}

const KEY = 'escrow-recovery-pending';
const storage = createAdaptiveStorage();

/** A week-long request requires durable storage and cross-tab write coordination. */
export const isEscrowRecoveryStorageAvailable = (): boolean =>
    !isPublicComputerMode() && typeof navigator !== 'undefined' && Boolean(navigator.locks);

const updateRequests = async (update: () => Promise<void>): Promise<void> => {
    if (!isEscrowRecoveryStorageAvailable()) throw new Error('Recovery storage is unavailable');
    await navigator.locks.request(KEY, update);
};
const storedRequestSchema = z.object({
    scope: z.string(),
    holdId: z.string().min(1),
    resumeToken: z.string().min(1),
    clientEphemeralPrivateKey: z.string().min(1),
    releaseAfter: z.string().refine(value => Number.isFinite(Date.parse(value))),
});

const loadRequests = async () => {
    const raw = await storage.getDeviceShare(KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    // Accept the original single-request format as well as account-scoped records.
    return z.array(storedRequestSchema).parse(Array.isArray(value) ? value : [value]);
};

/** Uses SSS encrypted IndexedDB storage; new requests are disabled on public computers. */
export const loadPendingEscrowRecovery = async (
    scope = 'default'
): Promise<PendingEscrowRecovery | undefined> => {
    const value = (await loadRequests()).find(request => request.scope === scope);
    if (!value) return undefined;
    return {
        holdId: value.holdId,
        resumeToken: value.resumeToken,
        clientEphemeralPrivateKey: value.clientEphemeralPrivateKey,
        releaseAfter: value.releaseAfter,
    };
};

export const savePendingEscrowRecovery = async (
    value: PendingEscrowRecovery,
    scope = 'default'
): Promise<void> => {
    await updateRequests(async () => {
        const requests = await loadRequests();
        const record = storedRequestSchema.parse({ ...value, scope });
        await storage.storeDeviceShare(
            JSON.stringify([...requests.filter(request => request.scope !== scope), record]),
            KEY
        );
    });
};

export const clearPendingEscrowRecovery = async (
    holdId: string,
    scope = 'default'
): Promise<void> => {
    await updateRequests(async () => {
        const requests = await loadRequests();
        const remaining = requests.filter(
            request => request.scope !== scope || request.holdId !== holdId
        );
        if (remaining.length === requests.length) return;
        if (remaining.length) await storage.storeDeviceShare(JSON.stringify(remaining), KEY);
        else await storage.clearAllShares(KEY);
    });
};
