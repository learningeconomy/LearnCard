import React from 'react';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';

import GamePromptHeader from './GamePromptHeader';

import { ConsentFlowContractDetails } from '@learncard/types';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { useWallet } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import * as m from '../../../paraglide/messages.js';
import { getConsentFlowDidAuthRedirect } from '../issueConsentFlowDidAuth';

type ReturnToGamePromptProps = {
    contractDetails?: ConsentFlowContractDetails;
    returnToPrevStep: () => void;
};

export const ReturnToGamePrompt: React.FC<ReturnToGamePromptProps> = ({
    contractDetails,
    returnToPrevStep,
}) => {
    const history = useHistory();
    const brandingConfig = useBrandingConfig();
    const { challenge, domain, returnTo: urlReturnTo } = queryString.parse(location.search);

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
                const ownerDid = contractDetails?.owner?.did;

                if (!ownerDid || !contractDetails?.uri || consentedContract?.status !== 'live') {
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
            <div className="w-full flex flex-col justify-center items-center gap-[20px] bg-white rounded-[24px] px-[20px] py-[40px] shadow-box-bottom">
                <GamePromptHeader gameImage={gameImage} showX showPlus={false} />

                <div className="h-[1px] w-[80px] bg-grayscale-200" />

                <div className="text-grayscale-800 text-[20px] font-notoSans">Are you Sure?</div>

                <div className="w-full text-center text-grayscale-900 text-[17px] font-notoSans px-[30px]">
                    <span>If you return to</span>{' '}
                    <span className="font-[600] leading-[24px] tracking-[0.25px]">{gameTitle}</span>
                    <span>, your progress on {brandingConfig?.name} will be lost.</span>
                </div>
            </div>

            <button
                onClick={handleBackToGameRdirect}
                type="button"
                className="w-full py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom"
            >
                {m['consentFlow.continueToGame']()}
            </button>
            <button
                onClick={() => history.push('/wallet')}
                type="button"
                className="w-full py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom"
            >
                Exit to {brandingConfig?.name}
            </button>
            <button
                onClick={returnToPrevStep}
                type="button"
                className="w-full py-[10px] text-[20px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
            >
                {m['common.back']()}
            </button>
        </div>
    );
};

export default ReturnToGamePrompt;
