import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { IonCol, IonContent, IonPage, IonRow, IonSpinner } from '@ionic/react';

import LearnCardTextLogo from '../../assets/images/learncard-text-logo.svg';
import LoginLoadingPage from '../login/LoginPageLoader/LoginLoader';

import {
    useWallet,
    usePathQuery,
    redirectStore,
    chapiStore,
    useCurrentUser,
    useIsLoggedIn,
} from 'learn-card-base';

const LoadingPage: React.FC = () => {
    return (
        <IonPage>
            <IonContent
                fullscreen
                color="purple-loader"
                className="flex items-center justify-center"
            >
                <IonRow className="h-full w-full flex items-center justify-center">
                    <IonCol className="w-full flex items-center justify-center flex-col">
                        <img src={LearnCardTextLogo} alt="LearnCard text logo" className="mb-8" />
                    </IonCol>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default LoadingPage;

export const LoadingPageDumb: React.FC = () => {
    return (
        <IonPage>
            <IonContent
                fullscreen
                color="purple-loader"
                className="flex items-center justify-center"
            >
                <IonRow className="h-full w-full flex items-center justify-center">
                    <IonCol className="w-full flex items-center justify-center flex-col">
                        <img src={LearnCardTextLogo} alt="LearnCard text logo" className="mb-8" />
                    </IonCol>
                </IonRow>
            </IonContent>
        </IonPage>
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
            if (pendingRedirect) history.replace(`/login?redirectTo=${pendingRedirect}`);
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
                    redirectStore.set.authRedirect(null);
                    chapiStore.set.isChapiInteraction(null);
                } catch (e) {
                    console.error(e);
                }
                history.push(redirectTo);
            } else if (lcnRedirectTo) {
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
