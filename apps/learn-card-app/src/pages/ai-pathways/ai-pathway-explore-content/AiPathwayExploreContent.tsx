import React from 'react';

import AiPathwayContentList from './AiPathwayContentList';

import { AI_PATHWAY_CONTENT } from './ai-pathway-content.helpers';

const AiPathwayExploreContent: React.FC = () => {
    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Content</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    <AiPathwayContentList content={AI_PATHWAY_CONTENT} />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayExploreContent;
