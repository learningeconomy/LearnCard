/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firstContractUri = 'lc:network:production:contract:first-demo-school';
const secondContractUri = 'lc:network:production:contract:second-demo-school';

const firstCredential = { uri: 'lc:credential:first', title: 'First credential' };
const sharedCredentialFromFirstContract = {
    uri: 'lc:credential:shared',
    title: 'Shared credential from first contract',
};
const sharedCredentialFromSecondContract = {
    uri: 'lc:credential:shared',
    title: 'Shared credential from second contract',
};
const secondCredential = { uri: 'lc:credential:second', title: 'Second credential' };

const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    learnCloudGet: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    switchedProfileStore: {
        get: { switchedDid: () => 'did:web:test-user' },
        use: { switchedDid: () => 'did:web:test-user' },
    },
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

import {
    useGetCredentialsFromContract,
    useGetCredentialsFromContracts,
} from '../useGetCredentialsFromContract';

const renderHookWithQueryClient = <Result,>(callback: () => Result) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { ...renderHook(callback, { wrapper }), queryClient };
};

describe('useGetCredentialsFromContracts', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.learnCloudGet.mockImplementation(async ({ contractUri }: { contractUri: string }) => {
            if (contractUri === firstContractUri) {
                return [firstCredential, sharedCredentialFromFirstContract];
            }

            if (contractUri === secondContractUri) {
                return [sharedCredentialFromSecondContract, secondCredential];
            }

            return [];
        });

        mocks.initWallet.mockResolvedValue({
            index: { LearnCloud: { get: mocks.learnCloudGet } },
        });
    });

    it('queries each unique contract URI through singular cache keys and de-duplicates records by uri', async () => {
        const { result, queryClient } = renderHookWithQueryClient(() =>
            useGetCredentialsFromContracts([firstContractUri, secondContractUri, firstContractUri])
        );

        await waitFor(() =>
            expect(result.current.data).toEqual([
                firstCredential,
                sharedCredentialFromFirstContract,
                secondCredential,
            ])
        );

        expect(mocks.learnCloudGet).toHaveBeenCalledTimes(2);
        expect(mocks.learnCloudGet).toHaveBeenNthCalledWith(1, { contractUri: firstContractUri });
        expect(mocks.learnCloudGet).toHaveBeenNthCalledWith(2, { contractUri: secondContractUri });
        expect(
            queryClient.getQueryData([
                'useGetCredentialsFromContract',
                firstContractUri,
                'did:web:test-user',
            ])
        ).toEqual([firstCredential, sharedCredentialFromFirstContract]);
        expect(
            queryClient.getQueryData([
                'useGetCredentialsFromContract',
                secondContractUri,
                'did:web:test-user',
            ])
        ).toEqual([sharedCredentialFromSecondContract, secondCredential]);
        expect(
            queryClient.getQueryCache().findAll({ queryKey: ['useGetCredentialsFromContracts'] })
        ).toEqual([]);
    });
});

describe('useGetCredentialsFromContract', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.initWallet.mockResolvedValue({
            index: { LearnCloud: { get: mocks.learnCloudGet } },
        });
    });

    it('keeps the original singular query key and returns the direct LearnCloud result', async () => {
        const directCredentials = [
            firstCredential,
            sharedCredentialFromFirstContract,
            sharedCredentialFromSecondContract,
        ];

        mocks.learnCloudGet.mockResolvedValueOnce(directCredentials);

        const { result, queryClient } = renderHookWithQueryClient(() =>
            useGetCredentialsFromContract(firstContractUri)
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mocks.learnCloudGet).toHaveBeenCalledOnce();
        expect(mocks.learnCloudGet).toHaveBeenCalledWith({ contractUri: firstContractUri });
        expect(result.current.data).toEqual(directCredentials);
        expect(
            queryClient.getQueryData([
                'useGetCredentialsFromContract',
                firstContractUri,
                'did:web:test-user',
            ])
        ).toEqual(directCredentials);
    });
});
