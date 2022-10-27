import { CredentialRecord, VC } from '@learncard/types';
import { TestCachePlugin } from './types';

export const getTestCache = (): TestCachePlugin => {
    let index: CredentialRecord[] | undefined = undefined;
    let vcs: Record<string, VC | undefined> = {};

    return {
        name: 'Test Cache',
        displayName: 'Test Cache',
        description: '[Testing] Tests Caching Implementation',
        cache: {
            getIndex: async (_learnCard, query) => {
                _learnCard.debug?.('Test Cache, getIndex', { query, value: index });
                return index;
            },
            setIndex: async (_learnCard, query, value) => {
                _learnCard.debug?.('Test Cache, setIndex', { query, value });
                index = value;
                return true;
            },
            flushIndex: async _learnCard => {
                _learnCard.debug?.('Test Cache, flushIndex');
                index = undefined;
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
