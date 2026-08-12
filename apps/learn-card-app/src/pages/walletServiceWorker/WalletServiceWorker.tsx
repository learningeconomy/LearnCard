import React, { useEffect } from 'react';
import { initLearnCard } from '@learncard/init';
import { getLogger } from 'learn-card-base';
const log = getLogger('wallet-service-worker');

import { redirectStore, chapiStore } from 'learn-card-base';

import LoadingPage from '../loadingPage/LoadingPage';
import { isExchangeRequest } from '../../helpers/chapi.helpers';

const WalletServiceWorker = () => {
    useEffect(() => {
        const chapiInit = async () => {
            const wallet = await initLearnCard();
            chapiStore.set.isChapiInteraction(true);

            log.info('🪪 CHAPI Interaction Registering', chapiStore.get.isChapiInteraction());

            wallet.invoke.activateChapiHandler({
                get: async () => {
                    log.info('activateChapiHandler::get::🎃');
                    redirectStore.set.authRedirect('get');
                    return { type: 'redirect', url: `${window.location.origin}/get` };
                },
                store: async event => {
                    log.info('activateChapiHandler::store::🛠', event);

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
