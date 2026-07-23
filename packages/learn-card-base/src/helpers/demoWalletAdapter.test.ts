import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { demoSessionStore } from 'learn-card-base/stores/demoSessionStore';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { DemoModeError, isDemoModeError, wrapWalletForDemo } from './demoWalletAdapter';

const DEMO_URI_A = 'lc:demo:test-persona:badge-1';
const DEMO_URI_B = 'lc:demo:test-persona:course-1';

const demoRecords = [
    {
        id: DEMO_URI_A,
        uri: DEMO_URI_A,
        category: 'Achievement',
        title: 'Badge',
        date: '2026-01-02',
    },
    {
        id: DEMO_URI_B,
        uri: DEMO_URI_B,
        category: 'Learning History',
        title: 'Course',
        date: '2026-01-01',
    },
] as LCR[];

const demoVCs = {
    [DEMO_URI_A]: { id: DEMO_URI_A, name: 'Badge' } as unknown as VC,
    [DEMO_URI_B]: { id: DEMO_URI_B, name: 'Course' } as unknown as VC,
};

const TOPIC_BOOST_URI = 'lc:demo:test-persona:boost:topic';
const SESSION_BOOST_URI = 'lc:demo:test-persona:boost:session';

const demoBoosts = {
    [TOPIC_BOOST_URI]: {
        boost: { uri: TOPIC_BOOST_URI, name: 'Topic' },
        childUris: [SESSION_BOOST_URI],
    },
    [SESSION_BOOST_URI]: {
        boost: { uri: SESSION_BOOST_URI, name: 'Session' },
        childUris: [],
    },
};

const makeFakeWallet = () => {
    const fns = {
        indexGet: vi.fn(async () => [
            { id: 'real', uri: 'lc:cloud:real', category: 'Achievement' },
        ]),
        indexGetPage: vi.fn(async () => ({ records: [], hasMore: false })),
        indexGetCount: vi.fn(async () => 42),
        indexAdd: vi.fn(async () => true),
        indexRemove: vi.fn(async () => true),
        storeUpload: vi.fn(async () => 'lc:cloud:uploaded'),
        storeUploadEncrypted: vi.fn(async () => 'lc:cloud:uploaded'),
        readGet: vi.fn(async () => ({ id: 'lc:cloud:real' })),
        issueCredential: vi.fn(async () => ({ proof: {} })),
        countBoosts: vi.fn(async () => 7),
        getBoost: vi.fn(async () => ({ uri: 'lc:network:real-boost' })),
        getBoostChildren: vi.fn(async () => ({ records: [], hasMore: false })),
    };

    const wallet = {
        index: {
            LearnCloud: {
                get: fns.indexGet,
                getPage: fns.indexGetPage,
                getCount: fns.indexGetCount,
                add: fns.indexAdd,
                remove: fns.indexRemove,
            },
        },
        store: {
            LearnCloud: {
                upload: fns.storeUpload,
                uploadEncrypted: fns.storeUploadEncrypted,
            },
        },
        read: { get: fns.readGet },
        invoke: {
            issueCredential: fns.issueCredential,
            countBoosts: fns.countBoosts,
            getBoost: fns.getBoost,
            getBoostChildren: fns.getBoostChildren,
        },
        id: { did: () => 'did:key:test' },
    } as unknown as BespokeLearnCard;

    return { wallet, fns };
};

