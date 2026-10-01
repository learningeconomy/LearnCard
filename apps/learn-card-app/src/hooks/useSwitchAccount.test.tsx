import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCNProfile } from '@learncard/types';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useSwitchProfile } from 'learn-card-base/hooks/useSwitchAccount';
import useGetCurrentLCNUser from 'learn-card-base/hooks/useGetCurrentLCNUser';

const state = vi.hoisted(() => ({
    activeDid: '',
    failProfileRead: false,
    failSwitch: false,
    profiles: {} as Record<string, LCNProfile>,
}));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    switchProfile: async (did?: string) => {
        if (state.failSwitch) throw new Error('Wallet unavailable');
        state.activeDid = did ?? '';
        switchedProfileStore.set.switchedDid(did);
    },
}));
vi.mock('learn-card-base/hooks/useGetCurrentLCNUser', () => ({
    default: function useCurrentNetworkProfile() {
        const did = switchedProfileStore.use.switchedDid() ?? '';
        const query = useQuery({
            queryKey: ['getProfile', did, undefined],
            queryFn: async () => {
                if (state.failProfileRead) throw new Error('Profile unavailable');
                return state.profiles[state.activeDid];
            },
            staleTime: 300_000,
        });
        return { currentLCNUser: query.error ? null : query.data, refetch: query.refetch };
    },
}));

const parent: LCNProfile = {
    did: 'did:example:demo',
    profileId: 'demo',
    displayName: 'Demo',
    shortBio: '',
    bio: '',
    image: 'https://example.com/demo.png',
};
const child: LCNProfile = {
    did: 'did:example:child',
    profileId: 'child',
    displayName: 'Lil Demo',
    shortBio: '',
    bio: '',
    image: 'https://example.com/child.png',
    isServiceProfile: false,
};
const parentKey = ['getProfile', '', undefined];
let client: QueryClient;

const mount = async (onSwitch?: () => void) => {
    const hook = renderHook(
        () => ({
            ...useSwitchProfile({ onSwitch }),
            profile: useGetCurrentLCNUser().currentLCNUser,
        }),
        {
            wrapper: ({ children }) => (
                <QueryClientProvider client={client}>{children}</QueryClientProvider>
            ),
        }
    );
    await waitFor(() => expect(hook.result.current.profile?.profileId).toBe(parent.profileId));
    return hook;
};

describe('account switch identity', () => {
    beforeEach(() => {
        client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        state.activeDid = '';
        state.failProfileRead = false;
        state.failSwitch = false;
        state.profiles = { '': parent, [child.did]: child };
        switchedProfileStore.set.switchedDid(undefined);
        switchedProfileStore.set.profileType('parent');
        currentUserStore.set.currentUser({
            uid: 'demo',
            email: '',
            phoneNumber: '',
            name: 'Demo',
            profileImage: '',
            privateKey: 'test-key',
            baseColor: '',
        });
        currentUserStore.set.parentUser(null);
        currentUserStore.set.parentUserDid(null);
    });
    afterEach(() => {
        cleanup();
        client.clear();
        currentUserStore.set.currentUser(null);
        currentUserStore.set.parentUser(null);
        currentUserStore.set.parentUserDid(null);
        currentUserStore.set.parentLDFlags(undefined);
        switchedProfileStore.set.switchedDid(undefined);
        switchedProfileStore.set.profileType(null);
    });

    it('keeps the displayed parent image when a later parent response omits it', async () => {
        const { result } = await mount();
        await act(() => result.current.handleSwitchAccount(child));
        await waitFor(() => expect(result.current.profile?.profileId).toBe(child.profileId));
        state.profiles[''] = { ...parent, image: '' };
        client.setQueryData(parentKey, state.profiles['']);

        await act(() => result.current.handleSwitchBackToParentAccount());
        await waitFor(() => expect(result.current.profile?.profileId).toBe(parent.profileId));
        expect(currentUserStore.get.currentUser()).toMatchObject({
            name: 'Demo',
            profileImage: parent.image,
        });
    });

    it('never writes the child response into the retained parent query', async () => {
        const { result } = await mount();
        await act(() => result.current.handleSwitchAccount(child));
        await waitFor(() => expect(result.current.profile?.profileId).toBe(child.profileId));
        expect(client.getQueryData(parentKey)).toEqual(parent);
        expect(currentUserStore.get.currentUser()).toMatchObject({
            name: child.displayName,
            profileImage: child.image,
        });
    });

    it('completes a successful switch even when the destination profile read fails', async () => {
        const onSwitch = vi.fn();
        const { result } = await mount(onSwitch);
        state.failProfileRead = true;
        await act(() => result.current.handleSwitchAccount(child));
        await waitFor(() =>
            expect(client.getQueryState(['getProfile', child.did, undefined])?.status).toBe('error')
        );
        expect(switchedProfileStore.get.switchedDid()).toBe(child.did);
        expect(currentUserStore.get.currentUser()?.profileImage).toBe(child.image);
        expect(result.current.isSwitching).toBe(false);
        expect(onSwitch).toHaveBeenCalledOnce();
    });

    it('does not report switch completion or replace the identity when wallet switching fails', async () => {
        const onSwitch = vi.fn();
        const { result } = await mount(onSwitch);
        state.failSwitch = true;
        await act(async () => {
            await expect(result.current.handleSwitchAccount(child)).rejects.toThrow(
                'Wallet unavailable'
            );
        });
        expect(switchedProfileStore.get.switchedDid()).toBeUndefined();
        expect(currentUserStore.get.currentUser()?.name).toBe('Demo');
        expect(result.current.isSwitching).toBe(false);
        expect(onSwitch).not.toHaveBeenCalled();
    });
});
