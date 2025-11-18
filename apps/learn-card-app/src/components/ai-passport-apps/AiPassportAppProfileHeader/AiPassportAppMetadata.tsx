import React from 'react';
import numeral from 'numeral';

import { AppStoreAppMetadata, LaunchPadAppListItem } from 'learn-card-base';
import StaticStarRating from '../helpers/StaticStarRating';
import { AiPassportAppRankingEnum } from '../aiPassport-apps.helpers';

export const AiPassportAppMetadata: React.FC<{
    app: LaunchPadAppListItem;
    appMetaData: AppStoreAppMetadata;
}> = ({ app, appMetaData }) => {
    const avgRating = appMetaData?.averageUserRating;
    const formattedAvgRating = avgRating?.toFixed(1);

    const userRatingCount = appMetaData?.userRatingCount;
    const appCategoryRank = AiPassportAppRankingEnum[app?.type];

    const count =
        Number(userRatingCount) >= 1000
            ? numeral(Number(userRatingCount)).format('0.0a')
            : userRatingCount;

    return (
        <div className="flex items-center justify-evenly">
            <div className="flex flex-col items-center justify-center pl-4 pr-6 border-r-solid border-r-grayscale-200 border-r-[1px]">
                <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                    {count} Ratings
                </p>
                <h6 className="text-grayscale-600 font-bold text-[17px] my-2 font-notoSans">
                    {formattedAvgRating}
                </h6>
                <StaticStarRating rating={avgRating} />
            </div>
            <div className="flex flex-col items-center justify-center pl-4 pr-6 border-r-solid border-r-grayscale-200 border-r-[1px]">
                <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                    AGE
                </p>
                <h6 className="text-grayscale-600 font-bold text-[17px] my-2 font-notoSans">12+</h6>
                <p className="text-xs text-grayscale-400 text-center font-notoSans uppercase">
                    Years Old
                </p>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
                <p className="text-sm text-grayscale-400 text-center font-notoSans uppercase">
                    Category
                </p>
                <h6 className="text-grayscale-600 font-bold text-[17px] my-2 font-notoSans">
                    #{appCategoryRank}
                </h6>
                <p className="text-xs text-grayscale-400 text-center font-notoSans uppercase">
                    AI Tutor
                </p>
            </div>
        </div>
    );
};

export default AiPassportAppMetadata;
