import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeferred } from './deferred';

const mocks = vi.hoisted(() => ({
    getLCAPlugin: vi.fn(async () => ({})),
    getLerRsPlugin: vi.fn(() => ({})),
    getLinkedClaimsPlugin: vi.fn(async () => ({})),
    getRenderMethodPlugin: vi.fn(() => ({})),
    initLearnCard: vi.fn(),
    networkUrl: vi.fn(() => 'https://network.example.com'),
}));

vi.mock('@learncard/init', () => ({ initLearnCard: mocks.initLearnCard }));
vi.mock('@learncard/lca-api-plugin', () => ({ getLCAPlugin: mocks.getLCAPlugin }));
vi.mock('@learncard/linked-claims-plugin', () => ({
    getLinkedClaimsPlugin: mocks.getLinkedClaimsPlugin,
}));
vi.mock('@learncard/ler-rs-plugin', () => ({ getLerRsPlugin: mocks.getLerRsPlugin }));
vi.mock('@learncard/render-method-plugin', () => ({
    getRenderMethodPlugin: mocks.getRenderMethodPlugin,
}));
vi.mock('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url', () => ({
    default: 'didkit.wasm',
}));
vi.mock('learn-card-base/plugins/sqlite', () => ({ getSQLitePlugin: vi.fn() }));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { get: { switchedDid: vi.fn() }, set: { switchedDid: vi.fn() } },
    walletStore: { set: { wallet: vi.fn() } },
}));
vi.mock('learn-card-base/helpers/platformHelpers', () => ({ isPlatformWeb: () => true }));
vi.mock('learn-card-base/helpers/privateKeyHelpers', () => ({
    requireCurrentUserPrivateKey: vi.fn(),
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: {
        get: {
            apiEndpoint: () => 'https://api.example.com',
            cloudUrl: () => 'https://cloud.example.com',
            networkUrl: mocks.networkUrl,
            tenantId: () => undefined,
        },
    },
}));
vi.mock('learn-card-base/stores/guardianApprovalStore', () => ({
    getGuardianApprovalVP: vi.fn(),
}));
vi.mock('./networkHelpers', () => ({
    PRODUCTION_NETWORK_URL: 'https://network.learncard.com/trpc',
}));
vi.mock('../logging/logger', () => ({
    getLogger: () => ({ debug: vi.fn() }),
}));

import { clearLearnCardCache, getBespokeLearnCard, getSigningLearnCard } from './walletHelpers';
import { configureLocalDevelopmentNetwork } from '../config/localDevelopmentNetwork';

const createWallet = () => {
    const wallet = { addPlugin: vi.fn() };
    wallet.addPlugin.mockImplementation(async () => wallet);
    return wallet;
};

describe('wallet promise caches', () => {
    beforeEach(() => {
        clearLearnCardCache();
        vi.clearAllMocks();
        mocks.networkUrl.mockReturnValue('https://network.example.com');
        configureLocalDevelopmentNetwork(false, false, '', '');
    });

    it('shares one in-flight bespoke wallet build for the same cache key', async () => {
        const wallet = createWallet();
        const build = createDeferred<typeof wallet>();
        mocks.initLearnCard.mockReturnValue(build.promise);

        const first = getBespokeLearnCard('seed');
        const second = getBespokeLearnCard('seed');

        expect(mocks.initLearnCard).toHaveBeenCalledTimes(1);

        build.resolve(wallet);
        const [firstWallet, secondWallet] = await Promise.all([first, second]);

        expect(firstWallet).toBe(wallet);
        expect(secondWallet).toBe(wallet);
        expect(mocks.getLCAPlugin).toHaveBeenCalledTimes(1);
    });

    it('passes local trust to network wallets and rebuilds without it after opting out', async () => {
        const network = 'http://localhost:4000/trpc';
        mocks.networkUrl.mockReturnValue(network);
        mocks.initLearnCard.mockImplementation(async () => createWallet());
        configureLocalDevelopmentNetwork(true, true, 'http://localhost:3000', network);

        const localWallet = await getBespokeLearnCard('seed');
        const options = mocks.initLearnCard.mock.calls[0]![0];
        expect(options.network).toBe(network);
        expect(JSON.parse(decodeURIComponent(options.trustedBoostRegistry.split(',')[1]))).toEqual([
            {
                id: 'Local LearnCard Network',
                url: 'http://localhost:4000',
                did: 'did:web:localhost%3A4000',
            },
        ]);

        configureLocalDevelopmentNetwork(true, false, 'http://localhost:3000', network);
        const normalWallet = await getBespokeLearnCard('seed');
        expect(normalWallet).not.toBe(localWallet);
        expect(mocks.initLearnCard.mock.calls[1]![0].trustedBoostRegistry).toBeUndefined();
    });

    it('keeps signing and offline wallets independent of local network trust', async () => {
        const network = 'http://localhost:4000/trpc';
        mocks.networkUrl.mockReturnValue(network);
        mocks.initLearnCard.mockImplementation(async () => createWallet());
        configureLocalDevelopmentNetwork(true, true, 'http://localhost:3000', network);
        await getSigningLearnCard('seed');
        await getBespokeLearnCard('seed', undefined, { offline: true });

        for (const [options] of mocks.initLearnCard.mock.calls) {
            expect(options).not.toHaveProperty('trustedBoostRegistry');
            expect(options).not.toHaveProperty('network');
        }
    });

    it('evicts a rejected bespoke wallet build so the next call retries', async () => {
        const failure = new Error('wallet build failed');
        const failedBuild = createDeferred<unknown>();
        mocks.initLearnCard.mockReturnValueOnce(failedBuild.promise);

        const first = getBespokeLearnCard('seed');
        failedBuild.reject(failure);

        await expect(first).rejects.toBe(failure);

        const wallet = createWallet();
        mocks.initLearnCard.mockResolvedValueOnce(wallet);

        await expect(getBespokeLearnCard('seed')).resolves.toBe(wallet);
        expect(mocks.initLearnCard).toHaveBeenCalledTimes(2);
    });

    it('shares one in-flight signing wallet build for the same seed', async () => {
        const wallet = createWallet();
        const build = createDeferred<typeof wallet>();
        mocks.initLearnCard.mockReturnValue(build.promise);

        const first = getSigningLearnCard('seed');
        const second = getSigningLearnCard('seed');

        expect(mocks.initLearnCard).toHaveBeenCalledTimes(1);

        build.resolve(wallet);
        const [firstWallet, secondWallet] = await Promise.all([first, second]);

        expect(firstWallet).toBe(wallet);
        expect(secondWallet).toBe(wallet);
    });

    it('evicts a rejected signing wallet build so the next call retries', async () => {
        const failure = new Error('signing wallet build failed');
        const failedBuild = createDeferred<unknown>();
        mocks.initLearnCard.mockReturnValueOnce(failedBuild.promise);

        const first = getSigningLearnCard('seed');
        failedBuild.reject(failure);

        await expect(first).rejects.toBe(failure);

        const wallet = createWallet();
        mocks.initLearnCard.mockResolvedValueOnce(wallet);

        await expect(getSigningLearnCard('seed')).resolves.toBe(wallet);
        expect(mocks.initLearnCard).toHaveBeenCalledTimes(2);
    });
});
