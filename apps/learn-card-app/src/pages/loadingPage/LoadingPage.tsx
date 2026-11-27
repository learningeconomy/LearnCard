import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getLogger } from 'learn-card-base';
const log = getLogger('loading-page');

import { AppCol, AppRow } from '../../components/layout';

import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { useTheme } from '../../theme/hooks/useTheme';
import LoginLoadingPage from '../login/LoginPageLoader/LoginLoader';

import {
    useWallet,
    usePathQuery,
    redirectStore,
    chapiStore,
    useCurrentUser,
    useIsLoggedIn,
} from 'learn-card-base';
import { AppContent, AppPage } from '../../components/chrome';

const LoadingPage: React.FC = () => {
    const { textLogo } = useTenantBrandingAssets();
    const { theme } = useTheme();
    const loaderColor = theme.colors.defaults.loaders?.[0] ?? '#8B5CF6';

    return (
        <AppPage>
            <AppContent fullscreen className="flex items-center justify-center">
                <AppRow
                    className="h-full w-full flex items-center justify-center"
                    style={{ backgroundColor: loaderColor }}
                >
                    <AppCol className="w-full flex items-center justify-center flex-col">
                        <img
                            src={textLogo}
                            alt="Logo"
                            className="mb-8 max-w-[300px] max-h-[80px] object-contain"
                        />
                    </AppCol>
                </AppRow>
            </AppContent>
        </AppPage>
    );
};

export default LoadingPage;

export const LoadingPageDumb: React.FC = () => {
    const { textLogo } = useTenantBrandingAssets();
    const { theme } = useTheme();
    const loaderColor = theme.colors.defaults.loaders?.[0] ?? '#8B5CF6';

    return (
        <AppPage>
            <AppContent fullscreen className="flex items-center justify-center">
                <AppRow
                    className="h-full w-full flex items-center justify-center"
                    style={{ backgroundColor: loaderColor }}
                >
                    <AppCol className="w-full flex items-center justify-center flex-col">
                        <img
                            src={textLogo}
                            alt="Logo"
                            className="mb-8 max-w-[300px] max-h-[80px] object-contain"
                        />
                    </AppCol>
                </AppRow>
            </AppContent>
        </AppPage>
    );
};

export const LoadingPage2: React.FC = React.memo(() => {
    const query = usePathQuery();

    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();

    const { installChapi } = useWallet();

    const history = useHistory();

    useEffect(() => {
        // If logged out on waitingsofa, always go to /login, preserving redirectTo if present
        const pendingRedirect = query.get('redirectTo');
        if (!currentUser && !isLoggedIn) {
            if (pendingRedirect)
                history.replace(`/login?redirectTo=${encodeURIComponent(pendingRedirect)}`);
            else history.replace('/login');
            return;
        }

        // handles redirecting a user to an LC network specific action / page
        const handleLCNetworkRedirect = async (redirect: string) => {
            try {
                const wallet = await initWallet();
                const currentUserLCProfile = await wallet?.invoke?.getProfile();

                if (currentUserLCProfile) {
                    history.push(redirect);
                }
            } catch (e) {
                history.push(redirect);
            }
        };

        if (currentUser || isLoggedIn) {
            const redirectTo = redirectStore.get.authRedirect() || query.get('redirectTo');
            const lcnRedirectTo = redirectStore.get.lcnRedirect();
            const isChapiInteraction = chapiStore.get.isChapiInteraction();
            if (redirectTo) {
                try {
                    redirectStore.set.lcnRedirect(null);
                    redirectStore.set.authRedirect(null);
                    chapiStore.set.isChapiInteraction(null);
                } catch (e) {
                    log.error(e);
                }
                history.push(redirectTo);
            } else if (lcnRedirectTo) {
                redirectStore.set.lcnRedirect(null);
                handleLCNetworkRedirect(lcnRedirectTo);
            } else {
                history.push('/launchpad');
            }
            if (!isChapiInteraction) {
                installChapi();
            }
        }
    }, [currentUser, isLoggedIn]);

    return <LoginLoadingPage />;
});

LoadingPage2.displayName = 'LoadingPage2';
