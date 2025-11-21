import React from 'react';
import AiSessionLoader from '../AiSessionLoader';
import LoadingAnimation from '../../../assets/images/purple-sparkles.gif';
import { aiThinkingText, sessionWrapUpText } from '../newAiSession.helpers';
import { AiPassportAppContractUri } from '../../ai-passport-apps/aiPassport-apps.helpers';

type AiChatLoadingProps = {
    contractUri: string;
};

const AiChatLoading: React.FC<AiChatLoadingProps> = ({
    contractUri = AiPassportAppContractUri.learncardapp,
}) => {
    return (
        <div className="w-full flex flex-col gap-2 items-center justify-center py-4 my-auto">
            <img src={LoadingAnimation} alt="Loading" className="w-[240px] h-[240px]" />
            <AiSessionLoader contractUri={contractUri} textOnly overrideText={aiThinkingText} />
        </div>
    );
};

export default AiChatLoading;
