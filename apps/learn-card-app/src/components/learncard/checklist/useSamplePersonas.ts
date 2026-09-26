import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    deleteCredentialFromAllContracts,
    getLogger,
    newCredsStore,
    queueAiInsightCredentialRefresh,
    switchedProfileStore,
    ToastTypeEnum,
    useConsentedContracts,
    useDeleteCredentialRecord,
    useGetCredentialsFromContracts,
    useToast,
    useWallet,
    useWithdrawConsent,
} from 'learn-card-base';
import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';
import type { LCR } from 'learn-card-base/types/credential-records';

import * as m from '../../../paraglide/messages.js';

const log = getLogger('sample-personas');

type RemovalStatus = 'idle' | 'disconnecting' | 'deleting';

export const useSamplePersonas = () => {
    const features = useFeatureConfig();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const [removalStatus, setRemovalStatus] = useState<RemovalStatus>('idle');

    const personas = features.samplePersonas;
    const allContractUris = useMemo(
        () => [
            ...new Set([
                ...personas.map(persona => persona.contractUri),
                ...features.legacySamplePersonaContractUris,
            ]),
        ],
        [features.legacySamplePersonaContractUris, personas]
    );
    const allContractUriSet = useMemo(() => new Set(allContractUris), [allContractUris]);

    const { data: consentedContracts, isLoading: consentedContractsLoading } =
        useConsentedContracts();
    const consentedSampleContracts = useMemo(
        () =>
            consentedContracts?.filter(
                consent =>
                    consent?.contract?.uri &&
                    allContractUriSet.has(consent.contract.uri) &&
                    consent.status !== 'withdrawn'
            ) ?? [],
        [allContractUriSet, consentedContracts]
    );
    const { data: contractCredentials, isLoading: contractCredentialsLoading } =
        useGetCredentialsFromContracts(allContractUris);
    const sampleDataExists =
        consentedSampleContracts.length > 0 || (contractCredentials?.length ?? 0) > 0;

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { mutateAsync: withdrawConsent, isPending: isWithdrawingConsent } = useWithdrawConsent();

    const refreshSampleCaches = (): void => {
        const didWeb = switchedProfileStore.get.switchedDid();
        queryClient.invalidateQueries({ queryKey: ['useGetCredentialCount', didWeb ?? ''] });
        queryClient.invalidateQueries({ queryKey: ['useGetCredentials', didWeb ?? ''] });
        queryClient.invalidateQueries({ queryKey: ['useGetCredentialList', didWeb ?? ''] });
        queryClient.invalidateQueries({ queryKey: ['useGetSkills', didWeb ?? ''] });
        queryClient.invalidateQueries({ queryKey: ['boosts'] });

        allContractUris.forEach(uri => {
            queryClient.invalidateQueries({
                queryKey: ['useGetCredentialsFromContract', uri, didWeb ?? ''],
            });
        });
    };

    const removeSampleCredentials = async (): Promise<boolean> => {
        if (contractCredentialsLoading || consentedContractsLoading || !sampleDataExists)
            return false;

        setRemovalStatus('disconnecting');

        try {
            const consentUris = consentedSampleContracts
                .map(consent => consent.uri)
                .filter((uri): uri is string => Boolean(uri));
            await Promise.all(consentUris.map(uri => withdrawConsent(uri)));

            setRemovalStatus('deleting');
            const credentialsToDelete: LCR[] = contractCredentials ?? [];
            const deletedUris = new Set<string>();

            for (const contractCredential of credentialsToDelete) {
                const result = await deleteCredentialRecord({
                    ...contractCredential,
                    skipPostDeleteCleanup: true,
                    ignoreMissingRemoteRecord: true,
                });
                const removedUris =
                    result?.deletedUris ?? (contractCredential.uri ? [contractCredential.uri] : []);
                removedUris.forEach(uri => deletedUris.add(uri));
            }

            const deletedUriList = [...deletedUris];
            newCredsStore.set.removeCreds(deletedUriList);

            const wallet = await initWallet();
            const cleanupResult = await deleteCredentialFromAllContracts({
                wallet,
                queryClient,
                deletedUris: deletedUriList,
            });

            refreshSampleCaches();
            try {
                await queueAiInsightCredentialRefresh({ wallet, queryClient });
            } catch (refreshError) {
                log.warn(
                    'Sample credentials were removed, but AI insight refresh failed',
                    refreshError
                );
            }
            presentToast(
                m['passport.buildMyLearnCard.samplePersona.removeSuccess']({
                    count: contractCredentials?.length ?? 0,
                }),
                { hasDismissButton: true }
            );
            log.debug('Sample credential cleanup completed', {
                deletedUriCount: deletedUriList.length,
                contractsWithdrawn: consentedSampleContracts.length,
                contractsUpdated: cleanupResult.contractsUpdated,
                removedSharedUris: cleanupResult.removedSharedUris,
            });
            return true;
        } catch (error) {
            presentToast(m['passport.buildMyLearnCard.samplePersona.removeError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            log.error(error);
            return false;
        } finally {
            setRemovalStatus('idle');
        }
    };

    return {
        personas,
        allContractUris,
        sampleDataExists,
        isLoading:
            consentedContractsLoading ||
            (contractCredentialsLoading && consentedSampleContracts.length === 0),
        isRemoving:
            isWithdrawingConsent ||
            removalStatus !== 'idle' ||
            (sampleDataExists && contractCredentialsLoading),
        removalStatus,
        refreshSampleCaches,
        removeSampleCredentials,
    };
};
