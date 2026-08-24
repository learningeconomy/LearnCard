import React from 'react';
import queryString from 'query-string';

import { useHistory, useLocation } from 'react-router-dom';
import { useModal, useWallet } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import GamePromptHeader from './GamePromptHeader';

import { ConsentFlowContractDetails, LCNProfile } from '@learncard/types';
import * as m from '../../../paraglide/messages.js';
import { getConsentFlowDidAuthRedirect } from '../issueConsentFlowDidAuth';

type GameAccessSuccessPromptProps = {
    user: LCNProfile;
    isFromGame: boolean;
    contractDetails?: ConsentFlowContractDetails;
};

export const GameAccessSuccessPrompt: React.FC<GameAccessSuccessPromptProps> = ({
    user,
    isFromGame,
    contractDetails,
}) => {
    const { closeModal, closeAllModals } = useModal();
    const brandingConfig = useBrandingConfig();
    const history = useHistory();
    const location = useLocation();

    const { initWallet } = useWallet();

    const { name, image } = contractDetails ?? {};
    const gameTitle = name ?? '...';
    const gameImage = image ?? '';

    const { challenge, domain, returnTo: urlReturnTo } = queryString.parse(location.search);

    const returnTo = urlReturnTo || contractDetails?.redirectUrl; // prefer url param

    const handleReturnToGame = async () => {
        closeModal();
        if (returnTo && !Array.isArray(returnTo)) {
            if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                const ownerDid = contractDetails?.owner?.did;

                if (!ownerDid || !contractDetails?.uri) {
                    throw new Error('Invalid consent request');
                }

                const wallet = await initWallet();

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
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="w-full flex flex-col gap-[20px] justify-center items-center bg-white rounded-[20px] pt-[40px] pb-[20px] px-[20px] shadow-soft-bottom">
                <div className="flex flex-col gap-[15px]">
                    <GamePromptHeader gameImage={gameImage} showCheckmark user={user} />

                    <p className="text-grayscale-900 text-[22px] leading-[130%] tracking-[-0.25px] font-notoSans text-center">
                        Success!
                    </p>
                </div>

                <div className="h-[1px] w-[80px] bg-grayscale-200" />

                <div className="w-full text-center text-grayscale-900 text-[17px] font-notoSans px-[30px]">
                    You've added <span className="font-[600] tracking-[0.25px]">{gameTitle}</span>{' '}
                    to <span className="font-[600]">{user?.displayName ?? user?.name}'s</span>{' '}
                    {brandingConfig?.name}
                </div>
            </div>

            <button
                onClick={() => {
                    if (isFromGame || returnTo) {
                        handleReturnToGame();
                    } else {
                        closeAllModals();
                    }
                }}
                type="button"
                className="w-full py-[10px] text-[20px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
            >
                {isFromGame && m['consentFlow.continuePlaying']()}
                {!isFromGame && returnTo && m['consentFlow.continueToGame']()}
                {!isFromGame && !returnTo && `Return to ${brandingConfig?.name}`}
            </button>
        </div>
    );
};

export default GameAccessSuccessPrompt;
