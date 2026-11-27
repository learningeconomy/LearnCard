import React, { useEffect } from 'react';

import ScoutPassTextLogo from '../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../assets/images/scoutpass-logo.svg';
import LoginLoadingPage from '../login/LoginPageLoader/LoginLoader';

import { useNavigate } from 'react-router';
import { getLogger } from 'learn-card-base';
const log = getLogger('loading-page');
import {
    useWallet,
    usePathQuery,
    redirectStore,
    chapiStore,
    useCurrentUser,
    useIsLoggedIn,
} from 'learn-card-base';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const LoadingPage: React.FC = () => {
    return (
        <AppPage>
            <AppContent
                fullscreen
                color="sp-purple-base"
                className="flex items-center justify-center bg-sp-purple-base"
            >
                <AppRow className="h-full w-full flex items-center justify-center">
                    <AppCol className="w-full flex items-center justify-center flex-col">
                        <img src={ScoutPassLogo} alt="" className="w-[55px]" />
                        <img src={ScoutPassTextLogo} alt="" className="mt-4" />
                        <AppSpinner name="crescent" color="light" className="scale-[1.75] mt-8" />
                    </AppCol>
                </AppRow>
            </AppContent>
        </AppPage>
    );
};

export default LoadingPage;

export const LoadingPageDumb: React.FC = () => {
    return (
        <AppPage>
            <AppContent
                fullscreen
                color="sp-purple-base"
                className="flex items-center justify-center bg-sp-purple-base"
            >
                <AppRow className="h-full w-full flex items-center justify-center">
                    <AppCol className="w-full flex items-center justify-center flex-col">
                        <img src={ScoutPassLogo} alt="" className="w-[55px]" />
                        <img src={ScoutPassTextLogo} alt="" className="mt-4" />
                        <AppSpinner name="crescent" color="light" className="scale-[1.75] mt-8" />
                    </AppCol>
                </AppRow>
            </AppContent>
        </AppPage>
    );
};

// eslint-disable-next-line react/display-name -- existing anonymous memo/forwardRef component; naming it is out of scope here
export const LoadingPage2: React.FC = React.memo(() => {
    //let query = useQuery();

    const query = usePathQuery();

    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();

    const { installChapi } = useWallet();

    const navigate = useNavigate();

    useEffect(() => {
        // handles redirecting a user to an LC network specific action / page
        const handleLCNetworkRedirect = async (redirect: string) => {
            try {
                const wallet = await initWallet();
                const currentUserLCProfile = await wallet?.invoke?.getProfile();

                if (currentUserLCProfile) {
                    navigate(redirect);
                }
            } catch (e) {
                navigate(redirect);
            }
        };

        if (currentUser || isLoggedIn) {
            const redirectTo = redirectStore.get.authRedirect() || query.get('redirectTo');
            const lcnRedirectTo = redirectStore.get.lcnRedirect();
            const isChapiInteraction = chapiStore.get.isChapiInteraction();
            if (redirectTo) {
                try {
                    redirectStore.set.authRedirect(null);
                    chapiStore.set.isChapiInteraction(null);
                } catch (e) {
                    log.error(e);
                }
                navigate(redirectTo);
            } else if (lcnRedirectTo) {
                handleLCNetworkRedirect(lcnRedirectTo);
            } else {
                navigate('/campfire');
            }
            if (!isChapiInteraction) {
                installChapi();
            }
        }
    }, [currentUser, isLoggedIn]);

    return <LoginLoadingPage />;
});
