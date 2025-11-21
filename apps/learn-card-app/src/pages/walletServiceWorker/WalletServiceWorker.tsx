import React, { useEffect } from 'react';
import { initLearnCard } from '@learncard/init';

import { redirectStore, chapiStore } from 'learn-card-base';

import LoadingPage from '../loadingPage/LoadingPage';
import { isExchangeRequest } from '../../helpers/chapi.helpers';

const WalletServiceWorker = () => {
    useEffect(() => {
        const chapiInit = async () => {
            const wallet = await initLearnCard();
            chapiStore.set.isChapiInteraction(true);

            console.log('🪪 CHAPI Interaction Registering', chapiStore.get.isChapiInteraction());

            wallet.invoke.activateChapiHandler({
                get: async () => {
                    console.log('activateChapiHandler::get::🎃');
                    redirectStore.set.authRedirect('get');
                    return { type: 'redirect', url: `${window.location.origin}/get` };
                },
                store: async event => {
                    console.log('activateChapiHandler::store::🛠', event);

                    // TODO: Fix event.event weirdness here upstream
                    if (isExchangeRequest((event as any).event)) {
                        redirectStore.set.authRedirect('exchange');

                        return { type: 'redirect', url: `${window.location.origin}/exchange` };
                    }

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
