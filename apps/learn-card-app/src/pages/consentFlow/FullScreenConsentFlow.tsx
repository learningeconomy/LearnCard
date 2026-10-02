import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';

import {
    isAlreadyConsentedError,
    isConsentConflict,
    useModal,
    useToast,
    useWallet,
    useSyncConsentFlow,
    useConsentToContract,
    switchedProfileStore,
    LaunchPadAppListItem,
    ToastTypeEnum,
    ModalTypes,
    useGetProfile,
    useSwitchProfile,
} from 'learn-card-base';

import useLCNGatedAction from '../../components/network-prompts/hooks/useLCNGatedAction';
import { useGuardianGate } from '../../hooks/useGuardianGate';
import ConsentFlowConnecting from './ConsentFlowConnecting';
import ConsentFlowConfirmation from './ConsentFlowConfirmation';
import ConsentFlowGetAnAdultPrompt from './ConsentFlowGetAnAdult';
import AiPassportAppProfileConnectedView from '../../components/ai-passport-apps/AiPassportAppProfileConnectedView/AiPassportAppProfileConnectedView';

import { ConsentFlowContractDetails, ConsentFlowTerms, LCNProfile } from '@learncard/types';
import * as m from '../../paraglide/messages.js';
import {
    getConsentFlowContractRedirect,
    getConsentFlowDidAuthRedirect,
} from './issueConsentFlowDidAuth';

enum ConsentFlowStep {
    getAnAdult = 'landing',
    confirmation = 'confirmation',
    connecting = 'connecting',
}

type FullScreenConsentFlowProps = {
    contractDetails?: ConsentFlowContractDetails;
    isPreview?: boolean;
    app?: LaunchPadAppListItem;
    isPostConsent?: boolean;
    hideProfileButton?: boolean;
    insightsProfile?: LCNProfile | string;
    childInsightsProfile?: LCNProfile | string;
    successCallback?: () => void;
    isInlineInsightsRequest?: boolean;
    aiInsightsRequestOptions?: {
        className?: string;
        isInline?: boolean;
        useDarkText?: boolean;
        hideCloseButton?: boolean;
    };
    disableRedirect?: boolean;
    beforeSubmit?: () => Promise<void>;
    expectedRequestId?: string;
    onCloseCallback?: () => void;
    onBackCallback?: () => void;
};

