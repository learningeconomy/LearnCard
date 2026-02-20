import React from 'react';

import { IonRow } from '@ionic/react';
import AiPathwayContentListItem from './AiPathwayContentListItem';

import { AiPathwayContent } from './ai-pathway-content.helpers';

export const AiPathwayContentList: React.FC<{
    contentItems?: AiPathwayContent[];
}> = ({ contentItems }) => {
    return (
        <IonRow className="w-full flex flex-col items-center justify-center gap-2">
            {contentItems?.map((item, index) => (
                <AiPathwayContentListItem key={index} content={item} />
            ))}
        </IonRow>
    );
};

export default AiPathwayContentList;
