// @vitest-environment happy-dom
import React, { act } from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({
    switchedDid: undefined as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: {
        get: { switchedDid: () => host.switchedDid },
        use: { switchedDid: () => host.switchedDid },
    },
    ...(await import('../../types/boostCategories')),
}));
vi.mock('../../stores/walletStore', () => ({ walletStore: {} }));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({}));
vi.mock('learn-card-base/hooks/useWallet', () => ({ getCategoryForCredential: vi.fn() }));
vi.mock('../queries/idCredentials', () => ({ getIDsQueryKey: vi.fn() }));
vi.mock('./syncAllCredentials', () => ({ useSyncAllCredentialsToContractsMutation: vi.fn() }));
vi.mock('./syncConsentFlow', () => ({
    useSyncConsentContractsMutation: vi.fn(),
    useAcceptAndStoreCredentialsMutation: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useGetCredentialRecordForBoost', () => ({
    getOrFetchCredentialRecordForBoost: vi.fn(),
}));
vi.mock('learn-card-base/helpers/backfills', () => ({ backfillResolvedCredentialRecord: vi.fn() }));
vi.mock('./pruneConsentFlowDeletedCredentials', () => ({
    deleteCredentialFromAllContracts: vi.fn(),
}));

import { initialBoostCMSState } from '../../components/boost/boost';
import { BoostCategoryOptionsEnum } from '../../types/boostCategories';
import { getPaginatedManagedBoostsKey } from '../queries/vcQueries';
import { useCreateBoost, useCreateChildBoost, useDeleteManagedBoostMutation } from './boosts';

const category = BoostCategoryOptionsEnum.achievement;
const variables = {
    parentUri: 'boost:parent',
    state: {
        ...initialBoostCMSState,
        basicInfo: { ...initialBoostCMSState.basicInfo, name: 'New boost', type: category },
    },
    status: 'LIVE',
} satisfies Parameters<ReturnType<typeof useCreateBoost>['mutateAsync']>[0];
const list = (...uris: string[]) => ({
    pageParams: [undefined, 'next'],
    pages: [
        { records: uris.map(uri => ({ uri })), cursor: 'next', hasMore: true },
        { records: [{ uri: 'boost:other-page' }], hasMore: false },
    ],
});
const wallet = {
    id: { did: () => 'did:key:reader' },
    invoke: {
        newCredential: vi.fn(() => ({})),
        createBoost: vi.fn(),
        createChildBoost: vi.fn(),
        deleteBoost: vi.fn(),
        resolveFromLCN: vi.fn().mockResolvedValue({}),
    },
};
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
    vi.clearAllMocks();
    host.switchedDid = 'did:web:parent';
    host.init.mockResolvedValue(wallet);
    client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.restoreAllMocks();
});

const createCases = [
    {
        name: 'create boost',
        useCreate: () => {
            const { mutateAsync } = useCreateBoost();
            return () => mutateAsync({ ...variables, parentUri: undefined });
        },
        request: wallet.invoke.createBoost,
    },
    {
        name: 'create boost with parent',
        useCreate: () => {
            const { mutateAsync } = useCreateBoost();
            return () => mutateAsync(variables);
        },
        request: wallet.invoke.createChildBoost,
    },
    {
        name: 'create child boost',
        useCreate: () => {
            const { mutateAsync } = useCreateChildBoost();
            return () => mutateAsync(variables);
        },
        request: wallet.invoke.createChildBoost,
    },
];

describe.each(createCases)('$name profile pinning', ({ useCreate, request }) => {
    it.each(['did:web:parent', undefined])(
        'updates only the initiating profile (%s) when the profile switches mid-create',
        async did => {
            host.switchedDid = did;
            const parentKey = getPaginatedManagedBoostsKey(category, did ?? '');
            const childKey = getPaginatedManagedBoostsKey(category, 'did:web:child');
            const parentList = list('boost:existing');
            const childList = list('boost:child');
            client.setQueryData(parentKey, parentList);
            client.setQueryData(childKey, childList);
            const cancel = vi.spyOn(client, 'cancelQueries');
            const refetch = vi.spyOn(client, 'refetchQueries');
            const pending = Promise.withResolvers<string>();
            request.mockReturnValueOnce(pending.promise);
            const { result } = renderHook(useCreate, { wrapper });

            let settled: Promise<unknown>;
            await act(async () => {
                settled = result.current();
                await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
            });
            host.switchedDid = 'did:web:child';
            await act(async () => {
                pending.resolve('boost:new');
                await settled;
            });

            expect(client.getQueryData(parentKey)).toEqual({
                ...parentList,
                pages: [
                    {
                        ...parentList.pages[0],
                        records: [
                            {
                                uri: 'boost:new',
                                name: 'New boost',
                                type: '',
                                category,
                                status: 'LIVE',
                            },
                            { uri: 'boost:existing' },
                        ],
                    },
                    parentList.pages[1],
                ],
            });
            expect(client.getQueryData(childKey)).toEqual(childList);
            expect(cancel).toHaveBeenCalledWith({ queryKey: parentKey });
            expect(refetch).toHaveBeenCalledWith({ queryKey: parentKey });
            expect(cancel).not.toHaveBeenCalledWith({ queryKey: childKey });
            expect(refetch).not.toHaveBeenCalledWith({ queryKey: childKey });
        }
    );

    it('pins the key before wallet initialization yields', async () => {
        const parentKey = getPaginatedManagedBoostsKey(category, 'did:web:parent');
        const childKey = getPaginatedManagedBoostsKey(category, 'did:web:child');
        client.setQueryData(parentKey, list('boost:existing'));
        const childList = list('boost:child');
        client.setQueryData(childKey, childList);
        const pending = Promise.withResolvers<typeof wallet>();
        host.init.mockReturnValueOnce(pending.promise);
        request.mockResolvedValueOnce('boost:new');
        const { result } = renderHook(useCreate, { wrapper });
        let settled: Promise<unknown>;
        await act(async () => {
            settled = result.current();
            await vi.waitFor(() => expect(host.init).toHaveBeenCalledOnce());
        });
        host.switchedDid = 'did:web:child';
        await act(async () => {
            pending.resolve(wallet);
            await settled;
        });
        expect(client.getQueryData(parentKey)).toMatchObject({
            pages: [
                { records: [{ uri: 'boost:new' }, { uri: 'boost:existing' }] },
                { records: [{ uri: 'boost:other-page' }] },
            ],
        });
        expect(client.getQueryData(childKey)).toEqual(childList);
    });
});

