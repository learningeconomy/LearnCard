import React, { useMemo, useState } from 'react';
import './DemoSchoolBox.css';
import { getLogger } from 'learn-card-base';
const log = getLogger('demo-school-box');

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useTheme } from '../../../theme/hooks/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { LCR } from 'learn-card-base/types/credential-records';
import { switchedProfileStore, useConsentedContracts, useCurrentUser } from 'learn-card-base';
import { isProductionNetwork } from 'learn-card-base/helpers/networkHelpers';

import {
    useConfirmation,
    useConsentToContract,
    useContract,
    useDeleteCredentialRecord,
    useWallet,
    useModal,
    useSyncConsentFlow,
    useWithdrawConsent,
    useGetCredentialsFromContracts,
    deleteCredentialFromAllContracts,
    queueAiInsightCredentialRefresh,
    ToastTypeEnum,
    useToast,
    newCredsStore,
} from 'learn-card-base';

import SyncCircleArrows from '../../svgs/SyncCircleArrows';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import TrashBin from '../../svgs/TrashBin';

import { getMinimumTermsForContract } from 'apps/learn-card-app/src/helpers/contract.helpers';

type DemoSchoolFlags = {
    demoContractUri?: unknown;
    legacyDemoContractUris?: unknown;
};

type DemoSchoolBoxProps = {};

type DemoSchoolStatus = 'idle' | 'connecting' | 'syncing' | 'disconnecting' | 'deleting';

