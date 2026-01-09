import React from 'react';

import AiPathwayCareerItem from './AiPathwayCareerItem';

import { useOccupationDetailsForKeyword } from 'learn-card-base/react-query/queries/careerOneStop';

const AiPathwayCareers: React.FC<{ careerKeywords?: string[] }> = ({ careerKeywords = [] }) => {
    const { data: occupations } = useOccupationDetailsForKeyword(careerKeywords[0]);

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4 mt-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Careers</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {occupations?.map(occupation => (
                        <AiPathwayCareerItem key={occupation.OnetCode} occupation={occupation} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCareers;