describe('wrapWalletForDemo', () => {
    beforeEach(() => {
        demoSessionStore.set.exitDemo();
    });

    describe('when demo mode is inactive', () => {
        it('passes reads and writes through untouched', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            const records = await wrapped.index.LearnCloud.get();
            expect(records[0]?.uri).toBe('lc:cloud:real');
            expect(fns.indexGet).toHaveBeenCalled();

            await expect(wrapped.index.LearnCloud.add({ id: 'x', uri: 'x' })).resolves.toBe(true);
            expect(fns.indexAdd).toHaveBeenCalled();

            await wrapped.read.get('lc:cloud:real');
            expect(fns.readGet).toHaveBeenCalled();

            await expect(wrapped.invoke.issueCredential({} as never)).resolves.toBeDefined();
        });
    });

    describe('when demo mode is active', () => {
        beforeEach(() => {
            demoSessionStore.set.enterDemo({
                personaId: 'test-persona',
                personaName: 'Test Persona',
                records: demoRecords,
                vcs: demoVCs,
                boosts: demoBoosts,
            });
        });

        it('serves demo boosts and children for lc:demo: uris, passes real uris through', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            const topicBoost = await wrapped.invoke.getBoost(TOPIC_BOOST_URI);
            expect((topicBoost as { name?: string })?.name).toBe('Topic');

            const children = await wrapped.invoke.getBoostChildren(TOPIC_BOOST_URI, {});
            expect(children.records).toHaveLength(1);
            expect((children.records[0] as { name?: string })?.name).toBe('Session');
            expect(fns.getBoost).not.toHaveBeenCalled();
            expect(fns.getBoostChildren).not.toHaveBeenCalled();

            await wrapped.invoke.getBoost('lc:network:real-boost');
            expect(fns.getBoost).toHaveBeenCalled();
        });

        it('serves index reads from the demo store without hitting the wallet', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            const all = await wrapped.index.LearnCloud.get();
            expect(all).toHaveLength(2);

            const achievements = await wrapped.index.LearnCloud.get({
                category: 'Achievement',
            } as never);
            expect(achievements).toHaveLength(1);
            expect(achievements[0]?.uri).toBe(DEMO_URI_A);

            const byUri = await wrapped.index.LearnCloud.get({ uri: DEMO_URI_B } as never);
            expect(byUri).toHaveLength(1);

            const noMatch = await wrapped.index.LearnCloud.get({ uri: 'lc:cloud:real' } as never);
            expect(noMatch).toHaveLength(0);

            expect(fns.indexGet).not.toHaveBeenCalled();
        });

        it('serves getPage and getCount from the demo store', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            const page = await wrapped.index.LearnCloud.getPage?.();
            expect(page?.records).toHaveLength(2);
            expect(page?.hasMore).toBe(false);

            const count = await wrapped.index.LearnCloud.getCount?.({
                category: 'Learning History',
            } as never);
            expect(count).toBe(1);

            expect(fns.indexGetPage).not.toHaveBeenCalled();
            expect(fns.indexGetCount).not.toHaveBeenCalled();
        });

        it('resolves lc:demo: uris from the store and passes real uris through', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            const demoVC = await wrapped.read.get(DEMO_URI_A);
            expect((demoVC as { name?: string })?.name).toBe('Badge');
            expect(fns.readGet).not.toHaveBeenCalled();

            await wrapped.read.get('lc:cloud:real');
            expect(fns.readGet).toHaveBeenCalled();
        });

        it('rejects index and store writes with DemoModeError', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            await expect(wrapped.index.LearnCloud.add({ id: 'x', uri: 'x' })).rejects.toThrow(
                DemoModeError
            );
            await expect(wrapped.index.LearnCloud.remove('x')).rejects.toThrow(DemoModeError);
            await expect(wrapped.store.LearnCloud.upload({} as never)).rejects.toThrow(
                DemoModeError
            );
            await expect(wrapped.store.LearnCloud.uploadEncrypted?.({} as never)).rejects.toThrow(
                DemoModeError
            );

            expect(fns.indexAdd).not.toHaveBeenCalled();
            expect(fns.storeUpload).not.toHaveBeenCalled();
            expect(fns.storeUploadEncrypted).not.toHaveBeenCalled();
        });

        it('rejects blocked invoke mutations but allows read-only invoke methods', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            const rejection = wrapped.invoke.issueCredential({} as never);
            await expect(rejection).rejects.toSatisfy(isDemoModeError);
            expect(fns.issueCredential).not.toHaveBeenCalled();

            await expect(wrapped.invoke.countBoosts()).resolves.toBe(7);
        });

        it('returns to passthrough behavior after exitDemo', async () => {
            const { wallet, fns } = makeFakeWallet();
            const wrapped = wrapWalletForDemo(wallet);

            demoSessionStore.set.exitDemo();

            const records = await wrapped.index.LearnCloud.get();
            expect(records[0]?.uri).toBe('lc:cloud:real');
            await expect(wrapped.index.LearnCloud.add({ id: 'x', uri: 'x' })).resolves.toBe(true);
            expect(fns.indexGet).toHaveBeenCalled();
            expect(fns.indexAdd).toHaveBeenCalled();
        });
    });
});
