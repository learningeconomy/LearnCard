import React from 'react';
import { useParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';

import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';
import { useGetConnection } from 'learn-card-base/react-query/queries/queries';

const ConnectedAppInfo: React.FC = () => {
    const { profileId } = useParams<{ profileId: string }>();
    const { data: appRegistryInfo, isLoading: appInfoLoading } = useTrustedAppsRegistry(profileId);

    const { data: connection } = useGetConnection(profileId);

    return (
        <div
            className={`flex gap-[10px] min-h-[60px] ${appInfoLoading ? 'items-center justify-center' : ''
                }`}
        >
            {!appInfoLoading && (
                <>
                    <img
                        className="w-[60px] h-[60px] object-cover rounded-[10px] shadow-bottom"
                        src={appRegistryInfo?.app.icon ?? connection?.image}
                        alt={`${appRegistryInfo?.app.name} icon`}
                    />
                    <div className="flex flex-col">
                        <span className="font-[700] text-[17px] leading-[22px]">
                            {appRegistryInfo?.app.name ?? connection?.displayName ?? '...'}
                        </span>
                        <span className="font-[500] leading-[17px] text-[14px]">
                            {appRegistryInfo?.organization.name}
                        </span>
                    </div>
                </>
            )}
            {appInfoLoading && <IonSpinner />}
        </div>
    );
};

export default ConnectedAppInfo;
