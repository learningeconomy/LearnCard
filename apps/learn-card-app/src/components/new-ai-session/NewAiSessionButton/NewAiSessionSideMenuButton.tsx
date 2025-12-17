import React from 'react';

import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import { IonMenuToggle } from '@ionic/react';

import useTheme from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors';

const NewAiSessionSideMenuButton: React.FC<{ handleNewSession?: () => void }> = ({
    handleNewSession,
}) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.sideMenu);

    return (
        <IonMenuToggle
            role="button"
            autoHide={false}
            className={`text-[17px] flex items-center justify-center font-semibold py-[5px] rounded-full w-full max-w-[90%]  h-[45px] max-h-[45px] shadow-soft-bottom ${colors.primaryButtonColor}`}
            onClick={() => {
                handleNewSession?.();
            }}
        >
            New AI Session
            <NewAiSessionIcon className="ml-1" />
        </IonMenuToggle>
    );
};

export default NewAiSessionSideMenuButton;
