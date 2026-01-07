import React from 'react';
import numeral from 'numeral';

import { type AiPathwayCareer } from './ai-pathway-careers.helpers';

export const AiPathwayTopPayLocations: React.FC<{ career: AiPathwayCareer }> = ({ career }) => {
    const { topPaidLocations } = career;

    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-4">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">Top Pay Locations</h2>
            </div>

            <div className="w-full flex flex-col items-start justify-start gap-2">
                {topPaidLocations.map(l => {
                    return (
                        <div key={l.location} className="w-full flex items-center justify-between">
                            <p className="text-grayscale-700">{l.location}</p>
                            <p className="text-grayscale-700 font-semibold">
                                {numeral(l.salary).format('$0a')}
                                <span className="text-grayscale-500 font-normal">/yr</span>
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="w-full flex items-center justify-center">
                <button className="text-grayscale-900 font-semibold">See All Locations</button>
            </div>
        </div>
    );
};

export default AiPathwayTopPayLocations;
