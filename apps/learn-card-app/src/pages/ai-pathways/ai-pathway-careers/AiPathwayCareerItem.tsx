import React from 'react';
import numeral from 'numeral';

import SlimCaretRight from '../../../components/svgs/SlimCaretRight';

export const AiPathwayCareerItem: React.FC<{
    title: string;
    description: string;
    salary: string;
}> = ({ title, description, salary }) => {
    return (
        <div
            role="button"
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1 border-solid border-[1px] border-grayscale-200 rounded-xl"
        >
            <div className="w-full flex flex-col items-start justify-start gap-1">
                <div className="flex items-center justify-between w-full">
                    <h4 className="pr-1 text-grayscale-800 font-semibold text-[17px] text-left line-clamp-1">
                        {title}
                    </h4>

                    <div>
                        <SlimCaretRight className="text-grayscale-800 w-[24px] h-auto" />
                    </div>
                </div>
                <div className="w-full flex flex-col items-start justify-start">
                    <p className="text-grayscale-600 text-xs text-left font-semibold">
                        AVG. ANNUAL SALARY
                    </p>
                    <p className="text-indigo-400 text-sm text-left font-semibold">
                        ${numeral(salary).format('0,0')}
                    </p>
                </div>
                <p className="text-grayscale-600 line-clamp-2 text-sm text-left">{description}</p>
            </div>
        </div>
    );
};

export default AiPathwayCareerItem;
