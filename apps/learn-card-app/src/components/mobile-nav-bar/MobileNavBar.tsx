import { useLocation } from 'react-router-dom';

import {
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonMenuToggle,
} from '@ionic/react';
import CustomSpinner from '../svgs/CustomSpinner';
import BurgerIcon from '../../components/svgs/Burger';
import AddToLearnCardMenu from '../../components/add-to-learncard-menu/AddToLearnCardMenu';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';
import LaunchPadActionModal from '../../pages/launchPad/LaunchPadHeader/LaunchPadActionModal';

import {
    getNavBarColor,
    showNavBar,
    useIsLoggedIn,
    useModal,
    ModalTypes,
    walletStore,
    WalletSyncState,
    lazyWithRetry,
} from 'learn-card-base';

const Routes = lazyWithRetry(() =>
    import('../../Routes').then(module => ({ default: module.Routes }))
);

import { useGetUnreadUserNotifications } from 'learn-card-base';
import useLCNGatedAction from '../../components/network-prompts/hooks/useLCNGatedAction';

import useTheme from '../../theme/hooks/useTheme';
import { IconSetEnum, NavbarIcons } from '../../theme/icons';
import { ColorSetEnum } from '../../theme/colors';
import { NavBarIcons } from 'learn-card-base';

import navBarBackground from '../../assets/images/mobile-nav-bar-vector.svg';

const { notification: NavBarBellIcon } = NavBarIcons;

export enum MobileNavBarLinks {
    wallet = 'wallet',
    plus = '/boost',
    launchpad = 'launchpad',
    notification = 'notification',
}

