import React, { useEffect } from 'react';

import { IonCol, IonContent, IonPage, IonRow, IonSpinner } from '@ionic/react';
import ScoutPassTextLogo from '../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../assets/images/scoutpass-logo.svg';
import LoginLoadingPage from '../login/LoginPageLoader/LoginLoader';

import { useHistory } from 'react-router-dom';
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
                color="sp-purple-base"
                className="flex items-center justify-center bg-sp-purple-base"
            >
                <IonRow className="h-full w-full flex items-center justify-center">
                    <IonCol className="w-full flex items-center justify-center flex-col">
                        <img src={ScoutPassLogo} alt="ScoutPass logo" className="w-[55px]" />
                        <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
                        <IonSpinner name="crescent" color="light" className="scale-[1.75] mt-8" />
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
                color="sp-purple-base"
                className="flex items-center justify-center bg-sp-purple-base"
            >
                <IonRow className="h-full w-full flex items-center justify-center">
                    <IonCol className="w-full flex items-center justify-center flex-col">
                        <img src={ScoutPassLogo} alt="ScoutPass logo" className="w-[55px]" />
                        <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
                        <IonSpinner name="crescent" color="light" className="scale-[1.75] mt-8" />
                    </IonCol>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export const LoadingPage2: React.FC = React.memo(() => {
    //let query = useQuery();

    const query = usePathQuery();

    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();

    const { installChapi } = useWallet();

    const history = useHistory();

    useEffect(() => {
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
                history.push('/campfire');
            }
            if (!isChapiInteraction) {
                installChapi();
            }
        }
    }, [currentUser, isLoggedIn]);

    return <LoginLoadingPage />;
});