describe('useDeleteManagedBoostMutation recovery', () => {
    it.each(['did:web:parent', undefined])(
        'restores both snapshots and invalidates only the captured managed key (%s) on failure',
        async did => {
            host.switchedDid = did;
            const parentKey = getPaginatedManagedBoostsKey(category, did ?? '');
            const childKey = getPaginatedManagedBoostsKey(category, 'did:web:child');
            const resolvedKey = ['useGetResolvedBoostsFromCategory', category];
            const parentList = list('boost:delete', 'boost:keep');
            const childList = list('boost:child');
            const resolvedList = [
                { boost: { uri: 'boost:delete' } },
                { boost: { uri: 'boost:keep' } },
            ];
            client.setQueryData(parentKey, parentList);
            client.setQueryData(childKey, childList);
            client.setQueryData(resolvedKey, resolvedList);
            const pending = Promise.withResolvers<void>();
            wallet.invoke.deleteBoost.mockReturnValueOnce(pending.promise);
            const { result } = renderHook(useDeleteManagedBoostMutation, { wrapper });

            let settled: Promise<unknown>;
            await act(async () => {
                settled = result.current
                    .mutateAsync({ boostUri: 'boost:delete', category })
                    .catch(error => error);
                await vi.waitFor(() => expect(wallet.invoke.deleteBoost).toHaveBeenCalledOnce());
            });
            expect(client.getQueryData(parentKey)).toEqual(list('boost:keep'));
            expect(client.getQueryData(resolvedKey)).toEqual([resolvedList[1]]);
            host.switchedDid = 'did:web:child';
            const error = new Error('delete failed');
            await act(async () => {
                pending.reject(error);
                expect(await settled).toBe(error);
            });

            expect(client.getQueryData(parentKey)).toEqual(parentList);
            expect(client.getQueryData(resolvedKey)).toEqual(resolvedList);
            expect(client.getQueryState(parentKey)?.isInvalidated).toBe(true);
            expect(client.getQueryData(childKey)).toEqual(childList);
            expect(client.getQueryState(childKey)?.isInvalidated).toBe(false);
        }
    );

    it('captures the key before query cancellation yields to a profile switch', async () => {
        const parentKey = getPaginatedManagedBoostsKey(category, 'did:web:parent');
        const childKey = getPaginatedManagedBoostsKey(category, 'did:web:child');
        const parentList = list('boost:delete');
        const childList = list('boost:delete', 'boost:child');
        client.setQueryData(parentKey, parentList);
        client.setQueryData(childKey, childList);
        const cancel = client.cancelQueries.bind(client);
        vi.spyOn(client, 'cancelQueries').mockImplementationOnce(async filters => {
            host.switchedDid = 'did:web:child';
            await cancel(filters);
        });
        const pending = Promise.withResolvers<void>();
        wallet.invoke.deleteBoost.mockReturnValueOnce(pending.promise);
        const { result } = renderHook(useDeleteManagedBoostMutation, { wrapper });
        let settled: Promise<unknown>;
        await act(async () => {
            settled = result.current.mutateAsync({ boostUri: 'boost:delete', category });
            await vi.waitFor(() => expect(wallet.invoke.deleteBoost).toHaveBeenCalledOnce());
        });
        expect(client.getQueryData(parentKey)).toEqual(list());
        expect(client.getQueryData(childKey)).toEqual(childList);
        await act(async () => {
            pending.resolve();
            await settled;
        });
        expect(client.getQueryState(parentKey)?.isInvalidated).toBe(true);
        expect(client.getQueryState(childKey)?.isInvalidated).toBe(false);
    });
});
