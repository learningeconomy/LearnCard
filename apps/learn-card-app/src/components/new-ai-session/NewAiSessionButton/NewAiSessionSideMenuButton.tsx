import React from 'react';
import { useLocation } from 'react-router';

import * as m from '../../../paraglide/messages.js';

import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import { AppMenuToggle } from 'learn-card-base/ui/app-shell/AppMenuToggle';

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
        <AppMenuToggle
            role="button"
            autoHide={false}
            className={`text-[17px] flex items-center justify-center text-center leading-tight font-semibold py-[8px] px-[12px] rounded-full w-full max-w-[90%] min-h-[45px] shadow-soft-bottom ${colors.primaryButtonColor}`}
            onClick={() => {
                onHandleNewSession();
            }}
        >
            {m['sidemenu.newAiSession']()}
            <NewAiSessionIcon className="ml-1 shrink-0" />
        </AppMenuToggle>
    );
};

export default NewAiSessionSideMenuButton;
