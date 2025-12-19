import React from 'react';
import moment from 'moment';
import numeral from 'numeral';

import { AppStoreAppMetadata, AppStoreAppReview } from 'learn-card-base';

import StaticStarRating from '../helpers/StaticStarRating';
import AppReviewSlider from '../helpers/AppReviewsSlider';

export const AiPassportAppProfileRatings: React.FC<{
    appMetaData: AppStoreAppMetadata;
    appReviews: AppStoreAppReview[];
}> = ({ appMetaData, appReviews }) => {
    const reviews = appReviews ?? [];

    const userRatingCount = appMetaData?.userRatingCount;
    const avgRating = appMetaData?.averageUserRating;
    const formattedAvgRating = avgRating?.toFixed(1);

    const count =
        Number(userRatingCount) >= 1000
            ? numeral(Number(userRatingCount)).format('0.0a')
            : userRatingCount;

    return (
        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
            <h3 className="text-xl text-gray-900 font-notoSans mb-4">Ratings and Reviews</h3>

            <div className="flex w-full items-center justify-between">
                <h5 className="text-[40px] text-grayscale-900">{formattedAvgRating}</h5>

                <div className="flex flex-col items-end justify-center">
                    <StaticStarRating rating={avgRating} color="grayscale-700" fontSize="16px" />
                    <p className="text-xs text-grayscale-500 text-center font-notoSans mt-1">
                        {count} Ratings
                    </p>
                </div>
            </div>

            <AppReviewSlider reviews={reviews} />
        </div>
    );
};

export default AiPassportAppProfileRatings;
