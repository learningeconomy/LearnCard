/**
 * HCP v1 hooks for the Management Client UI. Calls go through the network plugin's
 * authenticated tRPC client, typed from the brain's AppRouter; the signed-in (or
 * switched) profile is the Context Subject.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LCNClient } from '@learncard/network-brain-client';

import { useWallet } from '../hooks/useWallet';
import { switchedProfileStore } from '../stores/walletStore';

type HcpClient = LCNClient['hcp']['v1'];
export type HcpEntry = Awaited<
    ReturnType<HcpClient['entries']['list']['query']>
>['entries'][number];
export type HcpGrant = Awaited<ReturnType<HcpClient['grants']['create']['mutate']>>;
export type HcpGrantStatus = HcpGrant['status'];
export type HcpEvent = Awaited<ReturnType<HcpClient['audit']['list']['query']>>['events'][number];
export type HcpGrantRequest = Parameters<HcpClient['grants']['create']['mutate']>[0];
export type HcpEntryRequest = Parameters<HcpClient['entries']['create']['mutate']>[0];
export type HcpReviseRequest = Parameters<HcpClient['entries']['revise']['mutate']>[0];

export type HcpChange =
    | { kind: 'add'; input: Omit<HcpEntryRequest, 'subject' | 'grantId'> }
    | { kind: 'edit'; input: Omit<HcpReviseRequest, 'grantId'> }
    | { kind: 'remove'; entryId: string }
    | { kind: 'allow'; input: HcpGrantRequest }
    | { kind: 'revoke'; grantId: string };

const HCP_KEY = 'hcp';

const useHcpKey = (): readonly [string, string] => {
    const switchedDid = switchedProfileStore.use.switchedDid();
    return [HCP_KEY, switchedDid ?? ''] as const;
};

const useHcpClient = (): (() => Promise<HcpClient>) => {
    const { initWallet } = useWallet();
    return async () => (await initWallet()).invoke.getHcpClient();
};

/** The person's entries that are not withdrawn, newest first. */
export const useHcpEntries = () => {
    const key = useHcpKey();
    const client = useHcpClient();
    return useQuery({
        queryKey: [...key, 'entries'],
        queryFn: async () => (await client()).entries.list.query({}),
    });
};

export const useHcpGrants = (status: HcpGrantStatus = 'active') => {
    const key = useHcpKey();
    const client = useHcpClient();
    return useQuery({
        queryKey: [...key, 'grants', status],
        queryFn: async () => (await client()).grants.list.query({ status }),
    });
};

/** The audit log, newest first, 50 events a page. */
export const useHcpActivity = () => {
    const key = useHcpKey();
    const client = useHcpClient();
    return useInfiniteQuery({
        queryKey: [...key, 'activity'],
        initialPageParam: undefined as string | undefined,
        queryFn: async ({ pageParam }) =>
            (await client()).audit.list.query({ limit: 50, cursor: pageParam }),
        getNextPageParam: page => page.nextCursor ?? undefined,
    });
};

/** Every change the UI makes. Refreshes the profile's HCP queries on success. */
export const useHcpChange = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const key = useHcpKey();

    return useMutation({
        mutationFn: async (change: HcpChange) => {
            const wallet = await initWallet();
            const hcp = await wallet.invoke.getHcpClient();
            switch (change.kind) {
                case 'add': {
                    // entries.list names the Context Subject: the profile's stored DID
                    // (normally its did:key), not the did:web that getProfile returns.
                    const { subject } = await queryClient.fetchQuery({
                        queryKey: [...key, 'entries'],
                        queryFn: () => hcp.entries.list.query({}),
                    });
                    return hcp.entries.create.mutate({ ...change.input, subject });
                }
                case 'edit':
                    return hcp.entries.revise.mutate(change.input);
                case 'remove':
                    return hcp.entries.withdraw.mutate({
                        entryId: change.entryId,
                        reason: 'Removed by the person',
                    });
                case 'allow':
                    return hcp.grants.create.mutate(change.input);
                case 'revoke':
                    return hcp.grants.revoke.mutate({ grantId: change.grantId });
                default: {
                    const _exhaustive: never = change;
                    return _exhaustive;
                }
            }
        },
        // Pin the key when the change starts: useMutation swaps in new callbacks on every
        // render, so a profile switch mid-change would otherwise refresh the wrong profile.
        onMutate: () => ({ key }),
        onSuccess: (_result, _change, pinned) =>
            queryClient.invalidateQueries({ queryKey: pinned?.key ?? key }),
    });
};
