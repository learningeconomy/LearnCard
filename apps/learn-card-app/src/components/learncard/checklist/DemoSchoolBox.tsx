import React, { useState } from 'react';
import './DemoSchoolBox.css';
import { getLogger } from 'learn-card-base';
const log = getLogger('demo-school-box');

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useTheme } from '../../../theme/hooks/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import {
    switchedProfileStore,
    useCurrentUser,
    useWallet,
    queueAiInsightCredentialRefresh,
} from 'learn-card-base';
import { useConsentFlowByUri } from 'apps/learn-card-app/src/pages/consentFlow/useConsentFlow';
import useJoinLCNetworkModal from '../../network-prompts/hooks/useJoinLCNetworkModal';
import { isProductionNetwork } from 'learn-card-base/helpers/networkHelpers';

import {
    useConfirmation,
    useConsentToContract,
    useContract,
    useDeleteCredentialRecord,
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
import { LCR } from 'learn-card-base/types/credential-records';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

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
    const currentUser = useCurrentUser();
    const { initWallet } = useWallet();

    const demoContractUri = isProductionNetwork() ? flags.demoContractUri : undefined;
    const { data: contract } = useContract(demoContractUri);
    const { hasConsented, consentedContract } = useConsentFlowByUri(demoContractUri);

    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(demoContractUri, contract?.owner?.did ?? '');
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { mutateAsync: withdrawConsent, isPending: isWithdrawingConsent } =
        useWithdrawConsent(demoContractUri);
    const {
        data: contractCredentials,
        isLoading: isLoadingContractCreds,
        refetch: refetchContractCredentials,
        isFetching: isFetchingContractCreds,
    } = useGetCredentialsFromContract(demoContractUri);
    const contractCredentialsExist = (contractCredentials?.length ?? 0) > 0;
    const [isWaitingForContractSync, setIsWaitingForContractSync] = useState(false);
    const [isRefreshingAiInsight, setIsRefreshingAiInsight] = useState(false);

    const resetCache = () => {
        const didWeb = switchedProfileStore.get.switchedDid();
        queryClient.invalidateQueries({
            queryKey: ['useGetCredentialCount', didWeb ?? ''],
        });
        queryClient.invalidateQueries({
            queryKey: ['useGetSkills', didWeb ?? ''],
        });
    };

    const refreshAiInsights = async () => {
        setIsRefreshingAiInsight(true);

        try {
            const wallet = await initWallet();
            await queueAiInsightCredentialRefresh({ wallet, queryClient });
        } finally {
            setIsRefreshingAiInsight(false);
        }
    };

    const waitForDemoContractCredentials = async () => {
        setIsWaitingForContractSync(true);

        try {
            for (let attempt = 0; attempt < 30; attempt += 1) {
                const result = await refetchContractCredentials();
                const syncedCredentials = (result.data as LCR[] | undefined) ?? [];

                if (syncedCredentials.length > 0) return;

                await sleep(1000);
            }

            throw new Error('The demo school is still syncing. Please try again.');
        } finally {
            setIsWaitingForContractSync(false);
        }
    };

    const handleAcceptDemoContract = async () => {
        try {
            await consentToContract({
                terms: getMinimumTermsForContract(contract?.contract, currentUser),
                expiresAt: '',
                oneTime: false,
            });

            // Sync any auto-boost credentials. No need to wait.
            fetchNewContractCredentials();
            await waitForDemoContractCredentials();

            await refreshAiInsights();

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
        }
    };

    const handleEndDemoContract = async () => {
        if (!contractCredentialsExist) {
            presentToast('No Demo credentials found. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }

        withdrawConsent(consentedContract?.uri).then(async () => {
            await Promise.all(
                contractCredentials.map(async contractCred => {
                    await deleteCredentialRecord(contractCred);
                })
            );

            // clear creds from newCredsStore
            const credentialUris = contractCredentials.map(contractCred => contractCred.uri);
            newCredsStore.set.removeCreds(credentialUris);

            await refreshAiInsights();

            presentToast(`Deleted ${contractCredentials.length} Demo credentials`, {
                hasDismissButton: true,
            });
            resetCache();
        });
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

    const isLoading =
        consentingToContract ||
        isLoadingContractCreds ||
        isFetchingContractCreds ||
        isWithdrawingConsent ||
        isWaitingForContractSync ||
        isRefreshingAiInsight;

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
                disabled={isLoading || (hasConsented && !contractCredentialsExist)}
            >
                {hasConsented ? 'Delete Demo School' : 'Sync Demo School'}
                {hasConsented ? (
                    <TrashBin version="2" className="text-white" strokeWidth="2" />
                ) : (
                    <SyncCircleArrows className={isLoading ? 'animate-spin-ccw' : ''} />
                )}
            </button>
        </div>
    );
};

export default DemoSchoolBox;
