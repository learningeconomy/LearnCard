import React from 'react';

import { IonContent } from '@ionic/react';

import { FamilyCMSAppearance } from '../familyCMS/familyCMSState';

type AllowedWallpaperStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
};

export const LearnCardIDCMSLayout: React.FC<{
    learnCardID: FamilyCMSAppearance;
    layoutClassName?: string;
    containerClassName?: string;
    children: React.ReactNode;
}> = ({ learnCardID, layoutClassName, containerClassName, children }) => {
    const appearance = learnCardID;

    const wallpaperImage = appearance?.backgroundImage;
    const wallpaperBackgroundColor = appearance?.backgroundColor;
    const isWallpaperFaded = appearance?.fadeBackgroundImage ?? false;
    const isWallpaperTiled = appearance?.repeatBackgroundImage ?? false;

    let backgroundStyles: AllowedWallpaperStylesType = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // This makes it fixed
        backgroundSize: 'cover',
        backgroundImage: `url(${wallpaperImage})`,
        backgroundRepeat: 'no-repeat',
    };

    if (isWallpaperFaded) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${wallpaperImage})`,
        };

        if (appearance?.backgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${wallpaperBackgroundColor}80, ${wallpaperBackgroundColor}80), url(${wallpaperImage})`,
            };
        }
    }

    if (isWallpaperTiled) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!isWallpaperFaded) {
        backgroundStyles.backgroundColor = wallpaperBackgroundColor;
    }

    return (
        <IonContent fullscreen color="grayscale-200">
            <div
                className={`w-full flex flex-col items-center justify-start ion-padding overflow-y-scroll h-full pt-8 ${containerClassName}`}
                style={{
                    ...backgroundStyles,
                }}
            >
                <div className={`w-full max-w-[400px] pb-[100px] ${layoutClassName}`}>
                    {children}
                </div>
            </div>
        </IonContent>
    );
};

export default LearnCardIDCMSLayout;
