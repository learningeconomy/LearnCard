import React from 'react';
import { Link } from 'react-router-dom';

import { AiPathwaysIcon } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';

const AiInsightsLearningPathwaysCard: React.FC = () => {
    return (
        <Link
            to="/ai/pathways"
            className="flex-1 bg-teal-500 text-white flex items-center justify-start gap-[8px] rounded-full py-[7px] px-[15px] shadow-bottom-2-3 overflow-hidden"
        >
            <AiPathwaysIcon className="w-[30px] h-[20px] shrink-0" />
            <span className="font-poppins font-semibold text-[14px] leading-[130%] text-left">
                Explore Pathways
            </span>
        </Link>
    );
};

export default AiInsightsLearningPathwaysCard;
