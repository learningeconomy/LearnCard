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
import { IconSetEnum } from '../../theme/icons';
import { ColorSetEnum } from '../../theme/colors';

export enum MobileNavBarLinks {
    wallet = 'wallet',
    plus = '/boost',
    launchpad = 'launchpad',
}

const MobileNavBar: React.FC = () => {
    const { getIconSet, getColorSet, theme } = useTheme();
    const icons = getIconSet(IconSetEnum.navbar);
    const colors = getColorSet(ColorSetEnum.navbar);
    const { wallet: WalletIcon, plus: PlusIcon, launchPad: LaunchPadIcon } = icons;

    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const isWalletSyncing = walletStore.useTracked.syncState();

    const { newModal } = useModal();
    const { gate } = useLCNGatedAction();
    const { data } = useGetUnreadUserNotifications();

    const navlinks = theme?.navbar ?? [];
    const unreadCount = (data?.notifications?.length ?? 0) > 0 ? data?.notifications.length : null;

    const handleBoostButton = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(
            <AddToLearnCardMenu />,
            {
                sectionClassName: '!max-w-[500px]',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    const activePathname = location.pathname;
    const isWalletTabActive =
        activePathname === '/wallet' || activePathname === '/passport' || activePathname === '/';
    const isLaunchPadTabActive = activePathname === '/launchpad';

    const isSyncing = isWalletSyncing.status === WalletSyncState.Syncing;
    const isCompleted = isWalletSyncing.status === WalletSyncState.Completed;

    let walletText = 'Passport';
    if (isSyncing || isCompleted) walletText = isWalletSyncing?.text ?? 'Passport';

    let walletTextStyles = 'mt-[6px]';
    if (isSyncing) walletTextStyles = `${colors?.syncingColor} mt-[6px] pb-[2px]`;
    if (isCompleted) walletTextStyles = `${colors?.completedColor} mt-[6px] pb-[2px]`;

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
                        }}
                    >
                        {/*
                            tab prop is needed to prevent hard refresh...
                            set href to # to prevent id undefined errors & rerouting
                        */}
                        <IonTabButton tab="/" href="#" className="mobile-nav-hamburger-button">
                            {unreadCount && (
                                <div className="notification-count-mobile alert-indicator-dot">
                                    {unreadCount}
                                </div>
                            )}
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
                                            className={`font-notoSans font-bold text-[14px] ${
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
                                            className="relative rounded-full h-[90px] w-[90px] flex items-center justify-center flex-col border-solid border-[3px] border-grayscale-100"
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
                                            className={`font-notoSans font-bold mt-[6px] text-[14px] ${
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
