import React from 'react';

import AiPassportAppProfileFooter from '../AiPassportAppProfileFooter/AiPassportAppProfileFooter';
import AiPassportAppProfileConnectedViewHeader from './AiPassportAppProfileConnectedViewHeader';
import AiPassportAppProfileTopics from '../AiPassportAppProfileTopics/AiPassportAppProfileTopics';
import AiPassportAppProfileOptions from '../AiPassportAppProfileOptions/AiPassportAppProfileOptions';

import { LaunchPadAppListItem } from 'learn-card-base';
import { getAiAppBackgroundStylesForApp } from '../aiPassport-apps.helpers';

export const AiPassportAppProfileConnectedView: React.FC<{ app: LaunchPadAppListItem }> = ({
    app,
}) => {
    const appStyles = getAiAppBackgroundStylesForApp(app);

    return (
        <div
            className="h-full w-full flex items-start justify-center overflow-y-scroll pb-[200px] safe-area-top-margin"
            style={{ ...appStyles }}
        >
            <div className="w-full ion-padding max-w-[600px]">
                <AiPassportAppProfileConnectedViewHeader app={app} />

                <AiPassportAppProfileTopics app={app} />

                <AiPassportAppProfileOptions app={app} />
            </div>

            <AiPassportAppProfileFooter app={app} showBackButton={false} />
        </div>
    );
};

export default AiPassportAppProfileConnectedView;
