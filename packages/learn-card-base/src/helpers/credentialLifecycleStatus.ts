import type { VC, VerificationCheck } from '@learncard/types';

import type { BespokeLearnCard } from '../types/learn-card';
import type { CredentialLifecycleStatus } from './lifecycleVerification.helpers';

export type { CredentialLifecycleStatus } from './lifecycleVerification.helpers';

/**
 * Pure: map a raw VerificationCheck to a lifecycle status. Fails open to 'active'.
 *
 * Prefers the structured `status` entries (statusPurpose + isSet) when present;
 * falls back to scanning `errors` for older WASM builds that omit structured status.
 */
export const deriveLifecycleStatus = (
    check: Partial<VerificationCheck> | undefined | null
): CredentialLifecycleStatus => {
    const entries = check?.status ?? [];
    if (entries.some(e => e.statusPurpose === 'revocation' && e.isSet)) return 'revoked';
    if (entries.some(e => e.statusPurpose === 'suspension' && e.isSet)) return 'suspended';

    const errors = check?.errors ?? [];
    if (errors.some(e => /revok/i.test(e))) return 'revoked';
    if (errors.some(e => /suspend/i.test(e))) return 'suspended';

    return 'active';
};

/** Backend caps getMyCredentialLifecycleStatuses at 100 URIs per call. */
const LIFECYCLE_STATUS_BATCH_SIZE = 100;

/**
 * Status-list checks running at once. Measured on staging (20 LearnCloud copies): all at once
 * took 2.9-5.2s, one at a time 3.5s, four at a time 1.0s.
 */
const VERIFY_CONCURRENCY = 4;

type HeldCredential = { uri: string; credential: VC };

type StatusInvoke = {
    getMyCredentialLifecycleStatuses?: (options: {
        uris: string[];
    }) => Promise<Record<string, CredentialLifecycleStatus> | undefined>;
    verifyCredential?: (
        credential: VC,
        options: Record<string, unknown>,
        prettify: boolean
    ) => Promise<VerificationCheck>;
};

/**
 * A credential can only be revoked off-network through a status list entry, on itself or
 * on the boost credential it wraps. Without one, verifyCredential has nothing to check.
 */
const hasStatusEntry = (credential: VC): boolean => {
    const inner = (credential as { boostCredential?: VC }).boostCredential;
    return Boolean(credential.credentialStatus || inner?.credentialStatus);
};

/**
 * Batched form of useCredentialStatus: the backend lifecycle status (CREDENTIAL_SENT/RECEIVED
 * edge) for every URI, then client verifyCredential on the status list for any URI the backend
 * left out (imported credentials, LearnCloud copies under a new URI) or couldn't answer.
 *
 * A URI maps to `undefined` when its status could not be determined (lookup threw), so the
 * caller can decide what a failed lookup means instead of reading it as 'active'.
 */
export const getCredentialLifecycleStatuses = async (
    wallet: BespokeLearnCard,
    credentials: HeldCredential[]
): Promise<Map<string, CredentialLifecycleStatus | undefined>> => {
    const invoke = (wallet.invoke ?? {}) as unknown as StatusInvoke;
    const statuses = new Map<string, CredentialLifecycleStatus | undefined>();

    const uris = [...new Set(credentials.map(({ uri }) => uri))];
    const batches: string[][] = [];
    for (let i = 0; i < uris.length; i += LIFECYCLE_STATUS_BATCH_SIZE) {
        batches.push(uris.slice(i, i + LIFECYCLE_STATUS_BATCH_SIZE));
    }

    if (invoke.getMyCredentialLifecycleStatuses) {
        await Promise.all(
            batches.map(async batch => {
                try {
                    const result = await invoke.getMyCredentialLifecycleStatuses!({ uris: batch });
                    for (const uri of batch) {
                        const status = result?.[uri];
                        if (status === 'active' || status === 'revoked' || status === 'suspended') {
                            statuses.set(uri, status);
                        }
                    }
                } catch {
                    // Fall through to client verification for this batch.
                }
            })
        );
    }

    const unanswered = credentials.filter(({ uri }) => !statuses.has(uri));
    const verifyWorker = async () => {
        for (let next = unanswered.shift(); next; next = unanswered.shift()) {
            const { uri, credential } = next;
            if (!hasStatusEntry(credential)) {
                statuses.set(uri, 'active');
                continue;
            }
            try {
                if (!invoke.verifyCredential) throw new Error('verifyCredential unavailable');
                const check = await invoke.verifyCredential(credential, {}, false);
                statuses.set(uri, deriveLifecycleStatus(check));
            } catch {
                statuses.set(uri, undefined);
            }
        }
    };
    await Promise.all(Array.from({ length: VERIFY_CONCURRENCY }, verifyWorker));

    return statuses;
};
