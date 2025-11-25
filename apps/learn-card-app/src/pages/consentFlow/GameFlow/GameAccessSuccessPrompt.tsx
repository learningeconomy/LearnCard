import React from 'react';
import queryString from 'query-string';

import { useHistory, useLocation } from 'react-router-dom';
import { useModal, useWallet } from 'learn-card-base';

import GamePromptHeader from './GamePromptHeader';

import { ConsentFlowContractDetails, LCNProfile } from '@learncard/types';

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
    const history = useHistory();
    const location = useLocation();

    const { initWallet } = useWallet();

    const { name, image } = contractDetails ?? {};
    const gameTitle = name ?? '...';
    const gameImage = image ?? '';

    const { returnTo: urlReturnTo } = queryString.parse(location.search);

    const returnTo = urlReturnTo || contractDetails?.redirectUrl; // prefer url param

    const handleReturnToGame = async () => {
        closeModal();
        if (returnTo && !Array.isArray(returnTo)) {
            if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                // add user's did to returnTo url
                const urlObj = new URL(returnTo);
                urlObj.searchParams.set('did', user.did);
                if (contractDetails?.owner?.did) {
                    const wallet = await initWallet();

                    const unsignedDelegateCredential = wallet.invoke.newCredential({
                        type: 'delegate',
                        subject: contractDetails.owner.did,
                        access: ['read', 'write'],
                    });

                    const delegateCredential = await wallet.invoke.issueCredential(
                        unsignedDelegateCredential
                    );

                    const unsignedDidAuthVp = await wallet.invoke.newPresentation(
                        delegateCredential
                    );
                    const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                        proofPurpose: 'authentication',
                        proofFormat: 'jwt',
                    })) as any as string;

                    urlObj.searchParams.set('vp', vp);
                }

                window.location.href = urlObj.toString();
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
                    LearnCard
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
                {isFromGame && 'Continue Playing'}
                {!isFromGame && returnTo && 'Continue to Game'}
                {!isFromGame && !returnTo && 'Return to LearnCard'}
            </button>
        </div>
    );
};

export default GameAccessSuccessPrompt;
