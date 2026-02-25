import React, { useState, useEffect } from 'react';
import { useImmer } from 'use-immer';
import useConsentFlow from './useConsentFlow';
import { cloneDeep, isEqual } from 'lodash-es';

import {
    useModal,
    useToast,
    useCurrentUser,
    useConfirmation,
    useWithdrawConsent,
    useDeleteCredentialRecord,
    useGetCredentialsFromContract,
    ToastTypeEnum,
    ModalTypes,
    switchedProfileStore,
    newCredsStore,
    LaunchPadAppListItem,
    useWallet,
} from 'learn-card-base';

import ConsentFlowHeader from './ConsentFlowHeader';
import ConsentFlowFooter from './ConsentFlowFooter';
import LockBroken from 'learn-card-base/svgs/LockBroken';
import BrokenLink from '../../components/svgs/BrokenLink';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import ConsentFlowPrivacyAndData from './ConsentFlowPrivacyAndData';
import AiInsightsConsentFlowHeader from './AiInsights/AiInsightsConsentFlowHeader';
import ContractPermissionsAndDetailsText from './ContractPermissionsAndDetailsText';
import AiInsightsInlineConsentFlowRequest from './AiInsights/AiInsightsInlineConsentFlowRequest';
import AiPassportAppProfileContainer from '../../components/ai-passport-apps/AiPassportAppProfileContainer';

import { getMinimumTermsForContract } from '../../helpers/contract.helpers';
import { ConsentFlowContractDetails, ConsentFlowTerms, LCNProfile } from '@learncard/types';

type ConsentFlowConfirmationProps = {
    contractDetails: ConsentFlowContractDetails;
    handleAccept: (
        terms: ConsentFlowTerms,
        shareDuration: { oneTimeShare: boolean; customDuration: string }
    ) => void;
    app?: LaunchPadAppListItem;
    isPreview?: boolean;
    isPostConsent?: boolean;
    hideProfileButton?: boolean;
    insightsProfile?: LCNProfile;
    childInsightsProfile?: LCNProfile;
    isInlineInsightsRequest?: boolean;
    aiInsightsRequestOptions?: {
        className?: string;
        isInline?: boolean;
        useDarkText?: boolean;
        hideCloseButton?: boolean;
    };
    onCloseCallback?: () => void;
    onBackCallback?: () => void;
};

