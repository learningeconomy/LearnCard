import { isPublicComputerMode, type EscrowRecoveryExpectations } from '@learncard/sss-key-manager';
import { createDeviceShareStorage } from 'learn-card-base/security/deviceShareStorage';
import { z } from 'zod';

export interface PendingEscrowRecovery {
    holdId: string;
    resumeToken: string;
    clientEphemeralPrivateKey: string;
    releaseAfter: string;
    requestedAt?: string;
    /** Set only for an authority-mode hold-policy hold; see EscrowRecoveryPanel's code-entry step. */
    requiresConfirmation?: boolean;
    /**
     * Initiating-client bindings for an authority-mode (Nitro) hold. Persist
     * verbatim alongside the resume token and private key, and pass unchanged
     * on every later status/confirm/restore call; never rebuild from a status
     * response. See `EscrowRecoveryExpectations`.
     */
    expectations?: EscrowRecoveryExpectations;
}

const KEY = 'escrow-recovery-pending';
const storage = createDeviceShareStorage();

/** A week-long request requires durable storage and cross-tab write coordination. */
export const isEscrowRecoveryStorageAvailable = (): boolean =>
    !isPublicComputerMode() && typeof navigator !== 'undefined' && Boolean(navigator.locks);

const updateRequests = async (update: () => Promise<void>): Promise<void> => {
    if (!isEscrowRecoveryStorageAvailable()) throw new Error('Recovery storage is unavailable');
    await navigator.locks.request(KEY, update);
};
const escrowRecoveryExpectationsSchema = z.object({
    tenant: z.string().min(1),
    did: z.string().min(1),
    holdId: z.string().min(1),
    clientEphemeralPublicKey: z.string().min(1),
    blobHash: z.string().min(1),
    authorityGeneration: z.string().min(1),
    holdDigest: z.string().min(1),
    ledgerPublicKey: z.string().min(1),
    keyId: z.string().min(1),
});
const storedRequestSchema = z.object({
    scope: z.string(),
    holdId: z.string().min(1),
    resumeToken: z.string().min(1),
    clientEphemeralPrivateKey: z.string().min(1),
    releaseAfter: z.string().refine(value => Number.isFinite(Date.parse(value))),
    requestedAt: z.string().optional(),
    requiresConfirmation: z.boolean().optional(),
    expectations: escrowRecoveryExpectationsSchema.optional(),
});

const loadRequests = async () => {
    const raw = await storage.getDeviceShare(KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    // Accept the original single-request format as well as account-scoped records.
    const entries = Array.isArray(value) ? value : [value];
    // One malformed record (e.g. a corrupted `expectations` blob) must not take
    // down every other account's request, and must not surface as a load
    // failure either: drop just that record so its scope resolves as "no
    // pending", which the panel already treats as a clean slate for a new start.
    return entries.flatMap(entry => {
        const parsed = storedRequestSchema.safeParse(entry);
        return parsed.success ? [parsed.data] : [];
    });
};

/** Uses the SSS device-share storage (encrypted SQLite on native, encrypted IndexedDB on web); new requests are disabled on public computers. */
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
        requestedAt: value.requestedAt,
        requiresConfirmation: value.requiresConfirmation,
        expectations: value.expectations,
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

/** Forget-device path: best-effort wipe of every pending request on this device. */
export const clearAllPendingEscrowRecovery = async (): Promise<void> => {
    const wipe = () => storage.clearAllShares(KEY);
    if (typeof navigator !== 'undefined' && navigator.locks) {
        await navigator.locks.request(KEY, wipe);
    } else {
        await wipe();
    }
};
