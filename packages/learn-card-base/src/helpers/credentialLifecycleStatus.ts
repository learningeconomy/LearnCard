import type { QueryClient } from '@tanstack/react-query';
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

/**
 * A held credential to check. `networkUri` is set when `uri` is a LearnCloud copy of a
 * network credential: the backend only knows the network URI, and a revocation made on the
 * graph edge alone (no status-list entry) is only visible through it.
 */
export type HeldCredential = { uri: string; credential: VC; networkUri?: string };

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
 * Like deriveLifecycleStatus, but an 'active' read off a check that still carries errors is
 * unknown: the Boost verifier turns an inner verification failure into an error result, and
 * that is not evidence the status list was read.
 */
const statusFromCheck = (check: VerificationCheck): CredentialLifecycleStatus | undefined => {
    const status = deriveLifecycleStatus(check);
    if (status === 'active' && check.errors?.length) return undefined;
    return status;
};

/** Status-list results stay fresh this long, matching the credential card (useCredentialStatus). */
const VERIFY_STALE_TIME = 5 * 60 * 1000;

/** Under ['credentialStatus'] so the lifecycle mutations' invalidation clears it too. */
const verifyQueryKey = (uri: string) => ['credentialStatus', uri, 'statusList'];

export type LifecycleStatusOptions = {
    /** Caches status-list results across refetches. Without it every call re-verifies. */
    queryClient?: QueryClient;
};

/**
 * Batched form of useCredentialStatus: the backend lifecycle status (CREDENTIAL_SENT/RECEIVED
 * edge) for every credential, asked by its network URI, then client verifyCredential on the
 * status list for any the backend left out (imported credentials, copies with no known network
 * URI) or couldn't answer.
 *
 * A URI maps to `undefined` when its status could not be determined (lookup threw, or the
 * check came back with errors), so the caller can decide what that means instead of reading
 * it as 'active'. Results are keyed by `uri`, never by `networkUri`.
 */
export const getCredentialLifecycleStatuses = async (
    wallet: BespokeLearnCard,
    credentials: HeldCredential[],
    { queryClient }: LifecycleStatusOptions = {}
): Promise<Map<string, CredentialLifecycleStatus | undefined>> => {
    const invoke = (wallet.invoke ?? {}) as unknown as StatusInvoke;
    const statuses = new Map<string, CredentialLifecycleStatus | undefined>();
    // URIs the backend could not answer. Without a status list there is nothing else to ask,
    // so for these "no status list" means unknown, not 'active'.
    const backendFailed = new Set<string>();

    const statusUri = ({ uri, networkUri }: HeldCredential) => networkUri ?? uri;
    const statusUris = [...new Set(credentials.map(statusUri))];
    const batches: string[][] = [];
    for (let i = 0; i < statusUris.length; i += LIFECYCLE_STATUS_BATCH_SIZE) {
        batches.push(statusUris.slice(i, i + LIFECYCLE_STATUS_BATCH_SIZE));
    }

    const backend = new Map<string, CredentialLifecycleStatus>();
    if (invoke.getMyCredentialLifecycleStatuses) {
        await Promise.all(
            batches.map(async batch => {
                try {
                    const result = await invoke.getMyCredentialLifecycleStatuses!({ uris: batch });
                    for (const uri of batch) {
                        const status = result?.[uri];
                        if (status === 'active' || status === 'revoked' || status === 'suspended') {
                            backend.set(uri, status);
                        }
                    }
                } catch {
                    // Fall through to client verification for this batch.
                    for (const uri of batch) backendFailed.add(uri);
                }
            })
        );
    } else {
        for (const uri of statusUris) backendFailed.add(uri);
    }

    for (const held of credentials) {
        const status = backend.get(statusUri(held));
        if (status) statuses.set(held.uri, status);
    }

    const verify = async ({ uri, credential }: HeldCredential) => {
        if (!invoke.verifyCredential) throw new Error('verifyCredential unavailable');
        const check = await invoke.verifyCredential(credential, {}, false);
        const status = statusFromCheck(check);
        // Throw on unknown so the query cache never stores it as an answer.
        if (!status) throw new Error(`indeterminate status check for ${uri}`);
        return status;
    };
    const verifyCached = (held: HeldCredential) =>
        queryClient
            ? queryClient.fetchQuery({
                  queryKey: verifyQueryKey(held.uri),
                  queryFn: () => verify(held),
                  staleTime: VERIFY_STALE_TIME,
                  retry: false,
              })
            : verify(held);

    const unanswered = credentials.filter(({ uri }) => !statuses.has(uri));
    const verifyWorker = async () => {
        for (let next = unanswered.shift(); next; next = unanswered.shift()) {
            const held = next;
            if (!hasStatusEntry(held.credential)) {
                statuses.set(held.uri, backendFailed.has(statusUri(held)) ? undefined : 'active');
                continue;
            }
            try {
                statuses.set(held.uri, await verifyCached(held));
            } catch {
                statuses.set(held.uri, undefined);
            }
        }
    };
    await Promise.all(Array.from({ length: VERIFY_CONCURRENCY }, verifyWorker));

    return statuses;
};
