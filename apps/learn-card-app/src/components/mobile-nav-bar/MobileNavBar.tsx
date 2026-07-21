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

import * as m from '../../paraglide/messages.js';
import { getNavBarLinkLabel } from './mobileNavBarI18n';

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

    // Active tab icon sits in a themed pill (indigo/blue -200 @ 50% + white
    // border) per the Figma "LearnCard Footer Nav - V3".
    // Strip only the trailing shade (`-500`) so multi-word families survive,
    // e.g. `baltic-blue-500` → `baltic-blue` (not `baltic`). Safelist the
    // resulting `bg-{family}-200/50` in tailwind.config.js.
    const pillFamily = theme?.colors?.defaults?.primaryColor?.replace(/-\d+$/, '') || 'indigo';
    const iconPillClass = (active: boolean): string =>
        `flex items-center justify-center p-[5px] rounded-[40px] ${
            active ? `border border-solid border-white bg-${pillFamily}-200/50` : ''
        }`;

    const activePathname = location.pathname;
    const isWalletTabActive =
        activePathname === '/wallet' || activePathname === '/passport' || activePathname === '/';
    const isLaunchPadTabActive = activePathname === '/launchpad';
    const isDashboardTabActive = activePathname === '/dashboard';

    const isSyncing = isWalletSyncing.status === WalletSyncState.Syncing;
    const isCompleted = isWalletSyncing.status === WalletSyncState.Completed;

    let walletText: string = m['sidemenu.links.passport']();
    if (isSyncing || isCompleted)
        walletText = isWalletSyncing?.text ?? m['sidemenu.links.passport']();

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
                    <IonTabBar slot="bottom" className="lc-footer-nav pb-[15px]">
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
                                        <div
                                            className={`${iconPillClass(
                                                isDashboardTabActive
                                            )} relative`}
                                        >
                                            {DashboardIcon && (
                                                <DashboardIcon
                                                    className={`h-[35px] w-[35px] ${
                                                        isDashboardTabActive
                                                            ? colors?.activeColor
                                                            : colors?.inactiveColor
                                                    }`}
                                                />
                                            )}
                                            {/* New-items indicator, top-right of the icon (Figma).
                                                Hidden until the unread/new-items logic exists —
                                                was hardcoded to always show. */}
                                            {/* <span className="absolute top-[4px] right-[2px] h-[6px] w-[6px] rounded-full bg-red-500" /> */}
                                        </div>
                                        <IonLabel
                                            className={`font-poppins font-semibold text-[11px] mt-[3px] ${
                                                isDashboardTabActive
                                                    ? colors?.activeColor
                                                    : colors?.inactiveColor
                                            }`}
                                        >
                                            {getNavBarLinkLabel(link)}
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
                                        <div className={iconPillClass(isWalletTabActive)}>
                                            {WalletIcon && (
                                                <WalletIcon
                                                    isSyncing={isSyncing}
                                                    isCompleted={isCompleted}
                                                    version={isWalletTabActive ? '2' : '1'}
                                                    className="h-[35px] w-[35px]"
                                                />
                                            )}
                                        </div>
                                        <IonLabel
                                            className={`font-poppins font-semibold text-[11px] ${
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
                                        <div className={iconPillClass(isLaunchPadTabActive)}>
                                            {LaunchPadIcon && (
                                                <LaunchPadIcon
                                                    version={isLaunchPadTabActive ? '2' : '1'}
                                                    className="h-[35px] w-[35px]"
                                                />
                                            )}
                                        </div>
                                        <IonLabel
                                            className={`font-poppins font-semibold text-[11px] mt-[3px] ${
                                                isLaunchPadTabActive
                                                    ? colors?.activeColor
                                                    : colors?.inactiveColor
                                            }`}
                                        >
                                            {getNavBarLinkLabel(link)}
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
