import React from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import AppScreenshotsSlider from '../helpers/AppScreenshotSlider';
import AiPassportAppProfileRatings from './AiPassportAppProfileRatings';

import { getAiAppBackgroundStylesForApp } from '../aiPassport-apps.helpers';

import { AppStoreAppMetadata, AppStoreAppReview, LaunchPadAppListItem } from 'learn-card-base';

export const AiPassportAppProfileDetails: React.FC<{
    app: LaunchPadAppListItem;
    appMetaData: AppStoreAppMetadata;
    appReviews: AppStoreAppReview[];
}> = ({ app, appMetaData, appReviews }) => {
    const appStyles = getAiAppBackgroundStylesForApp(app);

    const appName = app?.name;
    const appDescription = app?.description;

    const appScreenShots = appMetaData?.screenshotUrls ?? [];
    const reviews = appReviews ?? [];

    return (
        <div
            style={{ ...appStyles }}
            className="h-full w-full flex flex-col ion-padding overflow-y-scroll pb-[375px]"
        >
            <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                <h3 className="text-xl text-gray-900 font-notoSans">About</h3>
                <p className="text-grayscale-700 text-sm font-notoSans mt-2 font-normal">
                    <span className="font-semibold">{appName} </span>
                    {appDescription}
                </p>
            </div>
            <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                <h3 className="text-xl text-gray-900 font-notoSans">Why Connect With LearnCard?</h3>
                <div className="flex items-center justify-start">
                    <Checkmark className="text-grayscale-900 w-[24px] h-auto mr-2 shrink-0" />
                    <p className="text-grayscale-700 text-sm font-notoSans mt-2 font-normal">
                        All your learning stored in one place. No need to track notes manually.
                    </p>
                </div>
                <div className="flex items-center justify-start">
                    <Checkmark className="text-grayscale-900 w-[24px] h-auto mr-2 shrink-0" />
                    <p className="text-grayscale-700 text-sm font-notoSans mt-2 font-normal">
                        Universal Summary across sessions. See your trends over time.
                    </p>
                </div>
                <div className="flex items-center justify-start">
                    <Checkmark className="text-grayscale-900 w-[24px] h-auto mr-2 shrink-0" />
                    <p className="text-grayscale-700 text-sm font-notoSans mt-2 font-normal">
                        Seamless chat-to-wallet integration. Instantly save insights and skills
                        earned.
                    </p>
                </div>
            </div>

            {appScreenShots?.length > 0 && (
                <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans mb-4">Preview</h3>

                    <AppScreenshotsSlider appScreenshots={appScreenShots} />
                </div>
            )}

            {reviews?.length > 0 && (
                <AiPassportAppProfileRatings appMetaData={appMetaData} appReviews={appReviews} />
            )}
        </div>
    );
};

export default AiPassportAppProfileDetails;
