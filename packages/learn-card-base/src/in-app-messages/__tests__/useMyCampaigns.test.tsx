// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { inAppMessageValidator, type MyCampaign } from '@learncard/types';
import { requestInAppMessage, clearInAppMessageRequest } from '../deepLinkRequestStore';
import { useMyCampaigns } from '../useMyCampaigns';

const state = vi.hoisted(() => ({
    did: 'alice',
    switchedDid: undefined as string | undefined,
    loggedIn: true,
    lcn: true,
    fetch: vi.fn(),
    enroll: vi.fn(),
    record: vi.fn(),
    init: vi.fn(),
    warn: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('../../hooks/useWallet', () => ({ useWallet: () => ({ initWallet: state.init }) }));
vi.mock('../../stores/currentUserStore', () => ({
    useIsLoggedIn: () => state.loggedIn,
    currentUserStore: { get: { currentUser: () => (state.loggedIn ? {} : null) } },
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: {
        use: { wallet: () => ({ id: { did: () => state.did } }) },
        get: { wallet: () => ({ id: { did: () => state.did } }) },
    },
    switchedProfileStore: {
        use: { switchedDid: () => state.switchedDid },
        get: { switchedDid: () => state.switchedDid },
    },
}));
vi.mock('../../stores/NetworkStore', () => ({
    networkStore: {
        use: { networkUrl: () => 'local-network' },
        get: { networkUrl: () => 'local-network' },
    },
}));
vi.mock('../../react-query/queries/queries', () => ({
    useIsCurrentUserLCNUser: () => ({ data: state.lcn, isLoading: false }),
}));
vi.mock('../../logging/logger', () => ({ getLogger: () => ({ warn: state.warn }) }));

const item = (id = 'test-campaign'): MyCampaign => ({
    campaign: {
        id,
        selfEnroll: true,
        message: inAppMessageValidator.parse({ id, title: 'Targeted', frequency: 'once' }),
    },
    state: { shownCount: 0 },
});
let client: QueryClient;
let sequence = 0;
beforeEach(() => {
    vi.clearAllMocks();
    clearInAppMessageRequest();
    state.did = `alice-${++sequence}`;
    state.switchedDid = undefined;
    state.loggedIn = state.lcn = true;
    localStorage.clear();
    state.fetch.mockResolvedValue([item()]);
    state.enroll.mockResolvedValue(true);
    state.record.mockResolvedValue(true);
    state.init.mockImplementation(async () => {
        const did = state.switchedDid ?? state.did;
        return {
            id: { did: () => did },
            invoke: {
                getMyCampaigns: state.fetch,
                enrollInCampaign: state.enroll,
                recordCampaignEvent: state.record,
            },
        };
    });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
    cleanup();
    client.clear();
    focusManager.setFocused(undefined);
});
const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

it.each(['loggedOut', 'notLCN'] as const)(
    'does not fetch or expose cached campaigns when %s',
    async condition => {
        if (condition === 'loggedOut') state.loggedIn = false;
        else state.lcn = false;
        const { result } = renderHook(useMyCampaigns, { wrapper });
        await act(async () => {});
        expect(state.fetch).not.toHaveBeenCalled();
        expect(result.current.campaigns).toEqual([]);
    }
);
it('caches for five minutes but refetches on focus for cross-device state and pauses', async () => {
    const { result } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.campaigns).toHaveLength(1));
    const query = client
        .getQueryCache()
        .find({ queryKey: ['useMyCampaigns', 'local-network', state.did] });
    expect(query?.isStaleByTime(300_000)).toBe(false);
    state.fetch.mockResolvedValue([]);
    act(() => {
        focusManager.setFocused(false);
        focusManager.setFocused(true);
    });
    await waitFor(() => expect(result.current.campaigns).toEqual([]));
    expect(state.fetch).toHaveBeenCalledTimes(2);
});
it('deduplicates concurrent enrollment, persists success, and isolates switched profiles', async () => {
    const { result, rerender } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
        await Promise.all([
            result.current.enroll('test-campaign'),
            result.current.enroll('test-campaign'),
        ]);
    });
    await result.current.enroll('test-campaign');
    expect(state.enroll).toHaveBeenCalledTimes(1);
    state.switchedDid = 'managed-profile';
    rerender();
    expect(result.current.campaigns).toEqual([]);
    await waitFor(() => expect(result.current.campaigns).toHaveLength(1));
    await result.current.enroll('test-campaign');
    expect(state.enroll).toHaveBeenCalledTimes(2);
});
it('does not persist failed enrollment and retries after backoff without a request storm', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(100_000);
    state.enroll.mockRejectedValueOnce(new Error('private credential facts must not be logged'));
    const { result } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(await result.current.enroll('test-campaign')).toBe(false);
    expect(await result.current.enroll('test-campaign')).toBe(false);
    expect(localStorage.length).toBe(0);
    expect(state.enroll).toHaveBeenCalledTimes(1);
    now.mockReturnValue(160_001);
    expect(await result.current.enroll('test-campaign')).toBe(true);
    expect(state.warn).toHaveBeenCalledWith('Campaign enrollment failed');
    expect(JSON.stringify(state.warn.mock.calls)).not.toContain('private credential');
    now.mockRestore();
});
it('sequences matching self-enrollment before engagement and sends only ID/event', async () => {
    let finish: (value: boolean) => void = () => undefined;
    state.enroll.mockImplementation(
        () =>
            new Promise<boolean>(resolve => {
                finish = resolve;
            })
    );
    const { result } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    result.current.record(
        {
            type: 'shown',
            messageId: 'test-campaign',
            campaignId: 'test-campaign',
            source: 'deepLink',
            presentation: 'modal',
        },
        true
    );
    await waitFor(() => expect(state.enroll).toHaveBeenCalledOnce());
    expect(state.record).not.toHaveBeenCalled();
    await act(async () => {
        finish(true);
    });
    await waitFor(() => expect(state.record).toHaveBeenCalledWith('test-campaign', 'shown'));
});
it('preserves direct-entry attribution without enrolling on bypass, and ignores overrides/dismiss actions', async () => {
    const { result } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    const event = {
        type: 'shown' as const,
        messageId: 'test-campaign',
        campaignId: 'test-campaign',
        source: 'deepLink' as const,
        presentation: 'modal' as const,
    };
    result.current.record(event, false);
    await waitFor(() => expect(state.record).toHaveBeenCalledWith('test-campaign', 'shown'));
    result.current.record({ ...event, source: 'override' }, true);
    result.current.record({ ...event, type: 'action', actionType: 'dismiss' }, true);
    expect(state.enroll).not.toHaveBeenCalled();
    expect(state.record).toHaveBeenCalledTimes(1);
});
it('cancels stale wallet resolution before sending an enrollment or engagement as another profile', async () => {
    const { result, rerender } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    let resume: () => void = () => undefined;
    state.init.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                resume = () =>
                    resolve({
                        id: { did: () => 'other' },
                        invoke: { enrollInCampaign: state.enroll },
                    });
            })
    );
    const pending = result.current.enroll('test-campaign');
    state.loggedIn = false;
    rerender();
    resume();
    expect(await pending).toBe(false);
    expect(state.enroll).not.toHaveBeenCalled();
    expect(result.current.campaigns).toEqual([]);
});

