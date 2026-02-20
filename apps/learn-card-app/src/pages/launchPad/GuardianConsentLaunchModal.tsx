import React, { useEffect, useState } from 'react';

import { IonSpinner } from '@ionic/react';
import { ConsentFlowContractDetails, ConsentFlowTerms, LCNProfile } from '@learncard/types';
import { useImmer } from 'use-immer';

import {
    ModalTypes,
    useModal,
    useIsLoggedIn,
    useWallet,
    useConsentToContract,
    useCurrentUser,
    useGetCurrentLCNUser,
    useSwitchProfile,
    useSyncConsentFlow,
    switchedProfileStore,
    UserProfilePicture,
} from 'learn-card-base';

import useGetFamilyCredential from '../../hooks/useGetFamilyCredential';
import { useGuardianGate } from '../../hooks/useGuardianGate';
import AccountSwitcherModal from '../../components/learncard/AccountSwitcherModal';
import FamilyCMS from '../../components/familyCMS/FamilyCMS';
import { getMinimumTermsForContract } from '../../helpers/contract.helpers';
import useConsentFlow from '../consentFlow/useConsentFlow';

enum LaunchStep {
    loading = 'loading',
    selectProfile = 'selectProfile',
    createFamily = 'createFamily',
    confirmConsent = 'confirmConsent',
    launching = 'launching',
}

type GuardianConsentLaunchModalProps = {
    contractDetails: ConsentFlowContractDetails;
    redirectUrl: string;
    onCancel?: () => void;
};

