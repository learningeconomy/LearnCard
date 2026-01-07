import React from 'react';

import { IonRow } from '@ionic/react';
import AiPathwayContentListItem from './AiPathwayContentListItem';

export const AiPathwayContentList: React.FC<{ content: { title: string; url: string }[] }> = ({
    content,
}) => {
    return (
        <IonRow className="w-full flex flex-col items-center justify-center gap-2">
            {content.map((item, index) => (
                <AiPathwayContentListItem key={index} content={item} />
            ))}
        </IonRow>
    );
};

export default AiPathwayContentList;
