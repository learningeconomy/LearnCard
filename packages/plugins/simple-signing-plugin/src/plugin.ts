import { getClient } from '@learncard/simple-signing-client';
import { LearnCard } from '@learncard/core';

import { SimpleSigningPluginDependentMethods, SimpleSigningPlugin } from './types';
export * from './types';

const getNewClient = async (
    url: string,
    learnCard: LearnCard<any, 'id', SimpleSigningPluginDependentMethods>
) => {
    return getClient(url, async challenge => {
        const jwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

        if (typeof jwt !== 'string') throw new Error('Error getting DID-Auth-JWT!');

        return jwt;
    });
};

export const getSimpleSigningPlugin = async (
    initialLearnCard: LearnCard<any, 'id', SimpleSigningPluginDependentMethods>,
    url: string
): Promise<SimpleSigningPlugin> => {
    let learnCard = initialLearnCard;
    let oldDid = learnCard.id.did();

    let client = await getNewClient(url, learnCard);

    const updateLearnCard = async (
        _learnCard: LearnCard<any, 'id', SimpleSigningPluginDependentMethods>
    ) => {
        const newDid = _learnCard.id.did();

        if (oldDid !== newDid) {
            client = await getNewClient(url, _learnCard);
            oldDid = newDid;
        }

        learnCard = _learnCard;
    };

    const initialized = learnCard.invoke.getProfile().then(async profile => {
        if (profile) await updateLearnCard(learnCard);
    });

    return {
        name: 'Simple Signing Authority',
        displayName: 'Simple Signing Authority Plugin',
        description: 'Lets you create and use Signing Authorities',
        methods: {
            createSigningAuthority: async (_learnCard, name) => {
                await initialized;
                await updateLearnCard(_learnCard);

                return client.signingAuthority.createSigningAuthority.mutate({
                    name,
                });
            },
            getSigningAuthorities: async _learnCard => {
                await initialized;
                await updateLearnCard(_learnCard);

                return client.signingAuthority.signingAuthorities.query();
            },
            authorizeSigningAuthority: async (_learnCard, name, authorization) => {
                await initialized;
                await updateLearnCard(_learnCard);

                return client.signingAuthority.authorizeSigningAuthority.mutate({
                    name,
                    authorization,
                });
            },
        },
    };
};
