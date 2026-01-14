import React from 'react';

import AiPathwayCareerItem from './AiPathwayCareerItem';
import AiPathwayCareerItemSkeletonLoader from './AiPathwayCareerItemSkeletonLoader';

const AiPathwayCareers: React.FC<{
    careerKeywords?: string[];
    occupations?: any[];
    isLoading?: boolean;
}> = ({ careerKeywords = [], occupations = [], isLoading = false }) => {
    const titleEl = (
        <div className="w-full flex items-center justify-start">
            <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Careers</h2>
        </div>
    );

    if (isLoading) {
        return (
            <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
                <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                    {titleEl}

                    <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <AiPathwayCareerItemSkeletonLoader key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && (!careerKeywords?.length || !occupations?.length)) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                {titleEl}

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
