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
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

import {
    getNavBarColor,
    showNavBar,
    useIsLoggedIn,
    walletStore,
    WalletSyncState,
    lazyWithRetry,
} from 'learn-card-base';

const Routes = lazyWithRetry(() =>
    import('../../Routes').then(module => ({ default: module.Routes }))
);

import useTheme from '../../theme/hooks/useTheme';
import { IconSetEnum, NavbarIcons } from '../../theme/icons';
import { ColorSetEnum } from '../../theme/colors';

export enum MobileNavBarLinks {
    dashboard = 'dashboard',
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
        dashboard: DashboardIcon,
        wallet: WalletIcon,
        launchPad: LaunchPadIcon,
    } = icons as NavbarIcons;

    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const isWalletSyncing = walletStore.useTracked.syncState();

    const navlinks = theme?.navbar ?? [];

    const activePathname = location.pathname;
    const isWalletTabActive =
        activePathname === '/wallet' || activePathname === '/passport' || activePathname === '/';
    const isLaunchPadTabActive = activePathname === '/launchpad';
    const isDashboardTabActive = activePathname === '/dashboard';

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
                    <IonTabBar slot="bottom" className="pb-[15px]">
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
                            if (link.id === MobileNavBarLinks.dashboard) {
                                return (
                                    <IonTabButton key={link.id} tab={link.id} href={link.path}>
                                        {DashboardIcon && (
                                            <DashboardIcon
                                                className={`h-[35px] w-[35px] ${
                                                    isDashboardTabActive
                                                        ? colors?.activeColor
                                                        : colors?.inactiveColor
                                                }`}
                                            />
                                        )}
                                        <IonLabel
                                            className={`font-notoSans font-bold text-[12px] mt-[3px] ${
                                                isDashboardTabActive
                                                    ? colors?.activeColor
                                                    : colors?.inactiveColor
                                            }`}
                                        >
                                            {link.label}
                                        </IonLabel>
                                    </IonTabButton>
                                );
                            }

                            if (link.id === MobileNavBarLinks.wallet) {
                                return (
                                    <IonTabButton key={link.id} tab={link.id} href={link.path}>
                                        {(isSyncing || isCompleted) && (
                                            <div className="flex items-center justify-center absolute top-[8px] z-50 h-[30px] w-[30px] rounded-[10px]">
                                                {isSyncing && (
                                                    <CustomSpinner
                                                        className={`h-[18px] w-[18px] ${colors?.syncingColor}`}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {WalletIcon && (
                                            <WalletIcon
                                                isSyncing={isSyncing}
                                                isCompleted={isCompleted}
                                                version={isWalletTabActive ? '2' : '1'}
                                                className="h-[35px] w-[35px]"
                                            />
                                        )}
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

                            if (link.id === MobileNavBarLinks.launchpad) {
                                return (
                                    <IonTabButton key={link.id} tab={link.id} href={link.path}>
                                        {LaunchPadIcon && (
                                            <LaunchPadIcon
                                                version={isLaunchPadTabActive ? '2' : '1'}
                                                className="h-[35px] w-[35px]"
                                            />
                                        )}
                                        <IonLabel
                                            className={`font-notoSans font-bold text-[12px] mt-[3px] ${
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
                    <IonTabBar slot="bottom" style={{ display: 'none' }} />
                )}
            </IonTabs>
        </GenericErrorBoundary>
    );
};

export default MobileNavBar;
