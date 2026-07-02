import React from 'react';
import './DemoSchoolBox.css';
import * as m from '../../../paraglide/messages.js';
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

    const demoContractUri = isProductionNetwork() ? flags.demoContractUri : undefined;
    const { data: contract } = useContract(demoContractUri);
    const { hasConsented, consentedContract } = useConsentFlowByUri(demoContractUri);

    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(demoContractUri, contract?.owner?.did ?? '');
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
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
        try {
            await consentToContract({
                terms: getMinimumTermsForContract(contract?.contract, currentUser),
                expiresAt: '',
                oneTime: false,
            });

            // Sync any auto-boost credentials. No need to wait.
            fetchNewContractCredentials();
            resetCache();
            presentToast(m['passport.buildMyLearnCard.demoSchool.connectSuccess'](), {
                hasDismissButton: true,
            });
            closeAllModals();
        } catch (error) {
            presentToast(m['passport.buildMyLearnCard.demoSchool.connectError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            log.error(error);
        }
    };

    const handleEndDemoContract = async () => {
        if (!contractCredentialsExist) {
            presentToast(m['passport.buildMyLearnCard.demoSchool.noCredentials'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }

        withdrawConsent(consentedContract?.uri).then(async () => {
            await Promise.all(
                contractCredentials?.map(async contractCred => {
                    await deleteCredentialRecord(contractCred);
                })
            );

            // clear creds from newCredsStore
            const credentialUris = contractCredentials?.map(contractCred => contractCred.uri) ?? [];
            newCredsStore.set.removeCreds(credentialUris);

            presentToast(
                m['passport.buildMyLearnCard.demoSchool.deletedCount']({
                    count: contractCredentials?.length ?? 0,
                }),
                {
                    hasDismissButton: true,
                }
            );
            resetCache();
        });
    };

    const handleStartDemoClick = async () => {
        const confirmed = await confirm({
            text: m['passport.buildMyLearnCard.demoSchool.confirmSync'](),
            confirmText: <span className="mr-[30px]">{m['common.yes']()}</span>,
            cancelText: <span>{m['common.no']()}</span>,
        });

        // ^^ await confirmation
        if (confirmed) {
            await handleAcceptDemoContract();
        }
    };

    const handleEndDemoClick = async () => {
        const confirmed = await confirm({
            text: m['passport.buildMyLearnCard.demoSchool.confirmDelete'](),
            confirmText: <span className="mr-[30px]">{m['common.yes']()}</span>,
            cancelText: <span>{m['common.no']()}</span>,
        });

        // await confirmation
        if (confirmed) {
            await handleEndDemoContract();
        }
    };

    const isLoading = consentingToContract || isLoadingContractCreds || isWithdrawingConsent;

    return (
        <div className="flex flex-col gap-[20px] items-center justify-center p-[15px] rounded-[15px] bg-white shadow-bottom-2-4 mt-4">
            <div className="flex flex-col gap-[5px]">
                <h2 className="text-grayscale-900 font-notoSans text-[20px] flex items-center">
                    {m['passport.buildMyLearnCard.demoSchool.title']()}{' '}
                    {hasConsented && <CircleCheckmark className="h-[32px] w-[32px] ml-auto" />}
                </h2>
                <p className="text-grayscale-600 font-notoSans text-[14px]">
                    {m['passport.buildMyLearnCard.demoSchool.description']({
                        brand: brandingConfig?.name ?? '',
                    })}
                </p>
            </div>

            <button
                className={`py-[7px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px] ${
                    hasConsented ? 'bg-rose-500' : `bg-${primaryColor}`
                }`}
                onClick={hasConsented ? handleEndDemoClick : handleStartDemoClick}
                disabled={isLoading || (hasConsented && !contractCredentialsExist)}
            >
                {hasConsented
                    ? m['passport.buildMyLearnCard.demoSchool.delete']()
                    : m['passport.buildMyLearnCard.demoSchool.sync']()}
                {hasConsented ? (
                    <TrashBin version="2" className="text-white" strokeWidth="2" />
                ) : (
                    <SyncCircleArrows className={isLoading ? 'animate-spin' : ''} />
                )}
            </button>
        </div>
    );
};

export default DemoSchoolBox;
