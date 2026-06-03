import { describe, expect, it, vi } from 'vitest';

import type {
    ExportLearnCardBundleOptions,
    LearnCardBundleWallet,
    RestoreLearnCardFromBundleOptions,
} from '@learncard/holder-continuity';
import {
    createExportLearnCardBundleHelper,
    createRestoreLearnCardFromBundleHelper,
} from './replHelpers';

const createWallet = (did: string): LearnCardBundleWallet => ({
    id: { did: () => did },
    invoke: {},
    index: { LearnCloud: { get: async () => [], add: async () => true } },
    read: { get: async () => undefined },
    store: { LearnCloud: {} },
});

describe('createExportLearnCardBundleHelper', () => {
    it('uses the default wallet when only options are provided', async () => {
        const defaultWallet = createWallet('did:key:default');
        const exportBundle = vi.fn(async () => ({
            data: Buffer.from(''),
            manifest: {} as never,
            warnings: [],
        }));
        const helper = createExportLearnCardBundleHelper(exportBundle, defaultWallet);
        const options: ExportLearnCardBundleOptions = { out: './bundle.zip', password: 'secret' };

        await helper(options);

        expect(exportBundle).toHaveBeenCalledWith(defaultWallet, options);
    });

    it('uses the provided wallet when wallet and options are both provided', async () => {
        const defaultWallet = createWallet('did:key:default');
        const otherWallet = createWallet('did:key:other');
        const exportBundle = vi.fn(async () => ({
            data: Buffer.from(''),
            manifest: {} as never,
            warnings: [],
        }));
        const helper = createExportLearnCardBundleHelper(exportBundle, defaultWallet);
        const options: ExportLearnCardBundleOptions = { out: './bundle.zip', password: 'secret' };

        await helper(otherWallet, options);

        expect(exportBundle).toHaveBeenCalledWith(otherWallet, options);
    });
});

describe('createRestoreLearnCardFromBundleHelper', () => {
    it('merges default init config with per-call overrides', async () => {
        const restoreBundle = vi.fn(async () => ({ restored: true }));
        const helper = createRestoreLearnCardFromBundleHelper(restoreBundle, {
            network: true,
            allowRemoteContexts: true,
            didkit: 'node',
        });
        const options: Omit<RestoreLearnCardFromBundleOptions, 'init'> & {
            init?: Partial<RestoreLearnCardFromBundleOptions['init']>;
        } = {
            password: 'secret',
            init: { network: 'http://localhost:4000/trpc' },
        };

        await helper('./bundle.zip', options);

        expect(restoreBundle).toHaveBeenCalledWith('./bundle.zip', {
            password: 'secret',
            init: {
                network: 'http://localhost:4000/trpc',
                allowRemoteContexts: true,
                didkit: 'node',
            },
        });
    });
});
