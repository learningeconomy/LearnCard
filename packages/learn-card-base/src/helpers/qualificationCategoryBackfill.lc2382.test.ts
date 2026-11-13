/**
 * LC-2382 retake3: the qualification-category backfill used to call wallet.read.get
 * serially after the wallet warmer had already batchResolved the same URIs, which
 * produced standalone storage.resolve (conc=1, one URI each, never repeated).
 *
 * These tests instrument read.get with `new Error().stack` against a mock LearnCloud.
 * No prod services.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { completionStorage } = vi.hoisted(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            location: { hostname: 'localhost' },
            localStorage: {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => store.set(key, value),
                removeItem: (key: string) => store.delete(key),
            },
        },
    });
    return { completionStorage: store };
});

vi.mock('./walletHelpers', () => ({ getBespokeLearnCard: vi.fn() }));

import { QueryClient } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from '../types/learn-card';
import { prefetchResolvedCredentials } from '../react-query/queries/credentialResolution';
import { reconcileQualificationCategories } from './qualificationCategoryBackfill';

const credential = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: 'urn:uuid:license',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2025-01-01T00:00:00Z',
    credentialSubject: {
        id: 'did:example:holder',
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:achievement:License',
            type: ['Achievement'],
            name: 'Professional qualification',
            description: 'Qualification awarded by the issuer.',
            criteria: { narrative: 'Complete the requirements.' },
            achievementType: 'License',
        },
    },
} as unknown as VC;

const cloudUri = (id: string) => `lc:cloud:cloud.learncard.com/trpc:credential:${id}`;
const cloudUrl = 'https://cloud.learncard.com/trpc';

type StackHit = { uri: string; stack: string };

const relevant = (stack: string) =>
    stack
        .split('\n')
        .filter(
            line =>
                /qualificationCategoryBackfill|credentialResolution|resolveViaReadGet|resolveNullSlotsViaRead|processWithConcurrency/.test(
                    line
                ) && !/\.test\.ts/.test(line)
        )
        .join('\n');

const makeWallet = (opts: {
    did: string;
    uris: string[];
    batchHits: boolean;
    stacks: StackHit[];
}) => {
    const batch = vi.fn(async (uris: string[]) =>
        uris.map(() => (opts.batchHits ? credential : null))
    );
    const read = vi.fn(async (uri: string) => {
        opts.stacks.push({ uri, stack: new Error(`read.get ${uri}`).stack ?? '' });
        return credential;
    });
    const records = opts.uris.map((uri, i) => ({
        id: `record-${i}`,
        uri,
        category: 'ID',
    }));
    const update = vi.fn(async () => true);
    const wallet = {
        id: { did: () => opts.did },
        read: { get: read },
        invoke: { learnCloudBatchResolve: batch },
        plugins: [],
        index: {
            LearnCloud: {
                getPage: vi.fn(async () => ({
                    records,
                    hasMore: false,
                    cursor: undefined,
                })),
                update,
            },
        },
    } as unknown as BespokeLearnCard;
    return { wallet, batch, read, update };
};

describe('LC-2382 retake3: category backfill uses shared resolve, not standalone read.get', () => {
    const clients: QueryClient[] = [];

    beforeEach(() => {
        completionStorage.clear();
    });

    afterEach(() => {
        clients.splice(0).forEach(client => client.clear());
        completionStorage.clear();
    });

    const client = () => {
        const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        clients.push(c);
        return c;
    };

    it('prefetch with full batch hits does not call read.get', async () => {
        const stacks: StackHit[] = [];
        const uris = [cloudUri('hit-a'), cloudUri('hit-b')];
        const { wallet, batch, read } = makeWallet({
            did: 'prefetch-hits',
            uris,
            batchHits: true,
            stacks,
        });
        const results = await prefetchResolvedCredentials(client(), wallet, uris);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(read).not.toHaveBeenCalled();
        expect(results.every(Boolean)).toBe(true);
        expect(stacks).toEqual([]);
    });

    it('prefetch with null batch slots retries via read.get from credentialResolution (deploy-dependent fallback)', async () => {
        const stacks: StackHit[] = [];
        const uris = [cloudUri('miss-a'), cloudUri('miss-b')];
        const { wallet, batch, read } = makeWallet({
            did: 'prefetch-nulls',
            uris,
            batchHits: false,
            stacks,
        });
        await prefetchResolvedCredentials(client(), wallet, uris);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(read).toHaveBeenCalledTimes(2);
        const excerpt = relevant(stacks[0]?.stack ?? '');
        expect(excerpt).toMatch(/resolveNullSlotsViaRead|resolveViaReadGet/);
        expect(excerpt).toMatch(/credentialResolution/);
        expect(excerpt).not.toMatch(/qualificationCategoryBackfill\.ts/);
    });

    it('after a warm batch hit, reconcile reuses RQ data and does not call read.get (retake3)', async () => {
        const stacks: StackHit[] = [];
        const uris = [cloudUri('legacy-a'), cloudUri('legacy-b'), cloudUri('legacy-c')];
        const queryClient = client();
        const { wallet, batch, read, update } = makeWallet({
            did: 'warm-backfill',
            uris,
            batchHits: true,
            stacks,
        });

        await prefetchResolvedCredentials(queryClient, wallet, uris);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(read).not.toHaveBeenCalled();

        await reconcileQualificationCategories(wallet, queryClient, cloudUrl);

        expect(read).not.toHaveBeenCalled();
        expect(stacks).toEqual([]);
        expect(batch).toHaveBeenCalledTimes(1);
        expect(update).toHaveBeenCalledTimes(uris.length);
        expect(update).toHaveBeenCalledWith('record-0', { category: 'Qualifications' });
    });

    it('on a cold cache, reconcile joins batchResolve instead of raw wallet.read.get', async () => {
        const stacks: StackHit[] = [];
        const uris = [cloudUri('cold-a'), cloudUri('cold-b')];
        const { wallet, batch, read, update } = makeWallet({
            did: 'cold-backfill',
            uris,
            batchHits: true,
            stacks,
        });

        await reconcileQualificationCategories(wallet, client(), cloudUrl);

        expect(batch).toHaveBeenCalledTimes(1);
        expect(batch.mock.calls[0][0]).toEqual(uris);
        expect(read).not.toHaveBeenCalled();
        expect(stacks).toEqual([]);
        expect(update).toHaveBeenCalledTimes(uris.length);
    });
});
