import React from 'react';

import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import CheckListButton from '../../components/learncard/checklist/CheckListButton';

export const AiInsightsEmptyPlaceholder: React.FC = () => {
    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 px-[15px] py-[18px] rounded-[15px] mt-4">
            <div className="w-full flex-col flex items-center justify-center gap-4">
                <AiPathwaysIconWithShape className="w-auto h-[60px]" />
                <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">
                        No AI Insights yet.
                    </h2>
                    <p className="text-sm text-grayscale-700 font-notoSans text-center">
                        Build your LearnCard to unlock personalized learning insights and track your
                        skill development journey.
                    </p>
                </div>
                <CheckListButton />
            </div>
        </div>
    );
};

export default AiInsightsEmptyPlaceholder;
