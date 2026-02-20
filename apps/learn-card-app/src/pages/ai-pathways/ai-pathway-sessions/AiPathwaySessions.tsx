import React from 'react';

import AiPathwaySessionsItem from './AiPathwaySessionItem';
import AiPathwaySessionsSkeletonLoader from './AiPathwaySessionsSkeletonLoader';

export const AiPathwaySessions: React.FC<{
    learningPathwaysData?: any[];
    isLoading?: boolean;
}> = ({ learningPathwaysData, isLoading }) => {
    const titleEl = (
        <div className="w-full flex items-center justify-start">
            <h2 className="text-xl text-grayscale-800 font-notoSans">Explore AI Sessions</h2>
        </div>
    );

    if (isLoading)
        return (
            <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
                <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                    {titleEl}

                    <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                        <AiPathwaySessionsSkeletonLoader />
                    </div>
                </div>
            </div>
        );

    if (!isLoading && (!learningPathwaysData || learningPathwaysData.length === 0)) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                {titleEl}
                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {learningPathwaysData?.map(
                        ({ title, description, skills, topicUri, pathwayUri }, index) => (
                            <AiPathwaySessionsItem
                                title={title}
                                description={description}
                                skills={skills}
                                topicUri={topicUri}
                                pathwayUri={pathwayUri}
                                key={`${pathwayUri || title}-${index}`}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiPathwaySessions;
