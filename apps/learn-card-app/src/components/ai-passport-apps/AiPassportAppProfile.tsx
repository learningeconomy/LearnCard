import React from 'react';

import AiPassportAppProfileHeader from './AiPassportAppProfileHeader/AiPassportAppProfileHeader';
import AiPassportAppProfileDetails from './AiPassportAppProfileDetails/AiPassportAppProfileDetails';
import AiPassportAppProfileFooter from './AiPassportAppProfileFooter/AiPassportAppProfileFooter';

import {
    AppStoreAppMetadata,
    AppStoreAppReview,
    LaunchPadAppListItem,
    useGetAppMetadata,
    useGetAppReviews,
} from 'learn-card-base';

export const AiPassportAppProfile: React.FC<{ app: LaunchPadAppListItem }> = ({ app }) => {
    const { data, isPending, error } = useGetAppMetadata(app?.appStoreID as string);
    const { data: reviews } = useGetAppReviews(app?.appStoreID as string);

    return (
        <div className="h-full bg-white">
            <AiPassportAppProfileHeader app={app} appMetaData={data as AppStoreAppMetadata} />
            <AiPassportAppProfileDetails
                app={app}
                appMetaData={data as AppStoreAppMetadata}
                appReviews={reviews as AppStoreAppReview[]}
            />
            <AiPassportAppProfileFooter showBackButton />
        </div>
    );
};

export default AiPassportAppProfile;
