import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import usePin from 'apps/learn-card-app/src/hooks/usePin';

import {
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
import ConsentFlowConnecting from './ConsentFlowConnecting';
import ConsentFlowConfirmation from './ConsentFlowConfirmation';
import ConsentFlowGetAnAdultPrompt from './ConsentFlowGetAnAdult';
import AiPassportAppProfileConnectedView from '../../components/ai-passport-apps/AiPassportAppProfileConnectedView/AiPassportAppProfileConnectedView';

import { ConsentFlowContractDetails, ConsentFlowTerms, LCNProfile } from '@learncard/types';

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
    onCloseCallback?: () => void;
    onBackCallback?: () => void;
};

const FullScreenConsentFlow: React.FC<FullScreenConsentFlowProps> = ({
    contractDetails,
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
    onCloseCallback,
    onBackCallback,
}) => {
    const history = useHistory();
    const location = useLocation();
    const { initWallet } = useWallet();
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

    const { returnTo: urlReturnTo, recipientToken } = queryString.parse(location.search);
    const returnTo = urlReturnTo || contractDetails?.redirectUrl?.trim(); // prefer url param

    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();
    const shouldGetAnAdult = isSwitchedProfile && !isPreview && !insightsProfile;

    const [step, setStep] = useState<ConsentFlowStep>(
        shouldGetAnAdult ? ConsentFlowStep.getAnAdult : ConsentFlowStep.confirmation
    );

    const { handleVerifyParentPin } = usePin(closeModal);

    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(
            contractDetails?.uri ?? '',
            contractDetails?.owner?.did ?? '',
            recipientToken as string // For SmartResume only
        );
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const handleAccept = async (
        terms: ConsentFlowTerms,
        shareDuration: {
            oneTimeShare: boolean;
            customDuration: string;
        }
    ) => {
        const { prompted } = await gate();
        if (prompted) return;

        if (childInsightsProfile) {
            // Switch to child profile to consent on their behalf
            await handleSwitchAccount(_childInsightsProfile as LCNProfile);
        }

        setStep(ConsentFlowStep.connecting);

        try {
            const { redirectUrl } = await consentToContract({
                terms,
                expiresAt: shareDuration.customDuration,
                oneTime: shareDuration.oneTimeShare,
            });

            // Sync any auto-boost credentials (if any). No need to wait.
            fetchNewContractCredentials();

            if (successCallback) {
                successCallback?.();
            } else {
                closeAllModals();
            }

            if (!disableRedirect) {
                if (redirectUrl) {
                    // If the consentToContract call returned a specific redirect url, use it over everything else
                    window.location.href = redirectUrl;
                    return;
                }

                if (returnTo && !Array.isArray(returnTo)) {
                    if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                        const wallet = await initWallet();

                        // add user's did to returnTo url
                        const urlObj = new URL(returnTo);
                        urlObj.searchParams.set('did', wallet.id.did());

                        if (contractDetails?.owner?.did) {
                            const unsignedDelegateCredential = wallet.invoke.newCredential({
                                type: 'delegate',
                                subject: contractDetails?.owner.did,
                                access: ['read', 'write'],
                            });

                            const delegateCredential = await wallet.invoke.issueCredential(
                                unsignedDelegateCredential
                            );

                            const unsignedDidAuthVp: any = await wallet.invoke.newPresentation(
                                delegateCredential
                            );

                            // Add contractUri to VP before signing for xAPI tracking
                            if (contractDetails?.uri) {
                                unsignedDidAuthVp.contractUri = contractDetails.uri;
                            }

                            const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                                proofPurpose: 'authentication',
                                proofFormat: 'jwt',
                            })) as any as string;

                            urlObj.searchParams.set('vp', vp);
                        }

                        window.location.href = urlObj.toString();
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
        } catch (e) {
            console.error(e);
            presentToast(`Failed to accept contract: ${e.message}`, {
                type: ToastTypeEnum.Error,
            });
            setStep(ConsentFlowStep.confirmation);
        }
    };

    const handleNextStep = async () => {
        if (step === ConsentFlowStep.getAnAdult) {
            if (isSwitchedProfile) {
                // todo show current user on confirmation page in this case
                await handleVerifyParentPin({
                    switchToParentAfterPin: false,
                    closeButtonText: 'Back',
                    onSuccess: () => {
                        setStep(ConsentFlowStep.confirmation);
                        closeModal();
                    },
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
                contractDetails={contractDetails}
                app={app}
                handleAccept={handleAccept}
                isPreview={isPreview}
                isPostConsent={isPostConsent}
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
