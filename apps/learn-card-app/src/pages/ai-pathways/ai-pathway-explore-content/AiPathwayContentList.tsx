import React from 'react';

import { IonRow } from '@ionic/react';
import AiPathwayContentListItem from './AiPathwayContentListItem';

import { AiPathwayContent } from './ai-pathway-content.helpers';
import { CAREER_ONE_STOP_VIDEOS } from 'learn-card-base/helpers/careerOneStop.helpers';

export const AiPathwayContentList: React.FC<{
    occupations?: any[];
}> = ({ occupations }) => {
    return (
        <IonRow className="w-full flex flex-col items-center justify-center gap-2">
            {/* {content.map((item, index) => (
                <AiPathwayContentListItem key={index} content={item} />
            ))} */}
            {occupations?.map((occupation, index) => {
                const videoCode = occupation?.Video?.[0]?.VideoCode?.replace(/[^0-9]/g, '');

                const { youtubeUrl } =
                    CAREER_ONE_STOP_VIDEOS.find(v => v.VideoCode === videoCode) || {};

                const videoItem: AiPathwayContent = {
                    id: occupation?.OnetCode,
                    title: occupation?.OnetTitle,
                    description: occupation?.OnetDescription,
                    source: 'Youtube',
                    url: youtubeUrl || '',
                };

                return <AiPathwayContentListItem key={index} content={videoItem} />;
            })}
        </IonRow>
    );
};

export default AiPathwayContentList;
