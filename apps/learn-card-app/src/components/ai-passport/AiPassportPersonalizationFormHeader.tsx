import React from 'react';

import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';

import { useTheme } from '../../theme/hooks/useTheme';

export const AiPassportPersonalizationFormHeader: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-6 mt-4 rounded-[15px]">
            <div className="bg-cyan-300 rounded-full overflow-visible flex items-center justify-center h-[50px] w-[50px]">
                <BlueMagicWand className="h-[60px] w-[60px] min-h-[60px] min-w-[60px]" />
            </div>

            <div className="mt-4 text-center">
                <h1 className="text-grayscale-900 text-[22px] font-normal font-notoSans">
                    Personalize my
                </h1>
                <h2 className={`text-${primaryColor} text-[22px] font-semibold font-notoSans mt-1`}>
                    AI Sessions
                </h2>
            </div>
        </div>
    );
};

export default AiPassportPersonalizationFormHeader;
