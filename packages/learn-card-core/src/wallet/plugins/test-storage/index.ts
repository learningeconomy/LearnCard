import { CredentialRecord, VC, VP } from '@learncard/types';
import { TestStoragePlugin } from './types';

export const getTestStorage = (): TestStoragePlugin => {
    const index: CredentialRecord[] = [];
    const vcs: (VC | VP)[] = [];

    return {
        name: 'Test Storage',
        displayName: 'Test Storage',
        description: '[Testing] Tests Storage Implementations',
        read: {
            get: async (_learnCard, uri) => {
                _learnCard.debug?.('Test Storage, read, get', { uri });

                if (!uri) return undefined;

                const [_lc, method, vcIndex] = uri.split(':');

                if (method !== 'test') return undefined;

                return vcs[Number.parseInt(vcIndex)];
            },
        },
        store: {
            upload: async (_learnCard, vc) => {
                _learnCard.debug?.('Test Storage, store, upload', { vc });

                const vcIndex = vcs.length;

                vcs.push(vc);

                return `lc:test:${vcIndex}`;
            },
            delete: async (_learnCard, uri) => {
                _learnCard.debug?.('Test Storage, store, delete', { uri });

                if (!uri) return false;

                const [_lc, method, vcIndex] = uri.split(':');

                if (method !== 'test') return false;

                const vcIdx = Number.parseInt(vcIndex);

                if (vcIdx >= 0 && vcIdx < vcs.length) {
                    vcs[vcIdx] = undefined as unknown as VC | VP;
                    return true;
                }

                return false;
            },
        },
        index: {
            get: async (_learnCard, query) => {
                _learnCard.debug?.('Test Storage, index, get', { query });

                return index;
            },
            add: async (_learnCard, record) => {
                _learnCard.debug?.('Test Storage, index, add', { record });

                index.push(record);

                return true;
            },
            update: async () => false, // TODO: Implement
            remove: async (_learnCard, id) => {
                _learnCard.debug?.('Test Storage, index, remove', { id });

                const recordIndex = index.findIndex(record => record.id === id);

                index.splice(recordIndex, 1);

                return true;
            },
        },
        methods: {},
    };
};
