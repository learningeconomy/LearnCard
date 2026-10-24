import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { CredentialRecord, VC } from '@learncard/types';
import { CredentialCategoryEnum, switchedProfileStore, useWallet } from 'learn-card-base';
import { getIssuanceDate } from 'learn-card-base/helpers/credentialHelpers';
import type { VC_WITH_URI } from './vcQueries';
import { fetchResolvedCredential } from './credentialResolution';

// Use a distinct key so persisted flat VC+uri objects cannot enter the new record shape.
export const getIDsQueryKey = (did?: string): readonly ['useGetIDs', string, 'records'] => [
    'useGetIDs',
    did ?? '',
    'records',
];

/** Return earned membership IDs with their storage locator outside the signed credential. */
export const useGetIDs = (): UseQueryResult<VC_WITH_URI[]> => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<VC_WITH_URI[]>({
        queryKey: getIDsQueryKey(switchedDid),
        queryFn: async () => {
            const wallet = await initWallet();
            const records: CredentialRecord[] = (
                await Promise.all(
                    [
                        CredentialCategoryEnum.globalAdminId,
                        CredentialCategoryEnum.nationalNetworkAdminId,
                        CredentialCategoryEnum.troopLeaderId,
                        CredentialCategoryEnum.scoutId,
                    ].map(category => wallet.index.LearnCloud.get({ category }))
                )
            ).flat();

            const resolved = await Promise.all(
                records.map(async (record): Promise<VC_WITH_URI | undefined> => {
                    // Preserve main's partial-read behavior while sharing successful document reads.
                    let vc: VC;
                    try {
                        vc = await fetchResolvedCredential(queryClient, wallet, record.uri);
                    } catch {
                        return undefined;
                    }
                    // Never spread storage metadata onto a VC: verification, export and
                    // sharing must receive the exact signed JSON returned by storage.
                    return vc ? { vc, uri: record.uri } : undefined;
                })
            );

            return resolved
                .filter((record): record is VC_WITH_URI => Boolean(record))
                .sort((a, b) => {
                    const aDate = getIssuanceDate(a.vc) ?? '';
                    const bDate = getIssuanceDate(b.vc) ?? '';
                    return bDate.localeCompare(aDate);
                });
        },
    });
};
