import React from 'react';

import AiPathwayContentList from './AiPathwayContentList';
import AiPathwayContentListItemSkeleton from './AiPathwayContentItemSkeletonLoader';

import { CAREER_ONE_STOP_VIDEOS } from 'learn-card-base/helpers/careerOneStop.helpers';
import { AiPathwayContent } from './ai-pathway-content.helpers';

const AiPathwayExploreContent: React.FC<{
    occupations?: any[];
    isLoading?: boolean;
}> = ({ occupations = [], isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
                <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
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

    const contentItems: AiPathwayContent[] = occupations?.map((occupation, index) => {
        const videoCode = occupation?.Video?.[0]?.VideoCode?.replace(/[^0-9]/g, '');

        const { youtubeUrl } = CAREER_ONE_STOP_VIDEOS.find(v => v.VideoCode === videoCode) || {};
        return {
            id: occupation?.OnetCode,
            title: occupation?.OnetTitle,
            description: occupation?.OnetDescription,
            source: 'Youtube',
            url: youtubeUrl || '',
        };
    });

    if (!isLoading && (!contentItems || contentItems.length === 0)) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Content</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    <AiPathwayContentList contentItems={contentItems} />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayExploreContent;
