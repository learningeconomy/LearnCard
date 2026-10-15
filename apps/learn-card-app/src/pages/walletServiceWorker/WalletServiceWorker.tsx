import React, { useEffect, useRef, useState } from 'react';
import { initLearnCard } from '@learncard/init';
import { redirectStore, chapiStore } from 'learn-card-base';
import type { CredentialStoreEvent } from '@learncard/chapi-plugin';
import { isExchangeRequest } from '../../helpers/chapi.helpers';
import { CredentialReceiveScreen } from '../credentialStorage/CredentialReceiveScreen';

const WalletServiceWorker = () => {
    const activation = useRef<Promise<void>>();
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let cancelled = false;
        if (!activation.current) {
            activation.current = (async () => {
                const wallet = await initLearnCard();
                chapiStore.set.isChapiInteraction(true);
                await wallet.invoke.activateChapiHandler({
                    get: async () => {
                        redirectStore.set.authRedirect('get');
                        return { type: 'redirect', url: `${window.location.origin}/get` };
                    },
                    store: async incoming => {
                        // web-credential-handler versions may wrap the underlying event.
                        const event =
                            (incoming as CredentialStoreEvent & { event?: CredentialStoreEvent })
                                .event ?? incoming;
                        const route = isExchangeRequest(event) ? 'exchange' : 'store';
                        redirectStore.set.authRedirect(route);
                        return { type: 'redirect', url: `${window.location.origin}/${route}` };
                    },
                });
            })();
        }
        activation.current.catch(() => {
            if (!cancelled) setFailed(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return (
        <CredentialReceiveScreen
            credentials={[]}
            connecting
            loading={!failed}
            error={failed ? 'request' : undefined}
        />
    );
};

export default WalletServiceWorker;