const ConsentFlowConfirmation: React.FC<ConsentFlowConfirmationProps> = ({
    contractDetails,
    handleAccept,
    app,
    isPreview,
    isPostConsent,
    hideProfileButton,
    insightsProfile,
    isInlineInsightsRequest,
    aiInsightsRequestOptions,
    childInsightsProfile,
    onCloseCallback,
    onBackCallback,
}) => {
    const { closeModal, newModal, closeAllModals } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });
    const { presentToast } = useToast();
    const confirm = useConfirmation();

    const currentUser = useCurrentUser();
    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();

    const { consentedContract } = useConsentFlow(contractDetails, app);

    const { name: contractName, image: contractImage } = contractDetails ?? {};
    const { name: appName, img: appImage } = app ?? {};

    const name = appName ?? contractName;
    const image = appImage ?? contractImage;

    const [terms, setTerms] = useImmer(
        contractDetails?.contract
            ? getMinimumTermsForContract(contractDetails.contract, currentUser)
            : ({} as ConsentFlowTerms)
    );
    const [shareDuration, setShareDuration] = useState<{
        oneTimeShare: boolean;
        customDuration: string;
    }>({ oneTimeShare: false, customDuration: '' });

    const openPrivacyAndData = () => {
        newModal(
            <ConsentFlowPrivacyAndData
                contractDetails={contractDetails}
                app={app}
                terms={isPostConsent ? consentedContract?.terms : terms}
                setTerms={setTerms}
                isPostConsent={isPostConsent}
            />
        );
    };

    // When first opening a contract we need to populate credentials for categories with shareAll turned on
    //   We only need to do this once to handle the initial load. Subsequent handling for shareAll will happen via (basically identical) logic in ConsentFlowPrivacyAndData
    const { initWallet } = useWallet();
    const [loadingShareAllCredentials, setLoadingShareAllCredentials] = useState(false);
    useEffect(() => {
        const populateCredsForLiveSync = async () => {
            // we need to populate the terms.read.credentials.categories.[Category].shared array if live syncing (shareAll) is turned on
            const categoriesWithLiveSync = Object.keys(terms.read.credentials.categories).filter(
                category => terms.read.credentials.categories[category].shareAll
            );

            if (categoriesWithLiveSync.length > 0) {
                setLoadingShareAllCredentials(true);
                try {
                    const wallet = await initWallet();

                    const updatedTerms = cloneDeep(terms);
                    await Promise.all(
                        categoriesWithLiveSync.map(async category => {
                            const allCategoryCredUris = (
                                await wallet.index.LearnCloud.get({ category })
                            ).map(item => item.uri);

                            updatedTerms.read.credentials.categories[category].shared =
                                allCategoryCredUris;
                        })
                    );

                    const isUpdated = !isEqual(terms, updatedTerms);

                    if (isUpdated) {
                        setTerms(updatedTerms);
                    }
                } finally {
                    setLoadingShareAllCredentials(false);
                }
            }
        };

        populateCredsForLiveSync();
    }, []);

    const termsUri = consentedContract?.uri;

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { mutateAsync: withdrawConsent, isPending: isWithdrawingConsent } =
        useWithdrawConsent(termsUri);
    const { data: contractCredentials, isLoading: isLoadingContractCreds } =
        useGetCredentialsFromContract(contractDetails.uri);
    const contractCredentialsExist = contractCredentials?.length > 0;

    const handleWithdrawConsent = async (options?: { deleteContractCredentials?: boolean }) => {
        const { deleteContractCredentials = false } = options ?? {};

        withdrawConsent(termsUri).then(async () => {
            if (deleteContractCredentials) {
                try {
                    await Promise.all(
                        contractCredentials?.map(async contractCred => {
                            await deleteCredentialRecord(contractCred);
                        })
                    );

                    // clear creds from newCredsStore
                    const credentialUris = contractCredentials?.map(
                        contractCred => contractCred.uri
                    );
                    newCredsStore.set.removeCreds(credentialUris);

                    presentToast(
                        `Deleted ${contractCredentials?.length} credentials from contract ${contractDetails.name}`,
                        { type: ToastTypeEnum.Success }
                    );
                } catch (e) {
                    presentToast(
                        `Error while deleting credentials from contarct ${contractDetails.name}: ${e.message}`,
                        { type: ToastTypeEnum.Error }
                    );
                }
            }
            closeAllModals();
        });
    };

    const handleWithdrawConsentWithBoostCheck = async () => {
        if (!contractCredentialsExist) {
            handleWithdrawConsent();
            return;
        } else {
            await confirm({
                text: (
                    <div className="flex flex-col gap-[5px] mb-[10px]">
                        <span className="font-[600] text-center">
                            You will be disconnected from this contract
                        </span>
                        <span className="text-center">
                            Do you want to delete all credentials associated with this contract?
                        </span>
                    </div>
                ),
                confirmText: 'Yes',
                cancelText: 'No',
                onConfirm: () => handleWithdrawConsent({ deleteContractCredentials: true }),
                onCancel: () => handleWithdrawConsent({ deleteContractCredentials: false }),
            });
        }
    };

    const handleDisconnect = async () => {
        await confirm({
            text: `Are you sure you want to disconnect from "${contractDetails.name}"?`,
            confirmText: 'Yes',
            cancelText: 'No',
            onConfirm: handleWithdrawConsentWithBoostCheck,
        });
    };

    let mainFooterButtonText = undefined;
    let mainFooterButtonAction = undefined;
    let showBackButton = false;
    let showFullBackButton = false;
    let showCloseButtonAlt = false;
    let secondaryButtonText: string | undefined = isPostConsent ? 'Close' : 'Cancel';

    if (!isPostConsent) {
        mainFooterButtonText = 'Accept';
        mainFooterButtonAction = () => handleAccept(terms, shareDuration);
    } else if (
        isPostConsent &&
        contractDetails.needsGuardianConsent &&
        contractDetails.redirectUrl
    ) {
        mainFooterButtonText = 'Launch Game';
        mainFooterButtonAction = () => {
            window.location.href = contractDetails.redirectUrl as string;
        };
    }

    if (insightsProfile) {
        mainFooterButtonText = 'Share Insights';
        mainFooterButtonAction = () => handleAccept(terms, shareDuration);
        showBackButton = true;
        showCloseButtonAlt = true && !showFullBackButton;
        secondaryButtonText = undefined;

        if (isPostConsent) {
            mainFooterButtonAction = undefined;
            mainFooterButtonText = undefined;
            showFullBackButton = true;
            showCloseButtonAlt = false;
        }
    }

    if (isInlineInsightsRequest) {
        return (
            <AiInsightsInlineConsentFlowRequest
                contractDetails={contractDetails}
                handleOpenPrivacyAndData={openPrivacyAndData}
                handleAccept={() => handleAccept(terms, shareDuration)}
                insightsProfile={insightsProfile}
                options={aiInsightsRequestOptions}
            />
        );
    }

    return (
        <>
            <div className="w-full flex flex-col justify-center items-center gap-[20px] bg-white rounded-[24px] px-[20px] pt-[30px] pb-[10px] shadow-box-bottom">
                {insightsProfile ? (
                    <AiInsightsConsentFlowHeader
                        profile={insightsProfile}
                        childProfile={childInsightsProfile}
                        isPostConsent={isPostConsent}
                    />
                ) : (
                    <ConsentFlowHeader
                        contractDetails={contractDetails}
                        showCurrentUserPic={isSwitchedProfile}
                        app={app}
                        contractImageOnly={isPostConsent}
                    />
                )}

                {!insightsProfile && (
                    <div className="flex flex-col gap-[10px]">
                        {!isPostConsent && (
                            <div className="flex flex-col">
                                {!isSwitchedProfile && (
                                    <>
                                        <div className="w-full text-center text-grayscale-900 text-[17px] font-poppins px-[30px] leading-[130%] tracking-[-0.25px]">
                                            Add to LearnCard.
                                        </div>
                                        <div className="w-full text-center text-grayscale-900 text-[17px] font-poppins px-[10px] leading-[130%] tracking-[-0.25px]">
                                            Save your progress and skills.
                                        </div>
                                    </>
                                )}
                                {isSwitchedProfile && (
                                    <>
                                        <div className="w-full text-center text-grayscale-900 text-[17px] font-poppins px-[30px] leading-[130%] tracking-[-0.25px]">
                                            Add to {currentUser.name}'s
                                        </div>
                                        <div className="w-full text-center text-grayscale-900 text-[17px] font-poppins px-[10px] leading-[130%] tracking-[-0.25px]">
                                            LearnCard
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <ContractPermissionsAndDetailsText
                            contractDetails={contractDetails}
                            app={app}
                            isPostConsent={isPostConsent}
                        />
                    </div>
                )}

                <div className="w-full">
                    <button
                        type="button"
                        onClick={openPrivacyAndData}
                        className="flex gap-[5px] items-center w-full text-grayscale-900 font-notoSans text-[20px] py-[10px] border-t-[1px] border-solid border-grayscale-200"
                    >
                        <LockBroken />
                        Privacy & Data
                        <SlimCaretRight className="h-[20px] w-[20px] ml-auto text-grayscale-500" />
                    </button>

                    {isPostConsent && (
                        <button
                            type="button"
                            onClick={handleDisconnect}
                            className="flex gap-[5px] items-center w-full text-grayscale-900 font-notoSans text-[20px] py-[10px] border-t-[1px] border-solid border-grayscale-200 disabled:opacity-80"
                            disabled={isLoadingContractCreds || isWithdrawingConsent}
                        >
                            <BrokenLink version="2" className="h-[30px] w-[30px]" />
                            {isWithdrawingConsent ? 'Disconnecting...' : 'Disconnect'}
                            <SlimCaretRight className="h-[20px] w-[20px] ml-auto text-grayscale-500" />
                        </button>
                    )}

                    {!hideProfileButton && app && (
                        <button
                            type="button"
                            onClick={() => newModal(<AiPassportAppProfileContainer app={app} />)}
                            className="flex gap-[5px] items-center w-full text-grayscale-900 font-notoSans text-[20px] py-[10px] border-t-[1px] border-solid border-grayscale-200"
                        >
                            <div className="w-[30px] h-[30px] rounded-[10px] border-[1px] border-grayscale-200 border-solid overflow-hidden">
                                <img
                                    src={image}
                                    alt="Contract Icon"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            App Profile
                            <SlimCaretRight className="h-[20px] w-[20px] ml-auto text-grayscale-500" />
                        </button>
                    )}
                </div>
            </div>

            <ConsentFlowFooter
                actionButtonText={mainFooterButtonText}
                onActionButtonClick={mainFooterButtonAction}
                actionButtonDisabled={isPreview || loadingShareAllCredentials}
                secondaryButtonText={secondaryButtonText}
                onSecondaryButtonClick={closeModal}
                showBackButton={showBackButton}
                showFullBackButton={showFullBackButton}
                showCloseButtonAlt={showCloseButtonAlt}
                onCloseCallback={onCloseCallback}
                onBackCallback={onBackCallback}
            />
        </>
    );
};

export default ConsentFlowConfirmation;
