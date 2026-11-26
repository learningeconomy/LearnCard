import React from 'react';

import { AppRow } from '../../../components/layout';
import AiPathwayContentListItem from './AiPathwayContentListItem';

import { AiPathwayContent } from './ai-pathway-content.helpers';

export const AiPathwayContentList: React.FC<{
    contentItems?: AiPathwayContent[];
}> = ({ contentItems }) => {
    return (
        <AppRow className="w-full flex flex-col items-center justify-center gap-2">
            {contentItems?.map((item, index) => (
                <AiPathwayContentListItem key={index} content={item} />
            ))}
        </AppRow>
    );
};

export default AiPathwayContentList;
