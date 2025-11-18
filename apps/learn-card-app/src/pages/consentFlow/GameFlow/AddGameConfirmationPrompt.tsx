import React, { useState } from 'react';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';
import useConsentFlow from '../useConsentFlow';

import GamePromptHeader from './GamePromptHeader';
import ConsentFlowEditAccess from 'apps/learn-card-app/src/pages/launchPad/ConsentFlowEditAccess';

import {
    ModalTypes,
    useConsentToContract,
    useCurrentUser,
    useGetCurrentLCNUser,
    useModal,
    useSwitchProfile,
    useSyncConsentFlow,
} from 'learn-card-base';
import { ConsentFlowContractDetails, ConsentFlowTerms, LCNProfile } from '@learncard/types';
import { useImmer } from 'use-immer';
import { getMinimumTermsForContract } from 'apps/learn-card-app/src/helpers/contract.helpers';

import useTheme from '../../../theme/hooks/useTheme';

type AddGamePromptConfirmationPromptProps = {
    user?: LCNProfile;
    contractDetails?: ConsentFlowContractDetails;
    isFromGame: boolean;
    onAllowAccessSuccess?: () => void;
    handleBackToGame: () => void;
    handleSelectADifferentPlayer: () => void;
};

export const AddGameConfirmationPrompt: React.FC<AddGamePromptConfirmationPromptProps> = ({
    user,
    contractDetails,
    isFromGame,
    onAllowAccessSuccess,
    handleBackToGame,
    handleSelectADifferentPlayer,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const history = useHistory();
    const { newModal, closeAllModals } = useModal();
    const currentUser = useCurrentUser()!!!!!!!!!;

    const { currentLCNUser } = useGetCurrentLCNUser();
    const { handleSwitchAccount } = useSwitchProfile();

    const { returnTo: urlReturnTo } = queryString.parse(location.search);
    const returnTo = urlReturnTo || contractDetails?.redirectUrl; // prefer url param

    const { name, image, reasonForAccessing } = contractDetails ?? {};

    const gameTitle = name ?? '...';
    const gameImage = image ?? '';

    const [loading, setLoading] = useState(false);
    const [terms, setTerms] = useImmer(
        contractDetails?.contract
            ? getMinimumTermsForContract(contractDetails.contract, currentUser)
            : ({} as ConsentFlowTerms)
    );
    const [shareDuration, setShareDuration] = useState<{
        oneTimeShare: boolean;
        customDuration: string;
    }>({ oneTimeShare: false, customDuration: '' });
    const { mutateAsync: consentToContract, isPending } = useConsentToContract(
        contractDetails?.uri ?? '',
        contractDetails?.owner.did ?? ''
    );
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { hasConsented, consentedContractLoading } = useConsentFlow(contractDetails);

    const handleAllowGameAccess = async () => {
        setLoading(true);

        try {
            if (currentLCNUser?.did !== user?.did) {
                await handleSwitchAccount(user);
            }

            await consentToContract({
                terms,
                expiresAt: shareDuration.customDuration,
                oneTime: shareDuration.oneTimeShare,
            });

            // Sync any auto-boost credentials (if any). No need to wait.
            //   this displays a toast that says "Successfully synced X credentials" when done
            fetchNewContractCredentials();
        } finally {
            setLoading(false);
        }

        onAllowAccessSuccess?.();
    };

    const handleReturnToGame = () => {
        if (returnTo && !Array.isArray(returnTo)) {
            if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                const urlObj = new URL(returnTo);
                window.location.href = urlObj.toString();
            } else history.push(returnTo);
        }
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="w-full flex flex-col gap-[20px] justify-center items-center bg-white rounded-[20px] pt-[40px] pb-[20px] px-[20px] shadow-soft-bottom">
                <div className="flex flex-col gap-[15px]">
                    <GamePromptHeader gameImage={gameImage} user={user} />

                    {!hasConsented && (
                        <div className="w-full text-center text-grayscale-900 text-[17px] font-notoSans px-[30px]">
                            Add <span className="font-[600] tracking-[0.25px]">{gameTitle}</span> to{' '}
                            <span className="font-[600]">{user?.displayName ?? user?.name}'s</span>{' '}
                            LearnCard
                        </div>
                    )}
                    {hasConsented && (
                        <div className="w-full text-center text-grayscale-900 text-[17px] font-notoSans px-[30px]">
                            <span className="font-[600] tracking-[0.25px]">{gameTitle}</span> is
                            already connected to{' '}
                            <span className="font-[600]">{user?.displayName ?? user?.name}'s</span>{' '}
                            LearnCard
                        </div>
                    )}
                </div>

                {reasonForAccessing && (
                    <>
                        <div className="h-[1px] w-[80px] bg-grayscale-200" />

                        <div className="w-full px-[30px] text-grayscale-800 text-[14px] font-notoSans text-center">
                            {reasonForAccessing}
                        </div>
                    </>
                )}

                {(!hasConsented || consentedContractLoading) && (
                    <button
                        type="button"
                        onClick={handleAllowGameAccess}
                        className="text-white rounded-full py-[10px] bg-emerald-700 w-full text-[20px] shadow-box-bottom disabled:opacity-70"
                        disabled={loading || consentedContractLoading}
                    >
                        {loading ? 'Allowing...' : 'Allow Access'}
                    </button>
                )}
                {hasConsented && (
                    <button
                        type="button"
                        onClick={handleReturnToGame}
                        className="text-white rounded-full py-[10px] bg-emerald-700 w-full text-[20px] shadow-box-bottom disabled:opacity-70"
                        disabled={loading || consentedContractLoading}
                    >
                        Return to Game
                    </button>
                )}

                {!hasConsented && (
                    <button
                        className={`text-${primaryColor} font-[600] text-[17px] leading-[24px] tracking-[0.25px]`}
                        onClick={() => {
                            newModal(
                                <ConsentFlowEditAccess
                                    contractDetails={contractDetails}
                                    terms={terms}
                                    setTerms={setTerms}
                                />,
                                undefined,
                                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                            );
                        }}
                    >
                        Edit Access
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={handleSelectADifferentPlayer}
                className="w-full py-[10px] px-[20px] text-[20px] bg-white rounded-[30px] text-grayscale-800 shadow-box-bottom"
            >
                Select a Different Player
            </button>

            <button
                type="button"
                onClick={isFromGame ? handleBackToGame : closeAllModals}
                className="w-full py-[10px] px-[20px] text-[20px] bg-white rounded-[30px] text-grayscale-800 shadow-box-bottom"
            >
                {isFromGame ? 'Back to Game' : 'Cancel'}
            </button>
        </div>
    );
};

export default AddGameConfirmationPrompt;
