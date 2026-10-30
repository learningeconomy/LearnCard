import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    useWallet,
    useAuthStatus,
    hasNetworkProfile,
    type InAppMessageHostProps,
} from 'learn-card-base';
import type { CampaignTest } from '@learncard/types';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

interface TestSession {
    key: string;
    accountDid: string;
    tests: CampaignTest[];
    acknowledge: (test: CampaignTest) => Promise<boolean>;
}

/** Fetch on app entry/return from the composer, never while authoring or via a persisted cache. */
export const useCampaignTestDelivery = (): InAppMessageHostProps['testDelivery'] => {
    const { initWallet } = useWallet();
    const initialize = useRef(initWallet);
    initialize.current = initWallet;
    const user = currentUserStore.use.currentUser();
    const profileReady = hasNetworkProfile(useAuthStatus());
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const network = networkStore.use.networkUrl();
    const { pathname } = useLocation();
    const authoring = pathname === '/admin/campaigns' || pathname.startsWith('/admin/campaigns/');
    const accountDid = switchedDid || wallet?.id.did();
    const key =
        user && accountDid && profileReady ? `${user.uid}:${accountDid}:${network}` : undefined;
    const [session, setSession] = useState<TestSession>();
    const acknowledgements = useRef(new Set<string>());

    useEffect(() => {
        let active = true;
        setSession(undefined);
        acknowledgements.current.clear();
        if (!key || !accountDid || authoring) return;
        void initialize
            .current()
            .then(async initialized => {
                if (
                    !active ||
                    initialized.id.did() !== accountDid ||
                    !(await initialized.invoke.campaignsIsAdmin())
                )
                    return;
                const campaigns = await initialized.invoke.getMyCampaigns();
                const tests = campaigns.flatMap(item =>
                    item.testId
                        ? [
                              {
                                  id: item.testId,
                                  campaignId: item.campaign.id,
                                  message: item.campaign.message,
                              },
                          ]
                        : []
                );
                if (active) {
                    setSession({
                        key,
                        accountDid,
                        tests,
                        acknowledge: test =>
                            initialized.invoke.recordCampaignEvent(
                                test.campaignId,
                                'shown',
                                test.id
                            ),
                    });
                }
            })
            .catch(() => {
                // Keep the server's pending test for the next visit if the network is unavailable.
            });
        return () => {
            active = false;
        };
    }, [key, accountDid, authoring]);

    const test = !authoring && session?.key === key ? session?.tests[0] : undefined;
    if (!test || !session) return undefined;
    return {
        accountDid: session.accountDid,
        message: test.message,
        onShown: () => {
            if (acknowledgements.current.has(test.id)) return;
            acknowledgements.current.add(test.id);
            void session.acknowledge(test).catch(() => {
                acknowledgements.current.delete(test.id);
            });
        },
        onClose: () =>
            setSession(current =>
                current?.key === session.key
                    ? { ...current, tests: current.tests.filter(item => item.id !== test.id) }
                    : current
            ),
    };
};
