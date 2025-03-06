import { LearnCard } from '@learncard/core';

import { DidWebPluginDependentMethods, DidWebPlugin } from './types';
export * from './types';

/**
 * @group Plugins
 */
export const getDidWebPlugin = async (
    learnCard: LearnCard<any, 'id', DidWebPluginDependentMethods>,
    didWeb: string
): Promise<DidWebPlugin> => {
    learnCard?.debug?.('Adding DID Web Plugin');
    if (!didWeb.includes('did:web:')) {
        throw new Error('Must provide a valid did:web DID into constructor.');
    }

    return {
        name: 'DID Web',
        displayName: 'DID Web',
        description:
            'The LearnCard DID Web Plugin is a plugin for adding did-web support to a LearnCard agent for signing VCs.',
        id: {
            did: (_learnCard, method) => {
                if (!method || method === 'web') return didWeb;

                return learnCard.id.did(method);
            },
            keypair: (_learnCard, algorithm) => learnCard.id.keypair(algorithm),
        },
        methods: {},
    };
};
