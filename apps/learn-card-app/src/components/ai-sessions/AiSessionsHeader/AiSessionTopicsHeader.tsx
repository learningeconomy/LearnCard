import React from 'react';

import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import AiSessionsDesktopHeader from './AiSessionsDesktopHeader';

import { useDeviceTypeByWidth } from 'learn-card-base';

import { AiSessionsTabsEnum, getAiSessionsApp } from '../aiSessions.helpers';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AiSessionTopicsHeader: React.FC<{
    activeTab: AiSessionsTabsEnum;
}> = ({ activeTab }) => {
    const app = getAiSessionsApp(activeTab);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const isShowAll = activeTab === AiSessionsTabsEnum.all;

    const { isDesktop } = useDeviceTypeByWidth();

    const title = isShowAll ? (
        <p className={`text-[25px] font-semibold text-${primaryColor} font-poppins ml-4`}>
            Ai Sessions
        </p>
    ) : (
        <p className="text-[25px] font-semibold text-grayscale-900 font-poppins ml-4">
            {app?.name}
        </p>
    );

    if (isDesktop) {
        return <AiSessionsDesktopHeader />;
    }

    return (
        <div className="flex items-center justify-center ion-padding absolute bg-white/70 backdrop-blur-[5px] w-full top-0 left-0 z-20">
            <div className="w-full flex max-w-[600px]">
                {isShowAll ? (
                    <div className="relative flex items-center justify-center">
                        <SolidCircleIcon className="absolute top-0 w-[65px] h-[65px]" />
                        <BlueMagicWand className="z-50 w-[75px] h-auto" />
                    </div>
                ) : (
                    <div className="h-[75px] w-[75px] mr-2">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[16px] overflow-hidden border-[1px] border-solid"
                            alt={`${app?.name} logo`}
                            src={app?.img}
                        />
                    </div>
                )}

                <div className="flex items-center justify-center">{title}</div>
            </div>
        </div>
    );
};

export default AiSessionTopicsHeader;
