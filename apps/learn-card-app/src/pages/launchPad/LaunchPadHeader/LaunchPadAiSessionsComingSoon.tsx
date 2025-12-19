import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import React from 'react';

import useTheme from '../../../theme/hooks/useTheme';

export const LaunchPadAiSessionComingSoon: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="py-6 px-4 flex items-center justify-center flex-col">
            <div className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1">
                <SolidCircleIcon className="absolute top-0 w-[80px] h-[80px]" />
                <BlueMagicWand className="z-50 w-[75px] h-auto" />
                <p className={`text-${primaryColor} text-[16px] font-poppins font-semibold`}>
                    AI Sessions
                </p>
            </div>

            <div>
                <h4 className="flex items-center justify-center text-2xl text-grayscale-600 font-semibold">
                    Coming Soon!
                </h4>
                <p className="text-grayscale-800 text-center mt-2 text-base font-notoSans">
                    Get ready for a centralized space where all your learning topics and sessions
                    are stored.
                </p>
            </div>
        </div>
    );
};

export default LaunchPadAiSessionComingSoon;
