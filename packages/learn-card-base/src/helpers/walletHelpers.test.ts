import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getLCAPlugin: vi.fn(async () => ({})),
    getLerRsPlugin: vi.fn(() => ({})),
    getLinkedClaimsPlugin: vi.fn(async () => ({})),
    getRenderMethodPlugin: vi.fn(() => ({})),
    initLearnCard: vi.fn(),
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
            networkUrl: () => 'https://network.example.com',
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

const createWallet = () => {
    const wallet = { addPlugin: vi.fn() };
    wallet.addPlugin.mockImplementation(async () => wallet);
    return wallet;
};

describe('wallet promise caches', () => {
    beforeEach(() => {
        clearLearnCardCache();
        vi.clearAllMocks();
    });

    it('shares one in-flight bespoke wallet build for the same cache key', async () => {
        const wallet = createWallet();
        const build = Promise.withResolvers<typeof wallet>();
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

    it('evicts a rejected bespoke wallet build so the next call retries', async () => {
        const failure = new Error('wallet build failed');
        const failedBuild = Promise.withResolvers<unknown>();
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
        const build = Promise.withResolvers<typeof wallet>();
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
        const failedBuild = Promise.withResolvers<unknown>();
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