const FullScreenConsentFlow: React.FC<FullScreenConsentFlowProps> = ({
    contractDetails: initialContractDetails,
    app,
    isPostConsent,
    isPreview,
    hideProfileButton,
    insightsProfile,
    successCallback,
    isInlineInsightsRequest,
    aiInsightsRequestOptions,
    childInsightsProfile,
    disableRedirect = false,
    beforeSubmit,
    expectedRequestId,
    onCloseCallback,
    onBackCallback,
}) => {
    const history = useHistory();
    const location = useLocation();
    const { initWallet } = useWallet();
    const [refreshedContract, setRefreshedContract] = useState<ConsentFlowContractDetails>();
    const contractDetails =
        refreshedContract?.uri === initialContractDetails?.uri
            ? refreshedContract
            : initialContractDetails;
    const { presentToast } = useToast();
    const { newModal, closeModal, closeAllModals } = useModal();
    const { handleSwitchAccount, handleSwitchBackToParentAccount } = useSwitchProfile();

    const { gate } = useLCNGatedAction();

    const { data: _insightsProfile } = useGetProfile(
        typeof insightsProfile === 'string' ? insightsProfile : undefined,
        !!insightsProfile
    );

    const { data: _childInsightsProfile } = useGetProfile(
        typeof childInsightsProfile === 'string' ? childInsightsProfile : undefined,
        !!childInsightsProfile
    );

    const {
        challenge,
        domain,
        returnTo: urlReturnTo,
        recipientToken,
    } = queryString.parse(location.search);
    const returnTo = urlReturnTo || contractDetails?.redirectUrl?.trim(); // prefer url param
    const shouldDisableRedirect =
        disableRedirect || Boolean(insightsProfile) || Boolean(childInsightsProfile);

    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();
    const profileType = switchedProfileStore.use.profileType();
    const shouldGetAnAdult =
        isSwitchedProfile && profileType === 'child' && !isPreview && !insightsProfile;

    const [step, setStep] = useState<ConsentFlowStep>(
        shouldGetAnAdult ? ConsentFlowStep.getAnAdult : ConsentFlowStep.confirmation
    );
    const [isPostConsentLocal, setIsPostConsentLocal] = useState(false);

    // Guardian gate for child profiles - replaces fragmented usePin logic
    const { guardedAction } = useGuardianGate({
        skip: isPreview || !!insightsProfile,
        onVerified: () => {
            // After guardian verification, proceed to confirmation
            if (step === ConsentFlowStep.getAnAdult) {
                setStep(ConsentFlowStep.confirmation);
            }
        },
    });

    const {
        mutateAsync: consentToContract,
        isPending: consentingToContract,
        publicationRetryAvailable,
        retrySmartResumePublication,
    } = useConsentToContract(
        contractDetails?.uri ?? '',
        contractDetails?.owner?.did ?? '',
        recipientToken as string // For SmartResume only
    );
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const handleSubmit = async (
        submit: (beforeSubmit: () => Promise<void>) => ReturnType<typeof consentToContract>
    ) => {
        const { prompted } = await gate();
        if (prompted) return;

        if (childInsightsProfile) {
            // Switch to child profile to consent on their behalf
            await handleSwitchAccount(_childInsightsProfile as LCNProfile);
        }

        try {
            await guardedAction(async () => {
                setStep(ConsentFlowStep.connecting);

                const { redirectUrl } = await submit(async () => {
                    await guardedAction(() => {});
                    await beforeSubmit?.();
                });

                // Sync any auto-boost credentials (if any). No need to wait.
                fetchNewContractCredentials();

                successCallback?.();

                if (isInlineInsightsRequest) {
                    setIsPostConsentLocal(true);
                    setStep(ConsentFlowStep.confirmation);
                } else if (!successCallback || shouldDisableRedirect) {
                    closeAllModals();
                }

                if (!shouldDisableRedirect) {
                    const contractRedirectUrl = getConsentFlowContractRedirect({
                        challenge,
                        contractRedirectUrl: redirectUrl,
                        domain,
                    });

                    if (contractRedirectUrl) {
                        window.location.href = contractRedirectUrl;
                        return;
                    }

                    if (returnTo && !Array.isArray(returnTo)) {
                        if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                            const wallet = await initWallet();
                            const ownerDid = contractDetails?.owner?.did;

                            if (!ownerDid || !contractDetails?.uri) {
                                throw new Error('Invalid consent request');
                            }

                            window.location.href = await getConsentFlowDidAuthRedirect({
                                challenge,
                                contractUri: contractDetails.uri,
                                domain,
                                ownerDid,
                                returnTo,
                                wallet,
                            });
                        } else history.push(returnTo);
                    }
                }

                if (childInsightsProfile && isSwitchedProfile) {
                    // Switch back to parent profile after consenting on childs behalf
                    await handleSwitchBackToParentAccount();
                }

                presentToast(`Successfully connected to ${app?.name ?? contractDetails?.name}`, {
                    type: ToastTypeEnum.Success,
                });

                if (app) {
                    setTimeout(() => {
                        newModal(
                            <AiPassportAppProfileConnectedView app={app} />,
                            {},
                            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                        );
                    }, 301);
                }
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            const data = e && typeof e === 'object' && 'data' in e ? e.data : undefined;
            const isAlreadyConsented = isAlreadyConsentedError(e);

            if (isAlreadyConsented) {
                successCallback?.();

                if (isInlineInsightsRequest) {
                    setIsPostConsentLocal(true);
                    setStep(ConsentFlowStep.confirmation);
                } else if (!successCallback || shouldDisableRedirect) {
                    closeAllModals();
                }

                if (childInsightsProfile && isSwitchedProfile) {
                    await handleSwitchBackToParentAccount();
                }

                return;
            }

            if (isConsentConflict(e)) {
                try {
                    const wallet = await initWallet();
                    const updated = await wallet.invoke.getContract(contractDetails!.uri);
                    setRefreshedContract(updated);
                } catch {
                    /* Keep the review open if refreshing fails. */
                }
                presentToast(m['consentFlow.reviewChanged'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                setStep(ConsentFlowStep.confirmation);
                return;
            }

            const isGuardianApprovalRequired =
                data &&
                typeof data === 'object' &&
                'code' in data &&
                data.code === 'FORBIDDEN' &&
                /guardian|manager/i.test(message);
            presentToast(
                isGuardianApprovalRequired
                    ? m['consentFlow.guardianApprovalRequired']()
                    : m['error.generic'](),
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
            setStep(ConsentFlowStep.confirmation);
        }
    };

    const handleAccept = (
        terms: ConsentFlowTerms,
        shareDuration: { oneTimeShare: boolean; customDuration: string }
    ) =>
        handleSubmit(beforeSubmit =>
            consentToContract({
                terms,
                expiresAt: shareDuration.customDuration,
                oneTime: shareDuration.oneTimeShare,
                expectedRequestId,
                beforeSubmit,
            })
        );

    const handleNextStep = async () => {
        if (step === ConsentFlowStep.getAnAdult) {
            try {
                await guardedAction(async () => {
                    // The onVerified callback advances only after a signed approval.
                });
            } catch {
                presentToast(m['error.generic'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    const stepToComponent = {
        [ConsentFlowStep.getAnAdult]: (
            <ConsentFlowGetAnAdultPrompt
                contractDetails={contractDetails}
                handleNextStep={handleNextStep}
                isPreview={isPreview}
                app={app}
            />
        ),
        [ConsentFlowStep.confirmation]: (
            <ConsentFlowConfirmation
                key={`${contractDetails?.uri}:${contractDetails?.audienceVersion}`}
                contractDetails={contractDetails}
                app={app}
                handleAccept={handleAccept}
                isPreview={isPreview}
                isPostConsent={isPostConsent || isPostConsentLocal}
                hideProfileButton={hideProfileButton}
                insightsProfile={
                    typeof insightsProfile === 'string' ? _insightsProfile : insightsProfile
                }
                childInsightsProfile={
                    typeof childInsightsProfile === 'string'
                        ? _childInsightsProfile
                        : childInsightsProfile
                }
                isInlineInsightsRequest={isInlineInsightsRequest}
                aiInsightsRequestOptions={aiInsightsRequestOptions}
                onCloseCallback={onCloseCallback}
                onBackCallback={onBackCallback}
            />
        ),
        [ConsentFlowStep.connecting]: (
            <ConsentFlowConnecting
                contractDetails={contractDetails}
                app={app}
                tempHandleBack={() => {
                    setStep(ConsentFlowStep.confirmation);
                }}
            />
        ),
    };

    if (publicationRetryAvailable && step === ConsentFlowStep.confirmation) {
        return (
            <div
                role="alert"
                className="font-poppins p-6 bg-white rounded-[20px] space-y-4 text-grayscale-900"
            >
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['consentFlow.retryPublication']()}
                </p>
                <button
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm disabled:opacity-40"
                    disabled={consentingToContract}
                    onClick={() => void handleSubmit(retrySmartResumePublication)}
                >
                    {m['common.tryAgain']()}
                </button>
                <button
                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm"
                    onClick={closeModal}
                >
                    {m['common.cancel']()}
                </button>
            </div>
        );
    }

    // If this is an inline insights request, render the confirmation page
    // in a minimal view
    if (isInlineInsightsRequest) {
        return stepToComponent[step];
    }

    return (
        <div className="h-full w-full flex items-center justify-center overflow-y-auto">
            <div className="px-[30px] pt-[60px] pb-[120px] max-w-[420px] w-full">
                {stepToComponent[step]}
            </div>
        </div>
    );
};

export default FullScreenConsentFlow;
