import { IDXCredential, VC } from '@learncard/types';
import { TestCachePlugin } from './types';

export const getTestCache = (): TestCachePlugin => {
    let index: IDXCredential[] | undefined = undefined;
    let vcs: Record<string, VC | undefined> = {};

    return {
        name: 'Test Cache',
        displayName: 'Test Cache',
        description: '[Testing] Tests Caching Implementation',
        cache: {
            getIndex: async (_wallet, query) => {
                _wallet.debug?.('Test Cache, getIndex', { query, value: index });
                return index;
            },
            setIndex: async (_wallet, query, value) => {
                _wallet.debug?.('Test Cache, setIndex', { query, value });
                index = value;
                return true;
            },
            flushIndex: async _wallet => {
                _wallet.debug?.('Test Cache, flushIndex');
                index = undefined;
                return true;
            },
            getVc: async (_wallet, uri) => {
                _wallet.debug?.('Test Cache, getVc', { uri, value: vcs[uri] });
                return vcs[uri];
            },
            setVc: async (_wallet, uri, vc) => {
                _wallet.debug?.('Test Cache, setVc', { uri, value: vc });
                vcs[uri] = vc;
                return true;
            },
            flushVc: async _wallet => {
                _wallet.debug?.('Test Cache, flushVc');
                vcs = {};
                return true;
            },
        },
        methods: {},
    };
};
