import React from 'react';

import AiPathwayContentList from './AiPathwayContentList';

const dummyInsightsContent: {
    title: string;
    url: string;
}[] = [
    {
        title: 'Javascript Beginners Course',
        url: 'https://www.youtube.com/watch?v=x2RNw4M6cME',
    },
];

const AiPathwayExploreContent: React.FC = () => {
    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Content</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    <AiPathwayContentList content={dummyInsightsContent} />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayExploreContent;
