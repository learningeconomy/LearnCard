import React from 'react';

import { IonItem, IonList } from '@ionic/react';
import LaunchPadBecomeAnApp from './LaunchPadBecomeAnApp';

export enum LaunchPadAppType {
    AI = 'ai',
    LEARNING = 'learning',
    GAME = 'game',
    INTEGRATION = 'integration',
}

export type LaunchPadAppListItem = {
    id: string | number;
    name: string;
    description: string;
    img: string;
    isConnected: boolean | null;
    comingSoon?: boolean;
    displayInLaunchPad: boolean;
    handleConnect: () => void;
    handleView: () => void;
    type?: string;
    appStoreID?: string;
    contractUri?: string;
    privacyPolicyUrl?: string;
    appType?: LaunchPadAppType[];
    embedUrl?: string;
};

export const LaunchPadAppList: React.FC<{ apps: LaunchPadAppListItem[] }> = ({ apps }) => {
    const buttonClass =
        'flex items-center justify-center text-indigo-500 font-[600] rounded-full bg-grayscale-100 w-[109px] py-[7px] uppercase text-[12px] h-fit leading-[130%]';
    const appItems = apps.map((app, index) => {
        if (!app.displayInLaunchPad) return null;

        return (
            <IonItem
                key={index}
                lines="none"
                className="w-[95%] max-w-[600px] ion-no-border px-[12px] py-[16px] border-gray-200 border-b-2 last:border-b-0 flex items-center justify-between notificaion-list-item"
            >
                <div className="flex items-center justify-start w-[100%]">
                    <div className="rounded-lg shadow-3xl overflow-hidden w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                        <img className="w-full h-full object-cover" src={app?.img} />
                    </div>
                    <div className="right-side flex justify-between w-full">
                        <div className="flex flex-col items-start justify-center text-left">
                            <p className="text-grayscale-900 font-medium line-clamp-1">
                                {app?.name}
                            </p>
                            <p className="text-grayscale-600 font-medium text-[12px] line-clamp-1">
                                {app?.description}
                            </p>
                        </div>

                        <div className="flex app-connect-btn-container items-center">
                            {app.isConnected === null && (
                                <button className={buttonClass}>Loading...</button>
                            )}
                            {app.isConnected !== null && (
                                <button
                                    onClick={app.isConnected ? app.handleView : app.handleConnect}
                                    className={buttonClass}
                                >
                                    {app.isConnected ? 'View' : 'Connect'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </IonItem>
        );
    });

    return (
        <IonList lines="none" className="flex flex-col items-center justify-center w-[100%] pb-14">
            {appItems}
            <LaunchPadBecomeAnApp />
        </IonList>
    );
};

export default LaunchPadAppList;