it('refreshes a fresh cache on every explicit entry before declaring an ID unknown', async () => {
    state.fetch.mockResolvedValueOnce([]);
    const { result } = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    let finish: (items: MyCampaign[]) => void = () => undefined;
    state.fetch.mockImplementationOnce(
        () =>
            new Promise<MyCampaign[]>(resolve => {
                finish = resolve;
            })
    );
    act(() => requestInAppMessage('new-campaign'));
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(state.fetch).toHaveBeenCalledTimes(2));
    await act(async () => finish([item('new-campaign')]));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.campaigns[0].campaign.id).toBe('new-campaign');
});

it('fetches after the network profile becomes ready with a fresh wallet callback each render', async () => {
    const original = state.init;
    state.lcn = false;
    const { result, rerender } = renderHook(useMyCampaigns, { wrapper });
    await act(async () => {});
    state.lcn = true;
    state.init = vi.fn((...args) => original(...args));
    rerender();
    await waitFor(() => expect(result.current.campaigns).toHaveLength(1));
    state.init = original;
});

it('keeps a shared in-flight read usable when the host remounts for the same profile', async () => {
    let finish!: (wallet: Awaited<ReturnType<typeof state.init>>) => void;
    const wallet = await state.init();
    state.init.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                finish = resolve;
            })
    );
    const first = renderHook(useMyCampaigns, { wrapper });
    await waitFor(() => expect(finish).toBeDefined());
    first.unmount();
    const next = renderHook(useMyCampaigns, { wrapper });
    await act(async () => finish(wallet));
    await waitFor(() => expect(next.result.current.campaigns).toHaveLength(1));
});
