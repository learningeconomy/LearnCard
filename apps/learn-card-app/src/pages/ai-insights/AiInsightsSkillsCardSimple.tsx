import React from 'react';
import { Link } from 'react-router-dom';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';

const AiInsightsSkillsCardSimple: React.FC = () => {
    return (
        <Link
            to="/skills"
            className="flex-1 bg-violet-600 text-white flex items-center justify-start gap-[8px] rounded-full py-[7px] px-[15px] shadow-bottom-2-3 overflow-hidden"
        >
            <PuzzlePiece className="w-[22px] h-[22px] shrink-0" version="filled" />
            <span className="font-poppins font-semibold text-[14px] leading-[130%] text-left">
                Browse Skills Hub
            </span>
        </Link>
    );
};

export default AiInsightsSkillsCardSimple;
