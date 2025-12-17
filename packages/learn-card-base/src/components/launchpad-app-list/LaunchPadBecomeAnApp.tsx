import React from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import LEFLogo from 'learn-card-base/assets/images/lef-logo.png';

import { IonItem } from '@ionic/react';

const BECOME_AN_APP_DOCS_LINK = 'https://docs.learncard.com/tutorials/create-a-connected-website';

export const LaunchPadBecomeAnApp: React.FC = () => {
    const buttonClass =
        'flex items-center justify-center text-indigo-500 font-[600] rounded-full bg-grayscale-100 w-[109px] py-[7px] uppercase text-[12px]';

    const handleLink = async () => {
        if (Capacitor?.isNativePlatform()) {
            await Browser?.open({ url: BECOME_AN_APP_DOCS_LINK });
        } else {
            window?.open(BECOME_AN_APP_DOCS_LINK);
        }
    };

    return (
        <IonItem
            lines="none"
            className="w-[95%] max-w-[600px] ion-no-border px-[12px] py-[16px] border-gray-200 border-b-2 last:border-b-0 flex items-center justify-between notificaion-list-item"
        >
            <div className="flex items-center justify-start w-[100%]">
                <div className="rounded-lg shadow-3xl overflow-hidden w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                    <img className="w-full h-full object-cover" src={LEFLogo} />
                </div>
                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left">
                        <p className="text-grayscale-900 font-medium line-clamp-1">Your App Here</p>
                        <p className="text-grayscale-600 font-medium text-[12px] line-clamp-1">
                            Create Your Own Apps
                        </p>
                    </div>

                    <div className="flex app-connect-btn-container items-center min-w-[109px]">
                        <button className={buttonClass} onClick={handleLink}>
                            Learn More
                        </button>
                    </div>
                </div>
            </div>
        </IonItem>
    );
};

export default LaunchPadBecomeAnApp;
