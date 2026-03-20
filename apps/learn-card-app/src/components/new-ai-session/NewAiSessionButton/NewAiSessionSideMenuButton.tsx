import React from 'react';
import { useLocation } from 'react-router-dom';

import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import { IonMenuToggle } from '@ionic/react';

import useTheme from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors';
import { useDeviceTypeByWidth } from 'learn-card-base';
import { chatBotStore } from '../../../stores/chatBotStore';

const NewAiSessionSideMenuButton: React.FC<{ handleNewSession?: () => void }> = ({
    handleNewSession,
}) => {
    const location = useLocation();
    const { getColorSet } = useTheme();
    const { isDesktop } = useDeviceTypeByWidth();

    const colors = getColorSet(ColorSetEnum.sideMenu);

    const isOnTopicsRoute = location.pathname === '/ai/topics';

    const onHandleNewSession = () => {
        if (isOnTopicsRoute && isDesktop) {
            chatBotStore.set.resetStore();
            return;
        }

        handleNewSession?.();
    };

    return (
        <IonMenuToggle
            role="button"
            autoHide={false}
            className={`text-[17px] flex items-center justify-center font-semibold py-[5px] rounded-full w-full max-w-[90%]  h-[45px] max-h-[45px] shadow-soft-bottom ${colors.primaryButtonColor}`}
            onClick={() => {
                onHandleNewSession();
            }}
        >
            New AI Session
            <NewAiSessionIcon className="ml-1" />
        </IonMenuToggle>
    );
};

export default NewAiSessionSideMenuButton;