const GuardianConsentLaunchModal: React.FC<GuardianConsentLaunchModalProps> = ({
    contractDetails,
    redirectUrl,
    onCancel,
}) => {
    const { closeModal, closeAllModals, newModal } = useModal();
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();

    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();
    const { familyCredential } = useGetFamilyCredential();
    const hasFamily = !!familyCredential || isSwitchedProfile;

    // Guardian gate for child profiles - unified guardian verification
    const { guardedAction } = useGuardianGate({
        onCancel: () => {
            closeAllModals();
            onCancel?.();
        },
    });
    const { handleSwitchAccount } = useSwitchProfile();

    const [step, setStep] = useState<LaunchStep>(LaunchStep.loading);
    const [selectedUser, setSelectedUser] = useState<LCNProfile | undefined>();
    const [isProcessing, setIsProcessing] = useState(false);

    // Consent state for selected user
    const { hasConsented: selectedUserHasConsented } = useConsentFlow(contractDetails);

    const [terms, setTerms] = useImmer(
        contractDetails?.contract && currentUser
            ? getMinimumTermsForContract(contractDetails.contract, currentUser)
            : ({} as ConsentFlowTerms)
    );

    const { mutateAsync: consentToContract } = useConsentToContract(
        contractDetails?.uri ?? '',
        contractDetails?.owner?.did ?? ''
    );

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    // Determine initial step based on state
    useEffect(() => {
        const determineStep = async () => {
            if (!isLoggedIn) {
                // Not logged in - they need to log in first
                // For now, just close and let them log in via normal flow
                closeAllModals();
                return;
            }

            if (!hasFamily) {
                setStep(LaunchStep.createFamily);
            } else {
                setStep(LaunchStep.selectProfile);
            }
        };

        determineStep();
    }, [isLoggedIn, hasFamily]);

    // Handle profile selection
    const handleProfileSelected = async (user: LCNProfile) => {
        setSelectedUser(user);

        // Switch to selected profile if different
        if (currentLCNUser?.did !== user.did) {
            await handleSwitchAccount(user);
        }

        // Check if this user already has consent - if so, launch directly
        // Note: We need to re-check consent after switching profiles
        setStep(LaunchStep.confirmConsent);
    };

    // Handle consent and launch
    const handleConsentAndLaunch = async () => {
        if (!selectedUser) return;

        await guardedAction(async () => {
            setIsProcessing(true);

            try {
                // Consent to contract for selected user
                await consentToContract({
                    terms,
                    expiresAt: '',
                    oneTime: false,
                });

                // Sync credentials in background
                fetchNewContractCredentials();

                // Launch with redirect
                await launchWithCredentials(selectedUser.did);
            } catch (error) {
                console.error('Failed to consent:', error);
                setIsProcessing(false);
            }
        });
    };

    // Launch directly (for users who already have consent)
    const handleLaunchDirectly = async () => {
        if (!selectedUser) return;

        setIsProcessing(true);
        await launchWithCredentials(selectedUser.did);
    };

    // Build redirect URL with DID and VP
    const launchWithCredentials = async (userDid: string) => {
        setStep(LaunchStep.launching);

        try {
            const wallet = await initWallet();
            const urlObj = new URL(redirectUrl);

            // Add user's did
            urlObj.searchParams.set('did', userDid);

            // Add delegate credential VP if contract has an owner
            if (contractDetails?.owner?.did) {
                const unsignedDelegateCredential = wallet.invoke.newCredential({
                    type: 'delegate',
                    subject: contractDetails.owner.did,
                    access: ['read', 'write'],
                });

                const delegateCredential = await wallet.invoke.issueCredential(
                    unsignedDelegateCredential
                );

                const unsignedDidAuthVp = await wallet.invoke.newPresentation(delegateCredential);

                const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                    proofPurpose: 'authentication',
                    proofFormat: 'jwt',
                })) as any as string;

                urlObj.searchParams.set('vp', vp);
            }

            window.open(urlObj.toString(), '_blank');
            closeAllModals();
        } catch (error) {
            console.error('Failed to launch:', error);
            setIsProcessing(false);
            setStep(LaunchStep.confirmConsent);
        }
    };

    const handleCancel = () => {
        onCancel?.();
        closeAllModals();
    };

    const handleCreateFamily = () => {
        newModal(
            <FamilyCMS
                handleCloseModal={closeModal}
                onFamilyCreationSuccess={() => setStep(LaunchStep.selectProfile)}
            />,
            {
                sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
                hideButton: true,
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const { name, image } = contractDetails ?? {};
    const appName = name ?? 'this app';
    const appImage = image ?? '';

    // Loading state
    if (step === LaunchStep.loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[20px] p-8">
                <IonSpinner name="crescent" className="w-8 h-8 mb-4" />
                <p className="text-grayscale-600">Loading...</p>
            </div>
        );
    }

    // Create Family step
    if (step === LaunchStep.createFamily) {
        return (
            <div className="flex flex-col gap-4 p-6 bg-white rounded-[20px] max-w-[400px]">
                <div className="flex flex-col items-center gap-4">
                    {appImage && (
                        <img
                            src={appImage}
                            alt={appName}
                            className="w-16 h-16 rounded-xl object-cover"
                        />
                    )}

                    <h2 className="text-xl font-semibold text-grayscale-900 text-center">
                        Create a Family
                    </h2>

                    <p className="text-grayscale-600 text-center">
                        Create a family to select who will use {appName}.
                    </p>
                </div>

                <button
                    onClick={handleCreateFamily}
                    className="w-full py-3 bg-emerald-700 text-white rounded-full font-medium text-lg"
                >
                    Create Family
                </button>

                <button
                    onClick={handleCancel}
                    className="w-full py-3 bg-grayscale-100 text-grayscale-700 rounded-full font-medium"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // Select Profile step
    if (step === LaunchStep.selectProfile) {
        return (
            <div className="flex flex-col gap-4">
                <AccountSwitcherModal
                    title="Who's using this app?"
                    showFooter={false}
                    handlePlayerSwitchOverride={handleProfileSelected}
                    contractDetails={contractDetails}
                />

                <button
                    onClick={handleCancel}
                    className="w-full py-3 bg-white text-grayscale-700 rounded-full font-medium shadow-sm"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // Confirm Consent step
    if (step === LaunchStep.confirmConsent && selectedUser) {
        return (
            <div className="flex flex-col gap-4 p-6 bg-white rounded-[20px] max-w-[400px]">
                <div className="flex flex-col items-center gap-4">
                    {appImage && (
                        <img
                            src={appImage}
                            alt={appName}
                            className="w-16 h-16 rounded-xl object-cover"
                        />
                    )}

                    <div className="flex items-center gap-3">
                        <UserProfilePicture
                            user={selectedUser}
                            customContainerClass="w-12 h-12 rounded-full overflow-hidden"
                            customImageClass="w-12 h-12 object-cover"
                        />

                        <div>
                            <p className="font-medium text-grayscale-900">
                                {selectedUser.displayName}
                            </p>

                            <p className="text-sm text-grayscale-500">Selected profile</p>
                        </div>
                    </div>

                    {selectedUserHasConsented ? (
                        <p className="text-grayscale-600 text-center">
                            <span className="font-medium">{selectedUser.displayName}</span> is
                            already connected to {appName}.
                        </p>
                    ) : (
                        <p className="text-grayscale-600 text-center">
                            Allow <span className="font-medium">{selectedUser.displayName}</span> to
                            use {appName}?
                        </p>
                    )}

                    {contractDetails?.reasonForAccessing && (
                        <p className="text-sm text-grayscale-500 text-center bg-grayscale-50 p-3 rounded-lg">
                            {contractDetails.reasonForAccessing}
                        </p>
                    )}
                </div>

                {selectedUserHasConsented ? (
                    <button
                        onClick={handleLaunchDirectly}
                        disabled={isProcessing}
                        className="w-full py-3 bg-emerald-700 text-white rounded-full font-medium text-lg disabled:opacity-60"
                    >
                        {isProcessing ? 'Opening...' : `Open ${appName}`}
                    </button>
                ) : (
                    <button
                        onClick={handleConsentAndLaunch}
                        disabled={isProcessing}
                        className="w-full py-3 bg-emerald-700 text-white rounded-full font-medium text-lg disabled:opacity-60"
                    >
                        {isProcessing ? 'Connecting...' : 'Allow & Open'}
                    </button>
                )}

                <button
                    onClick={() => setStep(LaunchStep.selectProfile)}
                    disabled={isProcessing}
                    className="w-full py-3 bg-grayscale-100 text-grayscale-700 rounded-full font-medium disabled:opacity-60"
                >
                    Select Different Profile
                </button>

                <button
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="text-grayscale-500 font-medium text-center"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // Launching state
    if (step === LaunchStep.launching) {
        return (
            <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-[20px] p-8">
                <IonSpinner name="crescent" className="w-8 h-8 mb-4" />
                <p className="text-grayscale-600">Opening {appName}...</p>
            </div>
        );
    }

    return null;
};

export default GuardianConsentLaunchModal;
