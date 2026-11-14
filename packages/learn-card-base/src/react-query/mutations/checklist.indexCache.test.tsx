// @vitest-environment happy-dom
/**
 * goblincore r4574770689: checklist deletion and recategorization change the index,
 * so the skills aggregate (and the other sticky index keys) must refetch.
 */
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    switchedDid: undefined as string | undefined,
    remove: vi.fn(),
    update: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({
        initWallet: async () => ({
            index: { LearnCloud: { remove: host.remove, update: host.update } },
        }),
    }),
}));
vi.mock('../../stores/walletStore', () => ({
    switchedProfileStore: { get: { switchedDid: () => host.switchedDid } },
}));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { set: { removeCreds: vi.fn(), addNewCreds: vi.fn() } },
}));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

import {
    useDeleteChecklistCredentialMutation,
    useUpdateChecklistItemCategoryMutation,
} from './checklist';

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const observeSkills = async (profileDid: string) => {
    const queryFn = vi.fn().mockResolvedValue([]);
    const observer = new QueryObserver(client, {
        queryKey: ['useGetSkills', profileDid],
        queryFn,
        staleTime: 5 * 60 * 1000,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    return { queryFn, unsubscribe };
};

beforeEach(() => {
    client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();
    host.switchedDid = undefined;
    host.remove.mockResolvedValue(true);
    host.update.mockResolvedValue(true);
});

afterEach(() => {
    cleanup();
    client.clear();
});

it.each([undefined, 'did:web:child'])(
    'refetches skills after a checklist delete (profile %s)',
    async switchedDid => {
        host.switchedDid = switchedDid;
        const skills = await observeSkills(switchedDid ?? '');
        const { result } = renderHook(() => useDeleteChecklistCredentialMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ id: 'record-1', uri: 'uri-1' });
        });

        expect(host.remove).toHaveBeenCalledWith('record-1');
        await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
        skills.unsubscribe();
    }
);

it('refetches skills after a checklist recategorization', async () => {
    const skills = await observeSkills('');
    const { result } = renderHook(() => useUpdateChecklistItemCategoryMutation(), { wrapper });

    await act(async () => {
        await result.current.mutateAsync({ id: 'record-1', category: 'Skill', uri: 'uri-1' });
    });

    expect(host.update).toHaveBeenCalledWith('record-1', {
        category: 'Skill',
        categorySource: 'manual',
    });
    await vi.waitFor(() => expect(skills.queryFn).toHaveBeenCalledTimes(2));
    skills.unsubscribe();
});

it('does not refetch skills when recategorization fails', async () => {
    host.update.mockRejectedValueOnce(new Error('index unavailable'));
    const skills = await observeSkills('');
    const { result } = renderHook(() => useUpdateChecklistItemCategoryMutation(), { wrapper });

    await act(async () => {
        await result.current
            .mutateAsync({ id: 'record-1', category: 'Skill', uri: 'uri-1' })
            .catch(() => undefined);
    });

    expect(skills.queryFn).toHaveBeenCalledTimes(1);
    skills.unsubscribe();
});
