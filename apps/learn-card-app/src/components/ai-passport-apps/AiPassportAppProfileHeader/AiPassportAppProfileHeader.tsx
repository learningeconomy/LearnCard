import React from 'react';

import AiPassportAppMetadata from './AiPassportAppMetadata';

import { AppStoreAppMetadata, LaunchPadAppListItem } from 'learn-card-base';

export const AiPassportAppProfileHeader: React.FC<{
    app: LaunchPadAppListItem;
    appMetaData: AppStoreAppMetadata;
}> = ({ app, appMetaData }) => {
    const img = app?.img ?? appMetaData?.artworkUrl512;
    const appName = app?.name ?? appMetaData?.trackName;

    return (
        <div className="ion-padding shadow-header safe-area-top-margin">
            <div className="flex items-center justify-normal ion-padding">
                <div className="h-[65px] w-[65px] mr-2">
                    <img
                        className="w-full h-full object-cover bg-white rounded-[16px] overflow-hidden border-[1px] border-solid"
                        alt={`${app?.name} logo`}
                        src={img}
                    />
                </div>
                <div className="flex flex-col items-start justify-center">
                    <p className="text-[22px] font-semibold text-grayscale-900 font-poppins leading-[1]">
                        {appName}
                    </p>
                    <p className="text-sm text-grayscale-600 font-poppins">
                        AI Session: Learning & skill assessments
                    </p>
                </div>
            </div>

            <AiPassportAppMetadata appMetaData={appMetaData} app={app} />
        </div>
    );
};

export default AiPassportAppProfileHeader;
