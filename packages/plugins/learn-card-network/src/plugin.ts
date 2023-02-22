import { getClient } from '@learncard/network-brain-client';
import {
    JWEValidator,
    LCNProfile,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
} from '@learncard/types';
import { LearnCard } from '@learncard/core';

import { LearnCardNetworkPluginDependentMethods, LearnCardNetworkPlugin } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardNetworkPlugin = async (
    learnCard: LearnCard<any, 'id', LearnCardNetworkPluginDependentMethods>,
    url: string
): Promise<LearnCardNetworkPlugin> => {
    const existingDid = learnCard.id.did();

    const client = await getClient(url, async challenge => {
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

                if (parts.length !== 5) return undefined;

                const [lc, method] = parts as [string, string, string, string, string];

                if (lc !== 'lc' || method !== 'network') return undefined;

                try {
                    let result = await client.storage.resolve.query({ uri: vcUri });

                    if ('ciphertext' in result) {
                        result = await _learnCard.invoke.getDIDObject().decryptDagJWE(result);
                    }

                    return await VCValidator.or(VPValidator).parseAsync(result);
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
            uploadEncrypted: async (
                _learnCard,
                credential,
                { recipients = [] } = { recipients: [] }
            ) => {
                _learnCard.debug?.("learnCard.store['LearnCard Network'].upload");

                const jwe = await _learnCard.invoke
                    .getDIDObject()
                    .createDagJWE(credential, [_learnCard.id.did(), ...recipients]);

                return client.storage.store.mutate({ item: jwe });
            },
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
            sendCredential: async (_learnCard, profileId, vc, encrypt = true) => {
                if (!userData) throw new Error('Please make an account first!');

                if (!encrypt) {
                    return client.credential.sendCredential.mutate({ profileId, credential: vc });
                }

                const target = await _learnCard.invoke.getProfile(profileId);

                if (!target) throw new Error('Could not find target account');

                const credential = await _learnCard.invoke
                    .getDIDObject()
                    .createDagJWE(vc, [userData.did, target.did]);

                return client.credential.sendCredential.mutate({ profileId, credential });
            },
            sendCredentialFromBoost: async (_learnCard, profileId, boostUri, encrypt = true) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.storage.resolve.query({ uri: boostUri });
                const data = await UnsignedVCValidator.spa(result);

                if (!data.success) throw new Error('Did not get a valid boost from URI');

                const targetProfile = await _learnCard.invoke.getProfile(profileId);

                if (!targetProfile) throw new Error('Target profile not found');

                const boost = data.data;

                boost.issuer = _learnCard.id.did();

                if (Array.isArray(boost.credentialSubject)) {
                    boost.credentialSubject[0].id = targetProfile.did;
                } else {
                    boost.credentialSubject.id = targetProfile.did;
                }

                const vc = await _learnCard.invoke.issueCredential(boost);

                if (!encrypt) {
                    return client.credential.sendCredential.mutate({ profileId, credential: vc });
                }

                const credential = await _learnCard.invoke
                    .getDIDObject()
                    .createDagJWE(vc, [userData.did, targetProfile.did]);

                return client.credential.sendCredential.mutate({ profileId, credential });
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
            deleteCredential: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.deleteCredential.mutate({ uri });
            },
            sendPresentation: async (_learnCard, profileId, vp, encrypt = true) => {
                if (!userData) throw new Error('Please make an account first!');

                if (!encrypt) {
                    return client.presentation.sendPresentation.mutate({
                        profileId,
                        presentation: vp,
                    });
                }

                const target = await _learnCard.invoke.getProfile(profileId);

                if (!target) throw new Error('Could not find target account');

                const presentation = await _learnCard.invoke
                    .getDIDObject()
                    .createDagJWE(vp, [userData.did, target.did]);

                return client.presentation.sendPresentation.mutate({ profileId, presentation });
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
            deletePresentation: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.deletePresentation.mutate({ uri });
            },
            getBoosts: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoosts.query();
            },
            updateBoost: async (_learnCard, uri, updates) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.updateBoost.mutate({ uri, updates });
            },
            deleteBoost: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.deleteBoost.mutate({ uri });
            },
            registerSigningAuthority: async (_learnCard, signingAuthority) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.registerSigningAuthority.mutate({ signingAuthority });
            },
            resolveFromLCN: async (_learnCard, uri) => {
                const result = await client.storage.resolve.query({ uri });

                return UnsignedVCValidator.or(VCValidator)
                    .or(VPValidator)
                    .or(JWEValidator)
                    .parseAsync(result);
            },
        },
    };
};
