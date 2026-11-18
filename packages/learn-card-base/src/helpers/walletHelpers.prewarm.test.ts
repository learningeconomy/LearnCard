import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getLCAPlugin: vi.fn(async () => ({})),
    getLerRsPlugin: vi.fn(() => ({})),
    getLinkedClaimsPlugin: vi.fn(async () => ({})),
    getRenderMethodPlugin: vi.fn(() => ({})),
    initLearnCard: vi.fn(),
    networkUrl: vi.fn(() => 'https://network.example.com'),
    initDidKit: vi.fn(),
    warn: vi.fn(),
}));

vi.mock('@learncard/didkit-plugin', () => ({
    initDidKit: mocks.initDidKit,
    installWalletDidWebDocumentFetchCache: vi.fn(),
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
    getLogger: () => ({ debug: vi.fn(), warn: mocks.warn }),
}));

import { prewarmDidKit } from './walletHelpers';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('prewarmDidKit', () => {
    beforeEach(() => vi.clearAllMocks());

    it('starts the bundled DIDKit init without waiting for it', async () => {
        mocks.initDidKit.mockReturnValue(new Promise(() => undefined));

        expect(prewarmDidKit()).toBeUndefined();
        expect(mocks.initDidKit).toHaveBeenCalledWith('didkit.wasm');
    });

    it('swallows a rejected init so app entry keeps going', async () => {
        mocks.initDidKit.mockRejectedValueOnce(new Error('wasm fetch failed'));

        expect(() => prewarmDidKit()).not.toThrow();
        await flush();

        expect(mocks.warn).toHaveBeenCalledWith(
            'DIDKit prewarm failed; wallet build retries',
            expect.objectContaining({ message: 'wasm fetch failed' })
        );
    });

    it('swallows a synchronous init throw', () => {
        mocks.initDidKit.mockImplementationOnce(() => {
            throw new Error('no WebAssembly');
        });

        expect(() => prewarmDidKit()).not.toThrow();
        expect(mocks.warn).toHaveBeenCalled();
    });
});
