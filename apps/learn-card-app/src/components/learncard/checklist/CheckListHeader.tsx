import React from 'react';

import { useTheme } from '../../../theme/hooks/useTheme';

export const ChecklistHeader: React.FC = () => {
    const { theme, colors } = useTheme();
    const { buildMyLCIcon } = theme.defaults;
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl px-6 py-4 mt-4 rounded-[15px]">
            <div className="flex flex-col items-center justify-center py-4">
                <div className="bg-white rounded-[15px] p-2 w-[60px] h-[60px] flex items-center justify-center mb-0">
                    <img src={buildMyLCIcon} className="text-white" alt="blocks" />
                </div>
                <h2 className="text-[22px] text-grayscale-800 font-notoSans text-center">
                    Build My
                    <br />
                    <span className={`font-semibold text-${primaryColor}`}>LearnCard</span>
                </h2>
            </div>
        </div>
    );
};

export default ChecklistHeader;
