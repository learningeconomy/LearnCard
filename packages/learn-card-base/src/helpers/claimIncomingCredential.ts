import type { QueryClient } from '@tanstack/react-query';

import { getLogger } from '../logging/logger';
import { resolveCredentialForClaim } from './ingestManagedCredential';
import { connectionPromptKeys } from '../react-query/connectionPrompts';
import type { BespokeLearnCard } from '../types/learn-card';

const log = getLogger('claim-incoming-credential');

/** Matches the shape of `useWallet().addVCtoWallet`. */
export type AddVCToWallet = (input: { uri: string }) => Promise<boolean>;

export type ClaimIncomingCredentialParams = {
    uri: string;
    wallet: BespokeLearnCard | null | undefined;
    addVCtoWallet: AddVCToWallet;
    queryClient: QueryClient;
};

export type ClaimIncomingCredentialResult = {
    /** Whether the credential was successfully added to the local wallet index. */
    added: boolean;
    /** Whether the server-side accept call succeeded. */
    accepted: boolean;
};

/**
 * Claims an incoming credential: adds it to the wallet, accepts it server-side, and
 * marks the matching notification COMPLETED — all in parallel. This is the single
 * source of truth for "claiming" a credential so the manual claim modal
 * (`CredentialClaimModal`) and guarded auto-accept flows (e.g. transcript arrival)
 * cannot drift apart in behaviour.
 *
 * Mirrors `CredentialClaimModal.handleClaim`'s original inline logic exactly:
 * - A managed network delivery is verified first (`resolveCredentialForClaim`); a failed
 *   check throws before anything is accepted or saved.
 * - A rejected `addVCtoWallet` call is fatal and re-thrown (it's the user-perceived
 *   "credential claimed" event).
 * - A rejected/failed server accept is logged but non-fatal.
 * - The notification lookup/update is best-effort and never blocks the caller.
 */
export const claimIncomingCredential = async ({
    uri,
    wallet,
    addVCtoWallet,
    queryClient,
}: ClaimIncomingCredentialParams): Promise<ClaimIncomingCredentialResult> => {
    // Managed network deliveries must verify (decrypt, proof, status, receipt binding)
    // before anything is accepted or saved; a failed check throws and nothing is claimed.
    if (wallet && uri.startsWith('lc:network:') && uri.includes(':credential:')) {
        await resolveCredentialForClaim(wallet, uri);
    }

    const [addResult, acceptResult, queryResult] = await Promise.allSettled([
        addVCtoWallet({ uri }),
        wallet ? wallet.invoke.acceptCredential(uri) : Promise.resolve(undefined),
        wallet
            ? wallet.invoke.queryNotifications(
                  { 'data.vcUris': uri, archived: false },
                  { limit: 1 }
              )
            : Promise.resolve(undefined),
    ]);

    // The local wallet write is the user-perceived "credential claimed" event — if it
    // fails we have to surface the error. Server-side issues we just log.
    if (addResult.status === 'rejected') throw addResult.reason;

    const added = addResult.value === true;
    const accepted = acceptResult.status === 'fulfilled' && acceptResult.value === true;

    if (acceptResult.status === 'rejected') {
        log.warn('Failed to accept credential server-side', acceptResult.reason);
    } else if (wallet && added && accepted) {
        // Prompt visibility depends on both the network acceptance and the
        // credential being present locally. Invalidate only after both have
        // succeeded so a fast local write cannot dismiss the prompt early.
        await queryClient.invalidateQueries({ queryKey: connectionPromptKeys.all });
    }

    // Fire-and-forget the notification metadata update. The caller already treats
    // this as claimed — bookkeeping shouldn't block it.
    if (
        wallet &&
        queryResult.status === 'fulfilled' &&
        queryResult.value &&
        typeof queryResult.value !== 'boolean' &&
        queryResult.value.notifications?.[0]?._id
    ) {
        const notifId = queryResult.value.notifications[0]._id;
        void wallet.invoke
            .updateNotificationMeta(notifId, {
                actionStatus: 'COMPLETED',
                read: true,
            })
            .catch((notifErr: unknown) => {
                log.warn('Failed to update notification', notifErr);
            });
    } else if (queryResult.status === 'rejected') {
        log.warn('Failed to query notification', queryResult.reason);
    }

    return { added, accepted };
};
