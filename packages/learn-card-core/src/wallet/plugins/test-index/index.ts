import { CredentialRecord, VC } from '@learncard/types';
import { TestIndexPlugin } from './types';

export const getTestIndex = (): TestIndexPlugin => {
    let index: CredentialRecord[] = [];

    return {
        name: 'Test Index',
        displayName: 'Test Index',
        description: '[Testing] Tests Index Implementations',
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

                let recordIndex = index.findIndex(record => record.id === id);

                index.splice(recordIndex, 1);

                return true;
            },
        },
        methods: {},
    };
};
