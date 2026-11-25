import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { BespokeLearnCard } from '../../types/learn-card';
import {
    consentedContractsQueryOptions,
    CONSENTED_CONTRACTS_STALE_TIME,
} from './consentedContracts';
const clients: QueryClient[] = [];
const makeClient = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    clients.push(client);
    return client;
};
const makeWallet = (did = 'account-a') => {
    const get = vi.fn().mockResolvedValue({ records: [{ uri: 'terms-a' }], hasMore: false });
    return {
        get,
        wallet: {
            id: { did: () => did },
            invoke: { getConsentedContracts: get },
        } as unknown as BespokeLearnCard,
    };
};
afterEach(() => {
    clients.splice(0).forEach(client => client.clear());
    vi.useRealTimers();
});
describe('consented contract freshness', () => {
    it('shares concurrent and successive consumers until invalidation or expiry', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
        const client = makeClient();
        const { wallet, get } = makeWallet();
        const options = consentedContractsQueryOptions(wallet);
        await Promise.all([client.fetchQuery(options), client.fetchQuery(options)]);
        await client.fetchQuery(options);
        expect(get).toHaveBeenCalledTimes(1);
        await client.invalidateQueries({ queryKey: ['useConsentedContracts', ''] });
        await client.fetchQuery(options);
        expect(get).toHaveBeenCalledTimes(2);
        vi.advanceTimersByTime(CONSENTED_CONTRACTS_STALE_TIME + 1);
        await client.fetchQuery(options);
        expect(get).toHaveBeenCalledTimes(3);
    });
    it('keeps paginated results complete and isolates accounts', async () => {
        const client = makeClient();
        const a = makeWallet();
        const b = makeWallet('account-b');
        a.get
            .mockResolvedValueOnce({ records: [{ uri: 'first' }], hasMore: true, cursor: 'next' })
            .mockResolvedValueOnce({ records: [{ uri: 'second' }], hasMore: false });
        expect(await client.fetchQuery(consentedContractsQueryOptions(a.wallet))).toEqual([
            { uri: 'first' },
            { uri: 'second' },
        ]);
        expect(a.get).toHaveBeenNthCalledWith(2, { cursor: 'next' });
        await client.fetchQuery(consentedContractsQueryOptions(b.wallet));
        expect(b.get).toHaveBeenCalledTimes(1);
    });
});
