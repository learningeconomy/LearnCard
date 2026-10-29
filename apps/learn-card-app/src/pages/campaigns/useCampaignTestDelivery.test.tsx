import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { inAppMessageValidator, type MyCampaign } from '@learncard/types';
import { useCampaignTestDelivery } from './useCampaignTestDelivery';

const state = vi.hoisted(() => ({
    did: 'did:key:alice',
    uid: 'alice',
    profileReady: true,
    admin: vi.fn(),
    get: vi.fn(),
    record: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useAuthStatus: () => undefined,
    hasNetworkProfile: () => state.profileReady,
    useWallet: () => ({
        initWallet: async () => ({
            id: { did: () => state.did },
            invoke: {
                campaignsIsAdmin: state.admin,
                getMyCampaigns: state.get,
                recordCampaignEvent: state.record,
            },
        }),
    }),
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    currentUserStore: { use: { currentUser: () => ({ uid: state.uid }) } },
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { use: { switchedDid: () => undefined } },
    walletStore: { use: { wallet: () => ({ id: { did: () => state.did } }) } },
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: { use: { networkUrl: () => 'https://network.example' } },
}));
const testId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const pending: MyCampaign = {
    testId,
    campaign: {
        id: 'private-test',
        selfEnroll: false,
        message: inAppMessageValidator.parse({
            id: `campaign-test-${testId}`,
            title: 'Private test',
        }),
    },
    state: { shownCount: 0 },
};
const mount = (path = '/wallet') => {
    const history = createMemoryHistory({ initialEntries: [path] });
    return {
        history,
        ...renderHook(useCampaignTestDelivery, {
            wrapper: ({ children }: { children: React.ReactNode }) => (
                <Router history={history}>{children}</Router>
            ),
        }),
    };
};
beforeEach(() => {
    state.did = 'did:key:alice';
    state.uid = 'alice';
    state.profileReady = true;
    state.admin.mockResolvedValue(true);
    state.get.mockResolvedValue([pending]);
    state.record.mockResolvedValue(true);
});
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});

it('waits until returning from the composer and acknowledges only actual presentation', async () => {
    const view = mount('/admin/campaigns/private-test');
    expect(view.result.current).toBeUndefined();
    expect(state.get).not.toHaveBeenCalled();
    act(() => view.history.push('/wallet'));
    await waitFor(() => expect(view.result.current?.message.title).toBe('Private test'));
    expect(state.record).not.toHaveBeenCalled();
    act(() => {
        view.result.current?.onShown();
        view.result.current?.onShown();
    });
    expect(state.record).toHaveBeenCalledExactlyOnceWith('private-test', 'shown', testId);
    act(() => view.result.current?.onClose());
    expect(view.result.current).toBeUndefined();
});
it('leaves unread tests available across app visits', async () => {
    const first = mount();
    await waitFor(() => expect(first.result.current).toBeDefined());
    first.unmount();
    const next = mount();
    await waitFor(() => expect(next.result.current?.message.title).toBe('Private test'));
    expect(state.record).not.toHaveBeenCalled();
});
it('does not load private tests for a non-admin', async () => {
    state.admin.mockResolvedValue(false);
    const view = mount();
    await waitFor(() => expect(state.admin).toHaveBeenCalled());
    expect(state.get).not.toHaveBeenCalled();
    expect(view.result.current).toBeUndefined();
});
it('drops a late response after the account changes', async () => {
    let resolve!: (value: MyCampaign[]) => void;
    state.get
        .mockReturnValueOnce(
            new Promise<MyCampaign[]>(r => {
                resolve = r;
            })
        )
        .mockResolvedValue([]);
    const view = mount();
    await waitFor(() => expect(state.get).toHaveBeenCalledOnce());
    state.did = 'did:key:bob';
    state.uid = 'bob';
    view.rerender();
    await waitFor(() => expect(state.get).toHaveBeenCalledTimes(2));
    await act(async () => resolve([pending]));
    expect(view.result.current).toBeUndefined();
});

it('waits for profile resolution before requesting admin tests', async () => {
    state.profileReady = false;
    const view = mount();
    expect(state.admin).not.toHaveBeenCalled();
    state.profileReady = true;
    view.rerender();
    await waitFor(() => expect(view.result.current?.message.title).toBe('Private test'));
});