const MobileNavBar: React.FC = () => {
    const { getIconSet, getColorSet, theme } = useTheme();
    const icons = getIconSet(IconSetEnum.navbar);
    const colors = getColorSet(ColorSetEnum.navbar);
    const {
        wallet: WalletIcon,
        plus: PlusIcon,
        launchPad: LaunchPadIcon,
        notification: NotificationIcon = NavBarBellIcon,
    } = icons as NavbarIcons;

    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const isWalletSyncing = walletStore.useTracked.syncState();

    const { newModal } = useModal({
        desktop: ModalTypes.Freeform,
        mobile: ModalTypes.Freeform,
    });
    const { gate } = useLCNGatedAction();
    const { data } = useGetUnreadUserNotifications();

    const navlinks = theme?.navbar ?? [];
    const unreadCount = (data?.notifications?.length ?? 0) > 0 ? data?.notifications.length : null;

    const handleBoostButton = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(<LaunchPadActionModal />, {
            className: 'w-full flex items-center justify-center !bg-white/70 !backdrop-blur-[5px]',
            sectionClassName: '!max-w-[500px] !disable-scrollbars',
        });
    };

    const activePathname = location.pathname;
    const isWalletTabActive =
        activePathname === '/wallet' || activePathname === '/passport' || activePathname === '/';
    const isLaunchPadTabActive = activePathname === '/launchpad';
    const isNotificationTabActive = activePathname === '/notifications';

    const isSyncing = isWalletSyncing.status === WalletSyncState.Syncing;
    const isCompleted = isWalletSyncing.status === WalletSyncState.Completed;

    let walletText = 'Passport';
    if (isSyncing || isCompleted) walletText = isWalletSyncing?.text ?? 'Passport';

    let walletTextStyles = 'mt-[3px]';
    if (isSyncing) walletTextStyles = `${colors?.syncingColor} mt-[3px] pb-[2px]`;
    if (isCompleted) walletTextStyles = `${colors?.completedColor} mt-[3px] pb-[2px]`;

    return (
        <GenericErrorBoundary>
            <IonTabs className={`${getNavBarColor(activePathname)}`}>
                <IonRouterOutlet animated={true}>
                    <Routes />
                </IonRouterOutlet>
                {isLoggedIn && showNavBar(activePathname) ? (
                    <IonTabBar
                        slot="bottom"
                        style={{
                            contain: 'none',
                            overflow: 'visible',
                            backgroundImage: `url(${navBarBackground})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center top',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        {/*
                            tab prop is needed to prevent hard refresh...
                            set href to # to prevent id undefined errors & rerouting
                        */}
                        <IonTabButton tab="/" href="#" className="mobile-nav-hamburger-button">
                            <IonMenuToggle menu="appSideMenu">
                                <BurgerIcon className="text-grayscale-900 h-[35px] w-[35px] m-[10px]" />
                            </IonMenuToggle>
                        </IonTabButton>

                        {navlinks.map(link => {
                            if (link.id === MobileNavBarLinks.wallet) {
                                return (
                                    <IonTabButton
                                        key={link.id}
                                        tab={link.id}
                                        href={link.path}
                                        className="mobile-nav-left-button pl-[5px]"
                                    >
                                        {(isSyncing || isCompleted) && (
                                            <div
                                                className={`flex items-center justify-center absolute top-[8px] z-50  h-[30px] w-[30px] rounded-[10px]`}
                                            >
                                                {isSyncing && (
                                                    <CustomSpinner
                                                        className={`h-[18px] w-[18px] ${colors?.syncingColor}`}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <WalletIcon
                                            isSyncing={isSyncing}
                                            isCompleted={isCompleted}
                                            version={isWalletTabActive ? '2' : '1'}
                                            className={`max-h-[35px] max-w-[35px] h-[35px] w-[35px] min-h-[35px] min-w-[35px]`}
                                        />
                                        <IonLabel
                                            className={`font-notoSans font-bold text-[12px] ${
                                                isWalletTabActive
                                                    ? colors?.activeColor
                                                    : colors?.inactiveColor
                                            } ${walletTextStyles}`}
                                        >
                                            {walletText ?? link.label}
                                        </IonLabel>
                                    </IonTabButton>
                                );
                            }

                            if (link.id === MobileNavBarLinks.plus) {
                                return (
                                    <IonTabButton
                                        key={link.id}
                                        tab={link.id}
                                        onClick={handleBoostButton}
                                        className="mobile-nav-boost-button"
                                    >
                                        <div
                                            style={{
                                                backgroundImage: `url(${PlusIcon})`,
                                                backgroundPosition: 'center',
                                                backgroundSize: 'contain',
                                            }}
                                            className="relative rounded-full h-[75px] w-[75px] flex items-center justify-center flex-col "
                                        />
                                    </IonTabButton>
                                );
                            }

                            if (link.id === MobileNavBarLinks.launchpad) {
                                return (
                                    <IonTabButton
                                        key={link.id}
                                        tab={link.id}
                                        href={link.path}
                                        className="mobile-nav-right-button relative pl-[10px] !rounded-[16px]"
                                    >
                                        <LaunchPadIcon
                                            version={isLaunchPadTabActive ? '2' : '1'}
                                            className="h-[35px] w-[35px] mt-[0px] mb-0"
                                        />
                                        <IonLabel
                                            className={`font-notoSans font-bold mt-[3px] text-[12px] ${
                                                isLaunchPadTabActive
                                                    ? colors?.activeColor
                                                    : colors?.inactiveColor
                                            }`}
                                        >
                                            {link.label}
                                        </IonLabel>
                                    </IonTabButton>
                                );
                            }

                            if (link.id === MobileNavBarLinks.notification) {
                                return (
                                    <IonTabButton
                                        key={link.id}
                                        tab={link.id}
                                        href={link.path}
                                        className="mobile-nav-notification-button"
                                    >
                                        <div className="relative">
                                            <NotificationIcon
                                                version={isNotificationTabActive ? '2' : '1'}
                                                className="h-[40px] w-[40px] mt-[0px] mb-0"
                                            />
                                            {unreadCount > 0 && (
                                                <div className="absolute top-0 right-[5px] h-[7px] w-[7px] bg-blue-500 rounded-[10px]" />
                                            )}
                                            <IonLabel
                                                className={`font-notoSans font-bold text-[12px] ${
                                                    isNotificationTabActive
                                                        ? colors?.activeColor
                                                        : colors?.inactiveColor
                                                }`}
                                            >
                                                {link.label}
                                            </IonLabel>
                                        </div>
                                    </IonTabButton>
                                );
                            }

                            return null;
                        })}
                    </IonTabBar>
                ) : (
                    <IonTabBar
                        slot="bottom"
                        style={{
                            display: 'none',
                        }}
                    />
                )}
            </IonTabs>
        </GenericErrorBoundary>
    );
};

export default MobileNavBar;
