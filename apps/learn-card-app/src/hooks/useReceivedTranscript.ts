import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import { walletStore, switchedProfileStore, getIssuerDid } from 'learn-card-base';
import type { LCR } from 'learn-card-base/types/credential-records';
import { tryFetchResolvedCredential } from 'learn-card-base/react-query/queries/credentialResolution';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/display';

import { readTranscriptReceipt, storeTranscriptReceipt } from './transcriptReceipt';

export type ReceivedTranscriptEntry = { vc: VC; uri: string };

/**
 * Finds the received transcript: first by the URI remembered when it was claimed, then by a
 * fresh index scan for the issuer's ClrCredential (the core index is cache-first, so a
 * normal read can return a list from before the transcript arrived).
 */
export const useReceivedTranscript = ({
    issuerDid,
    requestId,
    enabled = true,
}: {
    issuerDid: string | undefined;
    requestId: string | undefined;
    enabled?: boolean;
}) => {
    const queryClient = useQueryClient();
    const activeWallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const wallet = switchedDid && activeWallet?.id.did() !== switchedDid ? null : activeWallet;
    const accountDid = wallet?.id.did();

    const query = useQuery({
        queryKey: ['receivedTranscript', accountDid, requestId, issuerDid],
        enabled: enabled && Boolean(wallet && issuerDid),
        queryFn: async (): Promise<ReceivedTranscriptEntry | null> => {
            if (!wallet || !accountDid) return null;
            const matches = (vc: VC | undefined): vc is VC =>
                Boolean(vc && getIssuerDid(vc) === issuerDid && vc.type?.includes('ClrCredential'));
            const storedUri = requestId ? readTranscriptReceipt(accountDid, requestId) : null;
            if (storedUri) {
                const vc = await tryFetchResolvedCredential(queryClient, wallet, storedUri);
                if (matches(vc)) return { vc, uri: storedUri };
            }
            const records = await wallet.index.LearnCloud.get<LCR>({}, { cache: 'skip-cache' });
            const entries = await Promise.all(
                records.map(async record => ({
                    uri: record.uri,
                    vc: await tryFetchResolvedCredential(queryClient, wallet, record.uri),
                }))
            );
            const found = entries.find((entry): entry is ReceivedTranscriptEntry =>
                matches(entry.vc)
            );
            if (found && requestId) storeTranscriptReceipt(accountDid, requestId, found.uri);
            return found ?? null;
        },
        retry: false,
    });

    const entry = query.data ?? undefined;
    const model = entry ? normalizeClrTranscriptDisplayModel(entry.vc) : null;
    return { entry, model, accountDid };
};
