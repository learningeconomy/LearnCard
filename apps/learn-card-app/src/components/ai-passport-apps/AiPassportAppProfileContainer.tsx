import React from 'react';

import AiPassportAppProfileHeader from './AiPassportAppProfileHeader/AiPassportAppProfileHeader';
import AiPassportAppProfileDetails from './AiPassportAppProfileDetails/AiPassportAppProfileDetails';
import AiPassportAppProfileFooter from './AiPassportAppProfileFooter/AiPassportAppProfileFooter';
import AiPassportAppProfileConnectedView from './AiPassportAppProfileConnectedView/AiPassportAppProfileConnectedView';

import {
    AppStoreAppMetadata,
    AppStoreAppReview,
    LaunchPadAppListItem,
    useGetAppMetadata,
    useGetAppReviews,
} from 'learn-card-base';

export const AiPassportAppProfileContainer: React.FC<{ app: LaunchPadAppListItem }> = ({ app }) => {
    const { data, isPending, error } = useGetAppMetadata(app?.appStoreID as string);
    const { data: reviews } = useGetAppReviews(app?.appStoreID as string);

    if (app.isConnected) {
        return <AiPassportAppProfileConnectedView app={app} />;
    }

    return (
        <div className="h-full">
            <AiPassportAppProfileHeader app={app} appMetaData={data as AppStoreAppMetadata} />
            <AiPassportAppProfileDetails
                app={app}
                appMetaData={data as AppStoreAppMetadata}
                appReviews={reviews as AppStoreAppReview[]}
            />
            <AiPassportAppProfileFooter showBackButton app={app} />
        </div>
    );
};

export default AiPassportAppProfileContainer;
