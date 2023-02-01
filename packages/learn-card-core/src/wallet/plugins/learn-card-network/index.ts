import { getClient } from '@learncard/network-brain-client';
import { LCNProfile } from '@learncard/types';

import { LearnCard } from 'types/wallet';
import { LearnCardNetworkPluginDependentMethods, LearnCardNetworkPlugin } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardNetworkPlugin = async (
    learnCard: LearnCard<any, 'id', LearnCardNetworkPluginDependentMethods>,
    uri: string
): Promise<LearnCardNetworkPlugin> => {
    const existingDid = learnCard.id.did();

    const client = await getClient(uri, async challenge => {
        const jwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

        if (typeof jwt !== 'string') throw new Error('Error getting DID-Auth-JWT!');

        return jwt;
    });

    let userData: LCNProfile | undefined;

    try {
        userData = await client.getProfile.query();
    } catch (error) {
        learnCard.debug?.('No profile!', error);
    }

    let did = userData?.did || existingDid;

    return {
        name: 'LearnCard Network',
        displayName: 'LearnCard Network',
        description: 'LearnCard Network Integration',
        id: {
            did: (_learnCard, method) => {
                if (!method || method === 'web') return did;

                return learnCard.id.did(method);
            },
            keypair: (_learnCard, algorithm) => learnCard.id.keypair(algorithm),
        },
        methods: {
            createProfile: async (_learnCard, profile) => {
                if (userData) throw new Error('Account already exists!');

                const newDid = await client.createProfile.mutate(profile);

                userData = await client.getProfile.query();
                did = newDid;

                return newDid;
            },
            updateProfile: async (_learnCard, profile) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.updateProfile.mutate(profile);

                if (result) {
                    userData = await client.getProfile.query();

                    return true;
                }

                return false;
            },
            deleteProfile: async () => {
                if (!userData) throw new Error('Account does not exist!');

                const result = await client.deleteProfile.mutate();

                if (result) {
                    userData = undefined;

                    return true;
                }

                return false;
            },
            getProfile: async (_learnCard, id) => {
                if (!id) return client.getProfile.query();

                return client.getOtherProfile.query({ handle: id });
            },
            connectWith: async (_learnCard, handle) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.connectWith.mutate({ handle });
            },
            acceptConnectionRequest: async (_learnCard, handle) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.acceptConnectionRequest.mutate({ handle });
            },
            getConnections: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.connections.query();
            },
            getPendingConnections: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.pendingConnections.query();
            },
            getConnectionRequests: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.connectionRequests.query();
            },
            sendCredential: async (_learnCard, id, vc) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.sendCredential.mutate({ handle: id, vc });
            },
            acceptCredential: async (_learnCard, id, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.acceptCredential.mutate({ handle: id, uri });
            },
            registerSigningAuthority: async (_learnCard, signingAuthority) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.registerSigningAuthority.mutate({ signingAuthority });
            },
        },
    };
};
