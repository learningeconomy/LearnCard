import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { m } from '../../../paraglide/messages.js';

import { AppMenuToggle } from 'learn-card-base/ui/app-shell/AppMenuToggle';
import BurgerIcon from '../../../components/svgs/Burger';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import AiPassportPersonalizationContainer from '../../ai-passport/AiPassportPersonalizationContainer';
import NewAiSessionButton, {
    NewAiSessionButtonEnum,
} from '../../new-ai-session/NewAiSessionButton/NewAiSessionButton';

import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';
import { useGetUnreadUserNotifications } from 'learn-card-base';
import {
    useModal,
    useIsLoggedIn,
    useDeviceTypeByWidth,
    ModalTypes,
    ProfilePicture,
} from 'learn-card-base';

import { Capacitor } from '@capacitor/core';
import keyboardStore from 'learn-card-base/stores/keyboardStore';
import { AppFooter } from 'learn-card-base/ui/chrome';

const AiSessionsNavbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const safeArea = useSafeArea();
    const { newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();
    const { data } = useGetUnreadUserNotifications();
    const bottomBarRef = useRef<HTMLDivElement>(null);

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `hidden`;
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `relative w-full flex items-center justify-center z-9999 px-4`;
        }
    });

    const unreadCount = (data?.notifications?.length ?? 0) > 0 ? data?.notifications.length : null;

    const activePathname = location.pathname;
    const isAiTopicsActive = activePathname === '/ai/topics';

    const handlePersonalizationForm = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: 'bg-transparent!' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    if (!isLoggedIn || !isMobile) return null;

    let bottomPosition = 20 + safeArea.bottom;
    if (Capacitor.isNativePlatform()) bottomPosition = safeArea.bottom > 0 ? safeArea.bottom : 20;
    return (
        <AppFooter
            ref={bottomBarRef}
            className={`relative w-full flex items-center justify-center z-9999 px-4`}
        >
            <nav
                className="fixed flex justify-around items-center py-1 min-h-[80px] bg-white/70 backdrop-blur-[5px] max-w-[700px] w-[90%] rounded-[20px] shadow-2xl"
                style={{
                    contain: 'none',
                    overflow: 'visible',
                    bottom: `${bottomPosition}px`,
                }}
            >
                <div className="flex-1 flex items-center justify-center">
                    <div className="absolute left-0">
                        {unreadCount && (
                            <div className="notification-count-mobile alert-indicator-dot absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1">
                                {unreadCount}
                            </div>
                        )}
                        <AppMenuToggle menu="appSideMenu">
                            <BurgerIcon className="text-grayscale-900 h-[35px] w-[35px] m-[10px]" />
                        </AppMenuToggle>
                    </div>

                    <button
                        onClick={() => navigate('/ai/topics')}
                        className="flex flex-col items-center"
                    >
                        <BlueMagicWand
                            version={isAiTopicsActive ? '1' : '2'}
                            className="text-grayscale-700 max-h-[40px] max-w-[40px] h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                        />
                        <span className="text-grayscale-600 font-notoSans font-bold mt-[2px] text-[13px]">
                            {m['ai.aiSessions']()}
                        </span>
                    </button>
                </div>

                <NewAiSessionButton type={NewAiSessionButtonEnum.bottomNav} />

                <div className="flex-1 flex items-center justify-center">
                    <button
                        onClick={handlePersonalizationForm}
                        className="relative flex flex-col items-center"
                    >
                        <ProfilePicture
                            customContainerClass="text-white h-[40px] w-[40px] min-h-[40px] min-w-[40px] max-h-[40px] max-w-[40px] mt-[0px] mb-0"
                            customImageClass="w-full h-full object-cover"
                        />
                        <span className="text-grayscale-600 font-notoSans font-bold mt-[2px] text-[13px]">
                            {m['ai.personalize']()}
                        </span>
                    </button>
                </div>
            </nav>
        </AppFooter>
    );
};

export default AiSessionsNavbar;
