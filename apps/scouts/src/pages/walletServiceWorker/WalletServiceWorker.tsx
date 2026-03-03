import React, { useEffect } from 'react';
import { initLearnCard } from '@learncard/init';

import { redirectStore, chapiStore } from 'learn-card-base';

import LoadingPage from '../loadingPage/LoadingPage';

const WalletServiceWorker = () => {
    useEffect(() => {
        const chapiInit = async () => {
            const wallet = await initLearnCard();
            chapiStore.set.isChapiInteraction(true);

            wallet.invoke.activateChapiHandler({
                get: async () => {
                    redirectStore.set.authRedirect('get');
                    return { type: 'redirect', url: `${window.location.origin}/get` };
                },
                store: async () => {
                    redirectStore.set.authRedirect('store');
                    return { type: 'redirect', url: `${window.location.origin}/store` };
                },
            });
        };

        chapiInit();
    }, []);

    return <LoadingPage />;
};

export default WalletServiceWorker;
