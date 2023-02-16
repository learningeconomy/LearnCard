import { getClient } from '@learncard/network-brain-client';
import { LCNProfile, VCValidator, VPValidator } from '@learncard/types';
import { LearnCard } from '@learncard/core';

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
        userData = await client.profile.getProfile.query();
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
        read: {
            get: async (_learnCard, vcUri) => {
                _learnCard.debug?.("learnCard.read['LearnCard Network'].get");

                if (!vcUri) return undefined;

                const parts = vcUri.split(':');

                if (parts.length !== 4) return undefined;

                const [lc, method] = parts as [string, string, string, string];

                if (lc !== 'lc' || method !== 'network') return undefined;

                try {
                    const vc = await client.storage.resolve.query({ uri: vcUri });

                    return await VCValidator.or(VPValidator).parseAsync(vc);
                } catch (error) {
                    _learnCard.debug?.(error);
                    return undefined;
                }
            },
        },
        store: {
            upload: async (_learnCard, credential) => {
                _learnCard.debug?.("learnCard.store['LearnCard Network'].upload");

                return client.storage.store.mutate({ item: credential });
            },
            /* uploadEncrypted: async (_learnCard, credential, params) => {
                _learnCard.debug?.("learnCard.store['LearnCard Network'].upload");

                return client.storeCredential.mutate({ credential });
            }, */
        },
        methods: {
            createProfile: async (_learnCard, profile) => {
                if (userData) throw new Error('Account already exists!');

                const newDid = await client.profile.createProfile.mutate(profile);

                userData = await client.profile.getProfile.query();
                did = newDid;

                return newDid;
            },
            createServiceProfile: async (_learnCard, profile) => {
                if (userData) throw new Error('Account already exists!');

                const newDid = await client.profile.createServiceProfile.mutate(profile);

                userData = await client.profile.getProfile.query();
                did = newDid;

                return newDid;
            },
            updateProfile: async (_learnCard, profile) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.profile.updateProfile.mutate(profile);

                if (result) {
                    userData = await client.profile.getProfile.query();

                    return true;
                }

                return false;
            },
            deleteProfile: async () => {
                if (!userData) throw new Error('Account does not exist!');

                const result = await client.profile.deleteProfile.mutate();

                if (result) {
                    userData = undefined;

                    return true;
                }

                return false;
            },
            getProfile: async (_learnCard, profileId) => {
                if (!profileId) return client.profile.getProfile.query();

                return client.profile.getOtherProfile.query({ profileId });
            },
            searchProfiles: async (
                _learnCard,
                input = '',
                { limit = 25, includeSelf = false } = {}
            ) => {
                return client.profile.searchProfiles.query({ input, limit, includeSelf });
            },
            connectWith: async (_learnCard, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.connectWith.mutate({ profileId });
            },
            cancelConnectionRequest: async (_learnCard, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.cancelConnectionRequest.mutate({ profileId });
            },
            connectWithInvite: async (_learnCard, profileId, challenge) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.connectWithInvite.mutate({ profileId, challenge });
            },
            disconnectWith: async (_learnCard, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.disconnectWith.mutate({ profileId });
            },
            acceptConnectionRequest: async (_learnCard, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.acceptConnectionRequest.mutate({ profileId });
            },
            getConnections: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.connections.query();
            },
            getPendingConnections: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.pendingConnections.query();
            },
            getConnectionRequests: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.connectionRequests.query();
            },
            generateInvite: async (_learnCard, challenge) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.generateInvite.mutate({ challenge });
            },
            sendCredential: async (_learnCard, profileId, vc) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.sendCredential.mutate({ profileId, credential: vc });
            },
            acceptCredential: async (_learnCard, profileId, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.acceptCredential.mutate({ profileId, uri });
            },
            getReceivedCredentials: async (_learnCard, from) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.receivedCredentials.query({ from });
            },
            getSentCredentials: async (_learnCard, to) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.sentCredentials.query({ to });
            },
            getIncomingCredentials: async (_learnCard, from) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.incomingCredentials.query({ from });
            },
            sendPresentation: async (_learnCard, profileId, vp) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.sendPresentation.mutate({ profileId, presentation: vp });
            },
            acceptPresentation: async (_learnCard, profileId, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.acceptPresentation.mutate({ profileId, uri });
            },
            getReceivedPresentations: async (_learnCard, from) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.receivedPresentations.query({ from });
            },
            getSentPresentations: async (_learnCard, to) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.sentPresentations.query({ to });
            },
            getIncomingPresentations: async (_learnCard, from) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.incomingPresentations.query({ from });
            },
            registerSigningAuthority: async (_learnCard, signingAuthority) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.registerSigningAuthority.mutate({ signingAuthority });
            },
        },
    };
};
