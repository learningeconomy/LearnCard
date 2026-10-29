import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import type { CampaignApi } from './types';
import { CampaignRoutes, CampaignNotFound } from './CampaignRoutes';
import { Busy, Notice, buttonClass } from './ui';

const CampaignSession: React.FC = () => {
    const { initWallet } = useWallet();
    const initialize = useRef(initWallet);
    initialize.current = initWallet;
    // A private, non-persisted cache is discarded on account/network change or route exit.
    const [queries] = useState(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            })
    );
    const [api, setApi] = useState<CampaignApi>();
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setFailed(false);
        void initialize
            .current()
            .then(wallet => {
                if (active) setApi(wallet.invoke);
            })
            .catch(() => {
                if (active) setFailed(true);
            });
        return () => {
            active = false;
            queries.clear();
        };
    }, [attempt, queries]);
    if (failed)
        return (
            <>
                <Notice error>Your account could not be loaded. Please try again.</Notice>
                <button
                    type="button"
                    className={buttonClass}
                    onClick={() => setAttempt(value => value + 1)}
                >
                    Try again
                </button>
            </>
        );
    if (!api) return <Busy>Loading your account...</Busy>;
    return (
        <QueryClientProvider client={queries}>
            <CampaignRoutes api={api} />
        </QueryClientProvider>
    );
};

const CampaignsPage: React.FC = () => {
    const user = currentUserStore.use.currentUser();
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const network = networkStore.use.networkUrl();
    const key = `${user?.uid}:${wallet?.id.did()}:${switchedDid}:${network}`;
    return (
        <IonPage>
            <IonContent>
                <main className="font-poppins text-grayscale-900 bg-grayscale-100 min-h-full p-4 sm:p-8">
                    <div className="max-w-6xl mx-auto">
                        {user ? <CampaignSession key={key} /> : <CampaignNotFound />}
                    </div>
                </main>
            </IonContent>
        </IonPage>
    );
};
export default CampaignsPage;
