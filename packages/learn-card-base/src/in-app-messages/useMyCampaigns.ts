import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import type { MyCampaign } from '@learncard/types';

import { useWallet } from '../hooks/useWallet';
import { useIsLoggedIn } from '../stores/currentUserStore';
import { switchedProfileStore, walletStore } from '../stores/walletStore';
import { networkStore } from '../stores/NetworkStore';
import { useIsCurrentUserLCNUser } from '../react-query/queries/queries';
import { getLogger } from '../logging/logger';
import { EMPTY_CAMPAIGNS, isCampaignInWindow } from './campaignMessages';
import { useInAppMessageRequest } from './deepLinkRequestStore';
import type { InAppMessagePresentationEvent } from './presentationTypes';

const log = getLogger('campaigns');
const enrollmentRequests = new Map<string, Promise<boolean>>();
const enrolledThisSession = new Set<string>();
const enrollmentRetryAt = new Map<string, number>();

export interface CampaignMessageSource {
    campaigns: MyCampaign[];
    accountDid: string | null;
    ready: boolean;
    enroll: (campaignId: string) => Promise<boolean>;
    record: (event: InAppMessagePresentationEvent, deviceMatched: boolean) => void;
}

/** Network/profile-scoped source for the existing message host. No credential facts leave it. */
export const useMyCampaigns = (): CampaignMessageSource => {
    const isLoggedIn = useIsLoggedIn();
    const { data: isLCNUser, isLoading: profileLoading } = useIsCurrentUserLCNUser();
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const network = networkStore.use.networkUrl();
    const accountDid = isLoggedIn ? (switchedDid ?? wallet?.id.did() ?? null) : null;
    const enabled = Boolean(isLoggedIn && wallet && accountDid && isLCNUser);
    const scope = enabled ? JSON.stringify([network, accountDid]) : null;
    const { initWallet } = useWallet();
    const active = useRef(scope);
    const initRef = useRef(initWallet);
    useLayoutEffect(() => {
        active.current = scope;
        initRef.current = initWallet;
        return () => {
            active.current = null;
        };
    }, [scope, initWallet]);

    const getWallet = useCallback(async () => {
        if (!scope || active.current !== scope) throw new Error('Campaign profile changed');
        const current = await initRef.current();
        if (active.current !== scope || current.id.did() !== accountDid)
            throw new Error('Campaign profile changed');
        return current;
    }, [scope, accountDid]);

    const query = useQuery<MyCampaign[]>({
        queryKey: ['useMyCampaigns', network, accountDid],
        enabled,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: 'always',
        retry: false,
        queryFn: async (): Promise<MyCampaign[]> => {
            try {
                const current = await getWallet();
                const campaigns = await current.invoke.getMyCampaigns();
                if (active.current !== scope) throw new Error('Campaign profile changed');
                return campaigns;
            } catch (error) {
                log.warn('Campaign fetch failed');
                throw error;
            }
        },
    });
    const { refetch } = query;
    const request = useInAppMessageRequest();
    const lookupKey = request && scope ? `${scope}:${request.token}` : null;
    const [resolvedLookup, setResolvedLookup] = useState<string | null>(null);
    useEffect(() => {
        if (!lookupKey) return;
        let canceled = false;
        void refetch().finally(() => {
            if (!canceled) setResolvedLookup(lookupKey);
        });
        return () => {
            canceled = true;
        };
    }, [lookupKey, refetch]);
    useEffect(() => {
        if (!enabled || !Capacitor.isNativePlatform()) return;
        let disposed = false;
        let remove: (() => Promise<void>) | undefined;
        void import('@capacitor/app')
            .then(({ App }) =>
                App.addListener('appStateChange', state => {
                    if (state.isActive && active.current === scope) void refetch();
                })
            )
            .then(handle => {
                if (disposed) void handle.remove();
                else remove = () => handle.remove();
            })
            .catch(() => log.warn('Campaign resume listener unavailable'));
        return () => {
            disposed = true;
            void remove?.();
        };
    }, [enabled, scope, refetch]);

    const campaigns = enabled ? (query.data ?? EMPTY_CAMPAIGNS) : EMPTY_CAMPAIGNS;
    const byId = useMemo(
        () => new Map(campaigns.map(item => [item.campaign.id, item])),
        [campaigns]
    );
    const enroll = useCallback(
        (campaignId: string): Promise<boolean> => {
            const item = byId.get(campaignId);
            if (
                !scope ||
                active.current !== scope ||
                !item?.campaign.selfEnroll ||
                !item.campaign.message.enabled ||
                !isCampaignInWindow(item, Date.now())
            )
                return Promise.resolve(false);
            const key = `lcb-campaign-enrolled:${encodeURIComponent(scope)}:${campaignId}`;
            try {
                if (enrolledThisSession.has(key) || globalThis.localStorage?.getItem(key) === '1')
                    return Promise.resolve(true);
            } catch {
                /* Session suppression still works without storage. */
            }
            const pending = enrollmentRequests.get(key);
            if (pending) return pending;
            if ((enrollmentRetryAt.get(key) ?? 0) > Date.now()) return Promise.resolve(false);
            const request = (async () => {
                try {
                    const current = await getWallet();
                    const accepted = await current.invoke.enrollInCampaign(campaignId);
                    if (accepted) {
                        enrolledThisSession.add(key);
                        try {
                            globalThis.localStorage?.setItem(key, '1');
                        } catch {
                            /* Optional persistence. */
                        }
                    } else {
                        enrollmentRetryAt.set(key, Date.now() + 60_000);
                        log.warn('Campaign enrollment was not accepted');
                    }
                    return accepted;
                } catch {
                    enrollmentRetryAt.set(key, Date.now() + 60_000);
                    log.warn('Campaign enrollment failed');
                    return false;
                } finally {
                    enrollmentRequests.delete(key);
                }
            })();
            enrollmentRequests.set(key, request);
            return request;
        },
        [byId, getWallet, scope]
    );

    const record = useCallback(
        (event: InAppMessagePresentationEvent, deviceMatched: boolean): void => {
            if (!event.campaignId || event.source === 'override' || active.current !== scope)
                return;
            const campaignId = event.campaignId;
            const campaign = byId.get(campaignId);
            if (!campaign || (event.type === 'action' && event.actionType === 'dismiss')) return;
            const kind = event.type === 'action' ? 'clicked' : event.type;
            void (async () => {
                // Direct entry alone never opts a profile into a credential-derived audience.
                if (campaign.campaign.selfEnroll && deviceMatched) await enroll(campaignId);
                const current = await getWallet();
                const accepted = await current.invoke.recordCampaignEvent(campaignId, kind);
                if (!accepted) log.warn('Campaign engagement was not accepted');
            })().catch(() => log.warn('Campaign engagement failed'));
        },
        [byId, enroll, getWallet, scope]
    );

    const ready =
        !profileLoading &&
        (!enabled || (query.isFetched && (!lookupKey || resolvedLookup === lookupKey)));
    return useMemo(
        () => ({ campaigns, accountDid, ready, enroll, record }),
        [campaigns, accountDid, ready, enroll, record]
    );
};
