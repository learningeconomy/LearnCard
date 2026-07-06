import React, { useState } from 'react';
import './DemoSchoolBox.css';
import { getLogger } from 'learn-card-base';
const log = getLogger('demo-school-box');

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useTheme } from '../../../theme/hooks/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { switchedProfileStore, useCurrentUser, useIsCurrentUserLCNUser } from 'learn-card-base';
import { useConsentFlowByUri } from 'apps/learn-card-app/src/pages/consentFlow/useConsentFlow';
import useJoinLCNetworkModal from '../../network-prompts/hooks/useJoinLCNetworkModal';
import { isProductionNetwork } from 'learn-card-base/helpers/networkHelpers';

import {
    useConfirmation,
    useConsentToContract,
    useContract,
    useDeleteCredentialRecord,
    useAiInsightCredentialMutation,
    useModal,
    useSyncConsentFlow,
    useWithdrawConsent,
    useGetCredentialsFromContract,
    ToastTypeEnum,
    useToast,
    newCredsStore,
} from 'learn-card-base';

import SyncCircleArrows from '../../svgs/SyncCircleArrows';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import TrashBin from '../../svgs/TrashBin';

import { getMinimumTermsForContract } from 'apps/learn-card-app/src/helpers/contract.helpers';

type DemoSchoolBoxProps = {};

const DemoSchoolBox: React.FC<DemoSchoolBoxProps> = ({}) => {
    const { colors } = useTheme();
    const brandingConfig = useBrandingConfig();
    const primaryColor = colors?.defaults?.primaryColor;

    const flags = useFlags();
    const confirm = useConfirmation();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const { closeAllModals } = useModal();
    const currentUser = useCurrentUser()!!!!!!!!!;
    const [isSyncingDemoSchool, setIsSyncingDemoSchool] = useState(false);
    const [isDeletingDemoSchool, setIsDeletingDemoSchool] = useState(false);

    const demoContractUri = isProductionNetwork() ? flags.demoContractUri : undefined;
    const { data: contract } = useContract(demoContractUri);
    const { hasConsented, consentedContract } = useConsentFlowByUri(demoContractUri);

    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(demoContractUri, contract?.owner?.did ?? '');
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { mutateAsync: generateAiInsightCredential } = useAiInsightCredentialMutation();
    const { mutateAsync: withdrawConsent, isPending: isWithdrawingConsent } =
        useWithdrawConsent(demoContractUri);
    const { data: contractCredentials, isLoading: isLoadingContractCreds } =
        useGetCredentialsFromContract(demoContractUri);
    const contractCredentialsExist = (contractCredentials?.length ?? 0) > 0;

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
        setIsSyncingDemoSchool(true);

        try {
            await consentToContract({
                terms: getMinimumTermsForContract(contract?.contract, currentUser),
                expiresAt: '',
                oneTime: false,
            });

            // Sync any auto-boost credentials and wait for the full flow to complete.
            await fetchNewContractCredentials();
            setIsSyncingDemoSchool(false);
            presentToast('You have successfully connected to the demo school.', {
                hasDismissButton: true,
            });
            closeAllModals();

            void generateAiInsightCredential()
                .then(() => {
                    resetCache();
                })
                .catch(error => {
                    log.error(error);
                });
        } catch (error) {
            presentToast('Unable to connect to the demo school. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            log.error(error);
        } finally {
            setIsSyncingDemoSchool(false);
        }
    };

    const handleEndDemoContract = async () => {
        setIsDeletingDemoSchool(true);

        if (!contractCredentialsExist) {
            presentToast('No Demo credentials found. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            setIsDeletingDemoSchool(false);
            return;
        }

        try {
            await withdrawConsent(consentedContract?.uri);
            await Promise.all(
                contractCredentials?.map(async (contractCred: any) => {
                    await deleteCredentialRecord(contractCred);
                })
            );

            // clear creds from newCredsStore
            const credentialUris =
                contractCredentials?.map((contractCred: any) => contractCred.uri) ?? [];
            newCredsStore.set.removeCreds(credentialUris);

            presentToast(`Deleted ${contractCredentials?.length ?? 0} Demo credentials`, {
                hasDismissButton: true,
            });
            resetCache();
        } catch (error) {
            presentToast('Unable to delete the demo school. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            log.error(error);
        } finally {
            setIsDeletingDemoSchool(false);
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

    const isSyncLoading = consentingToContract || isLoadingContractCreds || isSyncingDemoSchool;
    const isDeleteLoading = isWithdrawingConsent || isDeletingDemoSchool;

    return (
        <div className="flex flex-col gap-[20px] items-center justify-center p-[15px] rounded-[15px] bg-white shadow-bottom-2-4 mt-4">
            <div className="flex flex-col gap-[5px]">
                <h2 className="text-grayscale-900 font-notoSans text-[20px] flex items-center">
                    Demo School{' '}
                    {hasConsented && <CircleCheckmark className="h-[32px] w-[32px] ml-auto" />}
                </h2>
                <p className="text-grayscale-600 font-notoSans text-[14px]">
                    Connect to a sample school, sync demo badges and credentials, and explore how{' '}
                    {brandingConfig?.name} works.
                </p>
            </div>

            <button
                className={`py-[7px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px] ${
                    hasConsented ? 'bg-rose-500' : `bg-${primaryColor}`
                }`}
                onClick={hasConsented ? handleEndDemoClick : handleStartDemoClick}
                disabled={
                    isSyncLoading || isDeleteLoading || (hasConsented && !contractCredentialsExist)
                }
            >
                {hasConsented
                    ? isDeleteLoading
                        ? 'Deleting Demo School...'
                        : 'Delete Demo School'
                    : isSyncLoading
                    ? 'Syncing Demo School...'
                    : 'Sync Demo School'}
                {hasConsented ? (
                    isDeleteLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <TrashBin version="2" className="text-white" strokeWidth="2" />
                    )
                ) : (
                    <SyncCircleArrows className={isSyncLoading ? 'animate-spin-ccw' : ''} />
                )}
            </button>
        </div>
    );
};

export default DemoSchoolBox;
