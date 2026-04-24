/*mutations related to boosts */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useWallet, insertItem, switchedProfileStore, CredentialCategory } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { VC, Boost, CredentialRecord, VCValidator } from '@learncard/types';

import { publishWalletEvent } from '../../pages/pathways/events/walletEventBus';

type CredentialRecordMinusId = Omit<CredentialRecord, 'id'>;

export type BoostAndVCType = {
    boost: Boost;
    boostVC: VC;
};

interface AddVCInput extends CredentialRecordMinusId {
    title?: string;
    imgUrl?: string;
    /**
     * Provenance tag forwarded to the pathway-progress `walletEventBus`.
     * Optional — call sites that know their origin (claim-link,
     * dashboard, partner-sdk, …) should set it so downstream UX can
     * surface the right post-claim affordance. Falls back to
     * `'unknown'` when omitted; dedup still works either way.
     */
    eventSource?:
        | 'claim-link'
        | 'claim-raw'
        | 'dashboard'
        | 'vc-api-request'
        | 'vc-api-exchange'
        | 'partner-sdk'
        | 'consent-flow'
        | 'interactions'
        | 'notifications'
        | 'self-issued'
        | 'import';
    /**
     * When supplied, forwarded to the `walletEventBus` so identity
     * extractors can pin the boost URI authoritatively rather than
     * inferring it from the VC body. Callers that claim a LearnCard
     * boost through a non-trivial path (e.g. `claimBoostWithLink`)
     * set this.
     */
    eventBoostUri?: string;
}

type useAddCredentialToWalletReturn = {
    category: CredentialCategory;
    vc: VC;
    uri: string;
    id: string;
};

export const useAddCredentialToWallet = () => {
    const { initWallet, syncCredentialToContracts } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: AddVCInput & {
                didOverride?: string | true; // true for parent user's did
            }
        ) => {
            try {
                const wallet = await initWallet(undefined, input.didOverride);
                const { uri, id, title, imgUrl, didOverride } = input;

                let _id = id;
                if (!uri) throw new Error('No uri was provided, uri required');

                if (!id) _id = uuidv4();

                const vc = await VCValidator.parseAsync(await wallet.read.get(uri));

                const category = getDefaultCategoryForCredential(vc) || 'Achievement';

                const res = await wallet.index.LearnCloud.add({
                    id: _id,
                    uri,
                    category,
                    ...(title ? { title } : {}),
                    ...(imgUrl ? { imgUrl } : {}),
                });

                return {
                    vc,
                    category,
                    uri,
                    id: _id,
                    didOverride,
                    eventSource: input.eventSource,
                    eventBoostUri: input.eventBoostUri,
                };
            } catch (error) {
                console.log('///mutation error', error);
                return Promise.reject(new Error(error));
            }
        },
        onSuccess: async data => {
            const { category, vc, uri, id, didOverride, eventSource, eventBoostUri } = data;

            // Publish a `CredentialIngested` event to the pathway
            // event bus so the progress reactor can match this VC
            // against any active pathway's `requirement-satisfied`
            // terminations. Wrapped in try/catch: a corrupted VC or
            // missing field should never break the core claim flow —
            // the dedup-by-eventId in the bus means a subsequent
            // replay sweep will catch anything we drop here.
            try {
                publishWalletEvent({
                    kind: 'credential-ingested',
                    eventId: uuidv4(),
                    credentialUri: uri,
                    recordId: id,
                    vc: vc as Record<string, unknown>,
                    ingestedAt: new Date().toISOString(),
                    source: eventSource ?? 'unknown',
                    ...(eventBoostUri ? { boostUri: eventBoostUri } : {}),
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[useAddCredentialToWallet] failed to publish ingest event:', err);
            }

            // didOverride === true means this is the parent profile because switchedDid is undefined in the case of the parent
            const didWeb =
                didOverride === true
                    ? undefined
                    : didOverride || switchedProfileStore.get.switchedDid();
            const didForCredentials = didWeb;
            const didForListsAndCounts = didWeb ?? '';

            await queryClient.cancelQueries({
                queryKey: ['useGetCredentialList', didForListsAndCounts, category],
            });
            await queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didForListsAndCounts, category],
            });

            // Update cache
            insertItem(queryClient, ['useGetCredentialList', didForListsAndCounts, category], {
                id,
                category,
                uri,
            });

            // Keep resume-builder selectors and wallet credential views in sync after any issuance.
            // Intentionally don't await these to keep this mutation fast.
            queryClient.invalidateQueries({ queryKey: ['useGetCredentials', didForCredentials] });
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialList', didForListsAndCounts],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialCount', didForListsAndCounts],
            });
            queryClient.invalidateQueries({
                queryKey: ['useGetIDs', didForListsAndCounts],
            });

            queryClient.refetchQueries({
                queryKey: ['useGetCredentials', didForCredentials, category],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetCredentialList', didForListsAndCounts],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetCredentialCount', didForListsAndCounts],
            });
            queryClient.refetchQueries({
                queryKey: ['useGetIDs', didForListsAndCounts],
            });

            await syncCredentialToContracts({ record: data, category });
        },
    });
};
