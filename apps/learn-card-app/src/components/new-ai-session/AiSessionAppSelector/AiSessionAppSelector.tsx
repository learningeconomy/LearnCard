import React from 'react';

import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';

import { LaunchPadAppListItem, useModal } from 'learn-card-base';
import { useConsentFlowByUri } from 'apps/learn-card-app/src/pages/consentFlow/useConsentFlow';

import useTheme from '../../../theme/hooks/useTheme';

const AiSessionAppSelectorItem = ({
    app,
    handleSetAiApp,
    minified,
}: {
    app: LaunchPadAppListItem;
    handleSetAiApp: (app: LaunchPadAppListItem) => void;
    minified?: boolean;
}) => {
    const { closeModal } = useModal();
    const { openConsentFlowModal, hasConsented } = useConsentFlowByUri(app.contractUri);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleConsentToApp = () => {
        if (!hasConsented) {
            openConsentFlowModal(true, () => {
                handleSetAiApp(app);
                closeModal();
            });
        } else {
            handleSetAiApp(app);
        }
    };

    if (minified) {
        return (
            <button
                onClick={() => handleConsentToApp()}
                className="h-[50px] w-[50px] rounded-[20px] overflow-hidden mr-2 border-[1px] border-solid border-grayscale-200"
            >
                <img
                    className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden "
                    alt={`${app?.name} logo`}
                    src={app.img}
                />
            </button>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center">
                <div className="h-[100px] w-[100px] rounded-[20px] overflow-hidden">
                    <img
                        className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden "
                        alt={`${app?.name} logo`}
                        src={app.img}
                    />
                </div>

                <p className="text-grayscale-900 text-[17px] font-notoSans font-semibold mt-1">
                    {app?.name}
                </p>
            </div>

            <button
                role="button"
                onClick={() => handleConsentToApp()}
                className={`flex items-center justify-center rounded-full font-[600]  px-[18px] py-[2px] normal text-sm mt-2 ${
                    hasConsented
                        ? `bg-gray-200 text-${primaryColor}`
                        : `bg-${primaryColor} text-white`
                }`}
            >
                {hasConsented ? 'Open' : 'Get'}
            </button>
        </div>
    );
};

const AiSessionAppSelector: React.FC<{
    handleSetAiApp: (app: LaunchPadAppListItem) => void;
    minified?: boolean;
}> = ({ handleSetAiApp, minified }) => {
    const aiApps = aiPassportApps;

    return (
        <div className="w-full flex items-center justify-around bg-white pb-[24px] pt-4">
            {aiApps.map((app, index) => (
                <AiSessionAppSelectorItem
                    handleSetAiApp={handleSetAiApp}
                    key={index}
                    app={app}
                    minified={minified}
                />
            ))}
        </div>
    );
};

export default AiSessionAppSelector;
