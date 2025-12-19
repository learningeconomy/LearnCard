import React from 'react';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';

import GamePromptHeader from './GamePromptHeader';

import { ConsentFlowContractDetails } from '@learncard/types';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { useWallet } from 'learn-card-base';

type ReturnToGamePromptProps = {
    contractDetails?: ConsentFlowContractDetails;
    returnToPrevStep: () => void;
};

export const ReturnToGamePrompt: React.FC<ReturnToGamePromptProps> = ({
    contractDetails,
    returnToPrevStep,
}) => {
    const history = useHistory();
    const { returnTo: urlReturnTo } = queryString.parse(location.search);

    const { data: consentedContracts } = useConsentedContracts();
    const consentedContract = consentedContracts?.find(
        c => c?.contract?.uri === contractDetails?.uri
    );

    const { initWallet } = useWallet();

    const returnTo = urlReturnTo || contractDetails?.redirectUrl; // prefer url param

    const { name, image } = contractDetails ?? {};
    const gameTitle = name ?? '...';
    const gameImage = image ?? '';

    const handleBackToGameRdirect = async () => {
        if (returnTo && !Array.isArray(returnTo)) {
            if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                const urlObj = new URL(returnTo);

                if (contractDetails?.owner?.did && consentedContract?.status === 'live') {
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
            <div className="w-full flex flex-col justify-center items-center gap-[20px] bg-white rounded-[24px] px-[20px] py-[40px] shadow-box-bottom">
                <GamePromptHeader gameImage={gameImage} showX showPlus={false} />

                <div className="h-[1px] w-[80px] bg-grayscale-200" />

                <div className="text-grayscale-800 text-[20px] font-notoSans">Are you Sure?</div>

                <div className="w-full text-center text-grayscale-900 text-[17px] font-notoSans px-[30px]">
                    <span>If you return to</span>{' '}
                    <span className="font-[600] leading-[24px] tracking-[0.25px]">{gameTitle}</span>
                    <span>, your progress on LearnCard will be lost.</span>
                </div>
            </div>

            <button
                onClick={handleBackToGameRdirect}
                type="button"
                className="w-full py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom"
            >
                Return to Game
            </button>
            <button
                onClick={() => history.push('/wallet')}
                type="button"
                className="w-full py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom"
            >
                Exit to LearnCard
            </button>
            <button
                onClick={returnToPrevStep}
                type="button"
                className="w-full py-[10px] text-[20px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
            >
                Back
            </button>
        </div>
    );
};

export default ReturnToGamePrompt;
