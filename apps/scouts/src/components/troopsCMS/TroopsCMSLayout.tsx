import React from 'react';

import { IonContent } from '@ionic/react';
import { TroopsCMSState, TroopsCMSViewModeEnum } from './troopCMSState';
import { getWallpaperBackgroundStyles } from '../../helpers/troop.helpers';

type AllowedWallpaperStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
};

type TroopsCMSLayoutProps = {
    state: TroopsCMSState;
    viewMode: TroopsCMSViewModeEnum;
    layoutClassName?: string;
    children: React.ReactNode;
};

export const TroopsCMSLayout: React.FC<TroopsCMSLayoutProps> = ({
    state,
    viewMode,
    layoutClassName,
    children,
}) => {
    const appearance = state?.appearance;
    const parentAppearance = state?.parentID?.appearance;

    const backgroundStyles = getWallpaperBackgroundStyles(
        state?.inheritNetworkStyles ? parentAppearance : appearance
    );

    return (
        <div
            className="w-full flex flex-col items-center justify-start ion-padding overflow-y-scroll h-full"
            style={backgroundStyles}
        >
            <div className={`w-full max-w-[600px] pb-[100px] ${layoutClassName}`}>{children}</div>
        </div>
    );
};

export default TroopsCMSLayout;
