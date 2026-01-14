import React from 'react';

import AiPathwayContentList from './AiPathwayContentList';

import { useOccupationDetailsForKeyword } from 'learn-card-base/react-query/queries/careerOneStop';
import AiPathwayContentListItemSkeleton from './AiPathwayContentItemSkeletonLoader';

const AiPathwayExploreContent: React.FC<{ careerKeywords?: string[] }> = ({
    careerKeywords = [],
}) => {
    const { data: occupations, isLoading } = useOccupationDetailsForKeyword(
        careerKeywords?.[0] || ''
    );

    if (isLoading) {
        return (
            <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
                <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                    <div className="w-full flex items-center justify-start">
                        <h2 className="text-xl text-grayscale-800 font-notoSans">
                            Explore Content
                        </h2>
                    </div>

                    <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                        <div className="w-full flex flex-col items-start justify-start gap-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <AiPathwayContentListItemSkeleton key={index} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Content</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    <AiPathwayContentList occupations={occupations} />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayExploreContent;