const DemoSchoolBox: React.FC<DemoSchoolBoxProps> = ({}) => {
    const { colors } = useTheme();
    const brandingConfig = useBrandingConfig();
    const primaryColor = colors?.defaults?.primaryColor;
    const { initWallet } = useWallet();

    const flags = useFlags<DemoSchoolFlags>();
    const confirm = useConfirmation();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const { closeAllModals } = useModal();
    const currentUser = useCurrentUser();
    const [demoSchoolStatus, setDemoSchoolStatus] = useState<DemoSchoolStatus>('idle');

    const demoContractUri =
        isProductionNetwork() && typeof flags.demoContractUri === 'string'
            ? flags.demoContractUri
            : undefined;
    const legacyDemoContractUris = useMemo(
        () =>
            Array.isArray(flags.legacyDemoContractUris)
                ? flags.legacyDemoContractUris.filter(
                      (uri): uri is string => typeof uri === 'string' && uri.length > 0
                  )
                : [],
        [flags.legacyDemoContractUris]
    );
    const demoContractUris = useMemo(
        () => [
            ...new Set(
                [demoContractUri, ...legacyDemoContractUris].filter((uri): uri is string =>
                    Boolean(uri)
                )
            ),
        ],
        [demoContractUri, legacyDemoContractUris]
    );
    const { data: contract } = useContract(demoContractUri);
    const { data: consentedContracts, isLoading: consentedContractsLoading } =
        useConsentedContracts();
    const consentedDemoContracts = useMemo(() => {
        const demoContractUriSet = new Set(demoContractUris);

        return (
            consentedContracts?.filter(
                consent =>
                    consent?.contract?.uri &&
                    demoContractUriSet.has(consent.contract.uri) &&
                    consent.status !== 'withdrawn'
            ) ?? []
        );
    }, [consentedContracts, demoContractUris]);
    const hasConsented = consentedDemoContracts.length > 0;

    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(demoContractUri, contract?.owner?.did ?? '');
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { mutateAsync: withdrawConsent, isPending: isWithdrawingConsent } = useWithdrawConsent();
    const { data: contractCredentials, isLoading: isLoadingContractCreds } =
        useGetCredentialsFromContracts(demoContractUris);
    const contractCredentialsExist = (contractCredentials?.length ?? 0) > 0;
    const demoSchoolDataExists = hasConsented || contractCredentialsExist;

    const resetCache = () => {
        const didWeb = switchedProfileStore.get.switchedDid();
        queryClient.invalidateQueries({
            queryKey: ['useGetCredentialCount', didWeb ?? ''],
        });
        queryClient.invalidateQueries({
            queryKey: ['useGetSkills', didWeb ?? ''],
        });
    };

    const handleAcceptDemoContract = async () => {
        setDemoSchoolStatus('connecting');

        try {
            await consentToContract({
                terms: getMinimumTermsForContract(contract?.contract, currentUser),
                expiresAt: '',
                oneTime: false,
            });

            setDemoSchoolStatus('syncing');

            // Sync any auto-boost credentials and wait for the full flow to complete.
            await fetchNewContractCredentials();
            resetCache();

            presentToast('You have successfully connected to the demo school.', {
                hasDismissButton: true,
            });
            closeAllModals();
        } catch (error) {
            presentToast('Unable to connect to the demo school. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            log.error(error);
        } finally {
            setDemoSchoolStatus('idle');
        }
    };

    const handleEndDemoContract = async () => {
        setDemoSchoolStatus('disconnecting');

        if (isLoadingContractCreds || consentedContractsLoading) {
            setDemoSchoolStatus('idle');
            return;
        }

        if (!demoSchoolDataExists) {
            presentToast('No Demo credentials found. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            setDemoSchoolStatus('idle');
            return;
        }

        try {
            const consentUris = consentedDemoContracts
                .map(consent => consent.uri)
                .filter((uri): uri is string => Boolean(uri));

            await Promise.all(consentUris.map(uri => withdrawConsent(uri)));

            setDemoSchoolStatus('deleting');

            const credentialsToDelete: LCR[] = contractCredentials ?? [];
            const deletedUris = new Set<string>();

            for (const contractCred of credentialsToDelete) {
                const deleteResult = await deleteCredentialRecord({
                    ...contractCred,
                    skipPostDeleteCleanup: true,
                    ignoreMissingRemoteRecord: true,
                });

                const deletedCredentialUris =
                    deleteResult?.deletedUris ?? (contractCred.uri ? [contractCred.uri] : []);
                deletedCredentialUris.forEach(uri => deletedUris.add(uri));
            }

            // clear creds from newCredsStore
            const deletedUrisList = [...deletedUris];
            newCredsStore.set.removeCreds(deletedUrisList);

            const wallet = await initWallet();

            const cleanupResult = await deleteCredentialFromAllContracts({
                wallet,
                queryClient,
                deletedUris: deletedUrisList,
            });

            const didWeb = switchedProfileStore.get.switchedDid();
            queryClient.invalidateQueries({ queryKey: ['useGetCredentials', didWeb ?? ''] });
            queryClient.invalidateQueries({ queryKey: ['useGetCredentialList', didWeb ?? ''] });
            queryClient.invalidateQueries({ queryKey: ['boosts'] });
            demoContractUris.forEach(uri => {
                queryClient.invalidateQueries({
                    queryKey: ['useGetCredentialsFromContract', uri, didWeb ?? ''],
                });
            });

            await queueAiInsightCredentialRefresh({
                wallet,
                queryClient,
            });

            presentToast(`Deleted ${contractCredentials?.length ?? 0} Demo credentials`, {
                hasDismissButton: true,
            });
            log.debug('Demo School cleanup completed', {
                deletedUriCount: deletedUrisList.length,
                contractsWithdrawn: consentedDemoContracts.length,
                contractsUpdated: cleanupResult.contractsUpdated,
                removedSharedUris: cleanupResult.removedSharedUris,
            });
            resetCache();
            closeAllModals();
        } catch (error) {
            presentToast('Unable to delete the demo school. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            log.error(error);
        } finally {
            setDemoSchoolStatus('idle');
        }
    };

    const handleStartDemoClick = async () => {
        const confirmed = await confirm({
            text: 'Are you sure you want to sync with the demo school? This will import multiple sample credentials, but you can easily delete them later.',
            confirmText: 'Yes',
            cancelText: 'No',
        });

        // ^^ await confirmation
        if (confirmed) {
            await handleAcceptDemoContract();
        }
    };

    const handleEndDemoClick = async () => {
        const confirmed = await confirm({
            text: 'Are you sure you want to delete all demo content? This action can’t be undone, but you can reload the demo content later if needed.',
            confirmText: 'Yes',
            cancelText: 'No',
        });

        // await confirmation
        if (confirmed) {
            await handleEndDemoContract();
        }
    };

    const isDemoSchoolLookupLoading =
        consentedContractsLoading || (demoContractUris.length > 0 && isLoadingContractCreds);
    const isSyncLoading =
        consentingToContract || demoSchoolStatus === 'connecting' || demoSchoolStatus === 'syncing';
    const isDeleteLoading =
        isWithdrawingConsent ||
        demoSchoolStatus === 'disconnecting' ||
        demoSchoolStatus === 'deleting';
    const isDemoSchoolButtonDisabled =
        isDemoSchoolLookupLoading ||
        isSyncLoading ||
        isDeleteLoading ||
        (!demoSchoolDataExists && !demoContractUri);

    const getDemoSchoolButtonClassName = (): string => {
        if (isDeleteLoading) return 'bg-red-500';
        if (isSyncLoading) return `bg-${primaryColor}`;

        return demoSchoolDataExists ? 'bg-rose-500' : `bg-${primaryColor}`;
    };

    return (
        <div className="flex flex-col gap-[20px] items-center justify-center p-[15px] rounded-[15px] bg-white shadow-bottom-2-4 mt-4">
            <div className="flex flex-col gap-[5px]">
                <h2 className="text-grayscale-900 font-notoSans text-[20px] flex items-center">
                    Demo School{' '}
                    {demoSchoolDataExists && (
                        <CircleCheckmark className="h-[32px] w-[32px] ml-auto" />
                    )}
                </h2>
                <p className="text-grayscale-600 font-notoSans text-[14px]">
                    Connect to a sample school, sync demo badges and credentials, and explore how{' '}
                    {brandingConfig?.name} works.
                </p>
            </div>

            <button
                className={`py-[7px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px] ${getDemoSchoolButtonClassName()}`}
                onClick={demoSchoolDataExists ? handleEndDemoClick : handleStartDemoClick}
                disabled={isDemoSchoolButtonDisabled}
            >
                {isDemoSchoolLookupLoading
                    ? 'Checking Demo School...'
                    : isSyncLoading
                    ? demoSchoolStatus === 'connecting'
                        ? 'Connecting to Demo School...'
                        : 'Syncing Credentials...'
                    : isDeleteLoading
                    ? demoSchoolStatus === 'disconnecting'
                        ? 'Disconnecting From Demo School...'
                        : 'Deleting Demo Credentials...'
                    : demoSchoolDataExists
                    ? 'Delete Demo School'
                    : 'Sync Demo School'}
                {isDemoSchoolLookupLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSyncLoading ? (
                    <SyncCircleArrows className="animate-spin-ccw" />
                ) : isDeleteLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : demoSchoolDataExists ? (
                    <TrashBin version="2" className="text-white" strokeWidth="2" />
                ) : (
                    <SyncCircleArrows />
                )}
            </button>
        </div>
    );
};

export default DemoSchoolBox;
