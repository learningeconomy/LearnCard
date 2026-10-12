import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver, QueriesObserver } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';
import {
    fetchResolvedCredential,
    resolvedCredentialQueryKey,
    resolvedCredentialQueryOptions,
} from './credentialResolution';

const credential = { type: ['VerifiableCredential'], credentialSubject: { id: 'subject' } } as VC;
const makeWallet = (did: string, read = vi.fn().mockResolvedValue(credential)) => ({
    wallet: { id: { did: () => did }, read: { get: read } } as unknown as BespokeLearnCard,
    read,
});
const clients: QueryClient[] = [];
const makeClient = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    clients.push(client);
    return client;
};
afterEach(() => clients.splice(0).forEach(client => client.clear()));

describe('shared credential resolution', () => {
    it('shares a pending document between single, multi and imperative consumers', async () => {
        const client = makeClient();
        let resolve!: (vc: VC) => void;
        const { wallet, read } = makeWallet(
            'account-a',
            vi.fn(
                () =>
                    new Promise<VC>(r => {
                        resolve = r;
                    })
            )
        );
        const options = resolvedCredentialQueryOptions(wallet, 'credential-uri');
        const single = new QueryObserver(client, options);
        const many = new QueriesObserver(client, [options, options]);
        const stopSingle = single.subscribe(() => {});
        const stopMany = many.subscribe(() => {});
        const pending = fetchResolvedCredential(client, wallet, 'credential-uri');
        expect(read).toHaveBeenCalledTimes(1);
        resolve(credential);
        await expect(pending).resolves.toEqual(credential);
        expect(single.getCurrentResult().data).toEqual(credential);
        expect(many.getCurrentResult().map(result => result.data)).toEqual([
            credential,
            credential,
        ]);
        await fetchResolvedCredential(client, wallet, 'credential-uri');
        expect(read).toHaveBeenCalledTimes(1);
        stopSingle();
        stopMany();
    });

    it('isolates the same URI by account', async () => {
        const client = makeClient();
        const a = makeWallet('account-a');
        const other = { ...credential, credentialSubject: { id: 'other-subject' } } as VC;
        const b = makeWallet('account-b', vi.fn().mockResolvedValue(other));
        expect(await fetchResolvedCredential(client, a.wallet, 'same-uri')).toEqual(credential);
        expect(await fetchResolvedCredential(client, b.wallet, 'same-uri')).toEqual(other);
        expect(a.read).toHaveBeenCalledTimes(1);
        expect(b.read).toHaveBeenCalledTimes(1);
    });

    it('honors URI-prefix invalidation and explicit observer refetches', async () => {
        const client = makeClient();
        const { wallet, read } = makeWallet('account-a');
        await fetchResolvedCredential(client, wallet, 'uri');
        read.mockResolvedValue({ ...credential, name: 'Updated' });
        await client.invalidateQueries({ queryKey: ['useGetResolvedCredential', 'uri'] });
        expect(await fetchResolvedCredential(client, wallet, 'uri')).toMatchObject({
            name: 'Updated',
        });
        const observer = new QueryObserver(client, resolvedCredentialQueryOptions(wallet, 'uri'));
        await observer.refetch();
        expect(read).toHaveBeenCalledTimes(3);
        expect(client.getQueryData(resolvedCredentialQueryKey('uri', 'account-a'))).toMatchObject({
            name: 'Updated',
        });
    });

    it('does not retain failed or missing reads as fresh data', async () => {
        const client = makeClient();
        const { wallet, read } = makeWallet(
            'account-a',
            vi
                .fn()
                .mockRejectedValueOnce(new Error('offline'))
                .mockResolvedValueOnce(undefined)
                .mockResolvedValue(credential)
        );
        await expect(fetchResolvedCredential(client, wallet, 'uri')).rejects.toThrow('offline');
        await expect(fetchResolvedCredential(client, wallet, 'uri')).rejects.toThrow(
            'Unable to resolve'
        );
        await expect(fetchResolvedCredential(client, wallet, 'uri')).resolves.toEqual(credential);
        expect(read).toHaveBeenCalledTimes(3);
    });
});
