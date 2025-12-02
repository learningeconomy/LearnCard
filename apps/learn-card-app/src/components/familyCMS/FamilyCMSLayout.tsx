import React from 'react';

import { IonContent } from '@ionic/react';
import { FamilyCMSState } from './familyCMSState';

type AllowedWallpaperStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
};

export const FamilyCMSLayout: React.FC<{
    state: FamilyCMSState;
    children: React.ReactNode;
}> = ({ state, children }) => {
    const appearance = state?.appearance;
    const wallpaperImage = appearance?.backgroundImage;
    const wallpaperBackgroundColor = appearance?.backgroundColor;
    const isWallpaperFaded = appearance?.fadeBackgroundImage;
    const isWallpaperTiled = appearance?.repeatBackgroundImage;

    let backgroundStyles: AllowedWallpaperStylesType = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundImage: `url(${wallpaperImage})`,
        backgroundRepeat: 'no-repeat',
    };

    if (isWallpaperFaded) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${wallpaperImage})`,
        };

        if (wallpaperBackgroundColor) {
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
        <IonContent fullscreen color="grayscale-800">
            <div
                className="w-full flex flex-col items-center justify-start ion-padding overflow-y-scroll h-full"
                style={{
                    ...backgroundStyles,
                }}
            >
                <div className="w-full max-w-[400px] pb-[100px]">{children}</div>
            </div>
        </IonContent>
    );
};

export default FamilyCMSLayout;
