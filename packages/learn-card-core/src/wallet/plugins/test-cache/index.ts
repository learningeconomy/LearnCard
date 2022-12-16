import { CredentialRecord, VC, VP } from '@learncard/types';
import { TestCachePlugin } from './types';

export const getTestCache = (): TestCachePlugin => {
    let index: Record<string, CredentialRecord[]> = {};
    let vcs: Record<string, VC | VP | undefined> = {};

    return {
        name: 'Test Cache',
        displayName: 'Test Cache',
        description: '[Testing] Tests Caching Implementation',
        cache: {
            getIndex: async (_learnCard, name, query) => {
                _learnCard.debug?.('Test Cache, getIndex', { name, query, value: index });
                return index[name];
            },
            setIndex: async (_learnCard, name, query, value) => {
                _learnCard.debug?.('Test Cache, setIndex', { name, query, value });
                index[name] = value as any;
                return true;
            },
            flushIndex: async _learnCard => {
                _learnCard.debug?.('Test Cache, flushIndex');
                index = {};
                return true;
            },
            getVc: async (_learnCard, uri) => {
                _learnCard.debug?.('Test Cache, getVc', { uri, value: vcs[uri] });
                return vcs[uri];
            },
            setVc: async (_learnCard, uri, vc) => {
                _learnCard.debug?.('Test Cache, setVc', { uri, value: vc });
                vcs[uri] = vc;
                return true;
            },
            flushVc: async _learnCard => {
                _learnCard.debug?.('Test Cache, flushVc');
                vcs = {};
                return true;
            },
        },
        methods: {},
    };
};
