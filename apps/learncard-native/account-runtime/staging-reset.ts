import { z } from 'zod';

export class ResetFailure extends Error {
    constructor(
        readonly kind:
            'confirmation' | 'changed' | 'connection' | 'storage' | 'recovery' | 'unavailable'
    ) {
        super(`reset:${kind}`);
    }
}
export const resetErrorCode = (error: unknown) =>
    error instanceof ResetFailure ? error.message : 'reset:connection';
const receiptSchema = z
    .object({
        version: z.literal(1),
        environment: z.literal('staging'),
        tenant: z.literal('learncard'),
        uid: z.string().min(1).max(1024),
        signingDid: z.string().startsWith('did:key:').max(512),
        profileId: z.string().min(1).max(100),
        createdAt: z.number().positive(),
        stage: z.enum(['collection', 'profile', 'recovery', 'local']),
    })
    .strict();
export type ResetReceipt = z.infer<typeof receiptSchema>;
export const readResetReceipt = (raw: string | null): ResetReceipt | undefined => {
    if (raw === null) return;
    try {
        const value = receiptSchema.safeParse(JSON.parse(raw));
        if (value.success && value.data.createdAt <= Date.now()) return value.data;
    } catch {
        /* Malformed progress must block, never silently become new-account permission. */
    }
    throw new ResetFailure('storage');
};
export interface ResetWallet {
    did: () => string;
    profile: () => Promise<{ profileId: string } | null | undefined>;
    collectionEmpty: () => Promise<boolean>;
    clearCollection: () => Promise<unknown>;
    deleteProfile: () => Promise<unknown>;
}
export interface ResetDependencies {
    account: () => { uid: string; email: string } | undefined;
    active: () => boolean;
    phase: () => string;
    journal: {
        read: () => Promise<ResetReceipt | undefined>;
        write: (receipt: ResetReceipt) => Promise<void>;
    };
    wallet: () => Promise<ResetWallet>;
    serverIdentity: () => Promise<string | null>;
    deleteRecovery: (did: string) => Promise<void>;
    finishLocal: () => Promise<void>;
    blockAccount: () => void;
}
export const createResetCommands = (deps: ResetDependencies) => {
    let running = false;
    let operationUID: string | undefined;
    const active = () => {
        if (!deps.active() || !deps.account()) throw new ResetFailure('unavailable');
        if (operationUID && deps.account()!.uid !== operationUID) throw new ResetFailure('changed');
    };
    const receipt = async () => {
        active();
        const value = await deps.journal.read();
        active();
        if (value && value.uid !== deps.account()!.uid) throw new ResetFailure('changed');
        return value;
    };
    const exclusive = async <T>(operation: () => Promise<T>) => {
        active();
        if (running) throw new ResetFailure('unavailable');
        running = true;
        operationUID = deps.account()!.uid;
        try {
            return await operation();
        } finally {
            running = false;
            operationUID = undefined;
        }
    };
    const state = (value: ResetReceipt) => ({
        phase: 'reset_pending',
        methods: [],
        reset: { stage: value.stage, profileId: value.profileId },
    });
    const advance = async (value: ResetReceipt, stage: ResetReceipt['stage']) => {
        active();
        value.stage = stage;
        await deps.journal.write(value);
        active();
    };
    const ownedWallet = async (value: ResetReceipt) => {
        const wallet = await deps.wallet();
        active();
        if (wallet.did() !== value.signingDid || (await deps.serverIdentity()) !== value.signingDid)
            throw new ResetFailure('changed');
        active();
        return wallet;
    };
    const resume = async () => {
        const value = await receipt();
        if (!value) throw new ResetFailure('unavailable');
        deps.blockAccount();
        if (value.stage === 'collection') {
            const wallet = await ownedWallet(value);
            if (!(await wallet.collectionEmpty())) {
                active();
                try {
                    await wallet.clearCollection();
                } catch {
                    /* Read before any retry. */
                }
                active();
                if (!(await wallet.collectionEmpty())) throw new ResetFailure('connection');
            }
            await advance(value, 'profile');
        }
        if (value.stage === 'profile') {
            const wallet = await ownedWallet(value),
                profile = await wallet.profile();
            active();
            if (profile && profile.profileId !== value.profileId) throw new ResetFailure('changed');
            if (profile) {
                try {
                    await wallet.deleteProfile();
                } catch {
                    /* A lost reply does not imply a failed delete. */
                }
                active();
                if (await wallet.profile()) throw new ResetFailure('connection');
            }
            await advance(value, 'recovery');
        }
        if (value.stage === 'recovery') {
            const did = await deps.serverIdentity();
            active();
            if (did && did !== value.signingDid) throw new ResetFailure('changed');
            if (did) {
                try {
                    await deps.deleteRecovery(value.signingDid);
                } catch {
                    /* Reconcile while Firebase still exists. */
                }
                active();
                if ((await deps.serverIdentity()) !== null) throw new ResetFailure('connection');
            }
            await advance(value, 'local');
        }
        // Always recheck before granting fresh setup, including after a crash at this stage.
        if ((await deps.serverIdentity()) !== null) throw new ResetFailure('changed');
        active();
        await deps.finishLocal();
        active();
        return { phase: 'reset_complete', methods: [] };
    };
    return {
        readReceipt: receipt,
        resetStatus: async () => {
            const value = await receipt();
            return value ? state(value) : undefined;
        },
        resetStart: (input: unknown) =>
            exclusive(async () => {
                const parsed = z
                    .object({ email: z.string().email().max(254) })
                    .strict()
                    .safeParse(input);
                if (
                    !parsed.success ||
                    parsed.data.email.trim().toLowerCase() !==
                        deps.account()!.email.trim().toLowerCase()
                )
                    throw new ResetFailure('confirmation');
                const previous = await receipt();
                if (!previous) {
                    if (deps.phase() !== 'ready') throw new ResetFailure('unavailable');
                    const wallet = await deps.wallet(),
                        profile = await wallet.profile();
                    active();
                    const did = wallet.did();
                    if (
                        !profile ||
                        !did.startsWith('did:key:') ||
                        (await deps.serverIdentity()) !== did
                    )
                        throw new ResetFailure('changed');
                    active();
                    await deps.journal.write({
                        version: 1,
                        environment: 'staging',
                        tenant: 'learncard',
                        uid: deps.account()!.uid,
                        signingDid: did,
                        profileId: profile.profileId,
                        createdAt: Date.now(),
                        stage: 'collection',
                    });
                    active();
                }
                return resume();
            }),
        resetResume: () => exclusive(resume),
    };
};
