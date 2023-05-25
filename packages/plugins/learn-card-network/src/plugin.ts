import { getClient } from '@learncard/network-brain-client';
import {
    JWEValidator,
    LCNProfile,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    Profile,
} from '@learncard/types';
import { LearnCard } from '@learncard/core';
import { VerifyExtension } from '@learncard/vc-plugin';

import {
    LearnCardNetworkPluginDependentMethods,
    LearnCardNetworkPlugin,
    VerifyBoostPlugin,
    TrustedBoostRegistryEntry,
} from './types';
export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardNetworkPlugin = async (
    learnCard: LearnCard<any, 'id', LearnCardNetworkPluginDependentMethods>,
    url: string
): Promise<LearnCardNetworkPlugin> => {
    const existingDid = learnCard.id.did();

    learnCard?.debug?.('Adding LearnCardNetwork Plugin');
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
                { limit = 25, includeSelf = false, includeConnectionStatus = false, includeServiceProfiles = false } = {}
            ) => {
                return client.profile.searchProfiles.query({
                    input,
                    limit,
                    includeSelf,
                    includeConnectionStatus,
                    includeServiceProfiles,
                });
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

            blockProfile: async (_learnCard, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.blockProfile.mutate({ profileId });
            },
            unblockProfile: async (_learnCard, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.unblockProfile.mutate({ profileId });
            },
            getBlockedProfiles: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.blocked.query();
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
            acceptCredential: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.acceptCredential.mutate({ uri });
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
            acceptPresentation: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.presentation.acceptPresentation.mutate({ uri });
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

            createBoost: async (_learnCard, credential, metadata) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.createBoost.mutate({ credential, ...metadata });
            },
            getBoost: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoost.query({ uri });
            },
            getBoosts: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoosts.query();
            },
            getBoostRecipients: async (
                _learnCard,
                uri,
                limit = 25,
                skip = undefined,
                includeUnacceptedBoosts = true
            ) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostRecipients.query({
                    uri,
                    limit,
                    skip,
                    includeUnacceptedBoosts,
                });
            },
            updateBoost: async (_learnCard, uri, updates, credential) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.updateBoost.mutate({
                    uri,
                    updates: { credential, ...updates },
                });
            },
            deleteBoost: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.deleteBoost.mutate({ uri });
            },
            sendBoost: async (_learnCard, profileId, boostUri, encrypt = true) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await _learnCard.invoke.resolveFromLCN(boostUri);
                const data = await UnsignedVCValidator.spa(result);

                if (!data.success) throw new Error('Did not get a valid boost from URI');

                const targetProfile = await _learnCard.invoke.getProfile(profileId);

                if (!targetProfile) throw new Error('Target profile not found');

                const boost = data.data;

                boost.issuanceDate = new Date().toISOString();
                boost.issuer = _learnCard.id.did();

                if (Array.isArray(boost.credentialSubject)) {
                    boost.credentialSubject = boost.credentialSubject.map(subject => ({
                        ...subject,
                        id: targetProfile.did,
                    }));
                } else {
                    boost.credentialSubject.id = targetProfile.did;
                }

                // Embed the boostURI into the boost credential for verification purposes.
                if (boost?.type?.includes('BoostCredential')) {
                    boost.boostId = boostUri;
                }

                const vc = await _learnCard.invoke.issueCredential(boost);

                if (!encrypt) {
                    return client.boost.sendBoost.mutate({
                        profileId,
                        uri: boostUri,
                        credential: vc,
                    });
                }

                const lcnDid = await client.utilities.getDid.query();

                const credential = await _learnCard.invoke
                    .getDIDObject()
                    .createDagJWE(vc, [userData.did, targetProfile.did, lcnDid]);

                return client.boost.sendBoost.mutate({ profileId, uri: boostUri, credential });
            },

            registerSigningAuthority: async (_learnCard, endpoint, name, _did) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.registerSigningAuthority.mutate({
                    endpoint,
                    name,
                    did: _did,
                });
            },
            getRegisteredSigningAuthorities: async (_learnCard, _endpoint, _name, _did) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.signingAuthorities.query();
            },
            getRegisteredSigningAuthority: async (_learnCard, endpoint, name) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.signingAuthority.query({ endpoint, name });
            },

            generateClaimLink: async (_learnCard, boostUri, claimLinkSA, options, challenge) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.generateClaimLink.mutate({
                    boostUri,
                    claimLinkSA,
                    options,
                    challenge,
                });
            },
            claimBoostWithLink: async (_learnCard, boostUri, challenge) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.claimBoostWithLink.mutate({ boostUri, challenge });
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

/**
 * @group Plugins
 */
export const getVerifyBoostPlugin = async (
    learnCard: LearnCard<any, any, VerifyExtension>,
    trustedBoostRegistryUrl?: string
): Promise<VerifyBoostPlugin> => {
    const DEFAULT_TRUSTED_BOOST_REGISTRY: TrustedBoostRegistryEntry[] = [
        {
            id: 'LearnCard Network',
            url: 'https://network.learncard.com',
            did: 'did:web:network.learncard.com',
        },
    ];

    let boostRegistry: TrustedBoostRegistryEntry[];

    if (trustedBoostRegistryUrl) {
        const res = await fetch(trustedBoostRegistryUrl);
        if (res.status === 200) {
            boostRegistry = JSON.parse(await res.text());
        } else {
            boostRegistry = DEFAULT_TRUSTED_BOOST_REGISTRY;
        }
    } else {
        boostRegistry = DEFAULT_TRUSTED_BOOST_REGISTRY;
    }

    const getIssuerDID = (issuer: string | Profile | undefined): string | undefined => {
        if (!issuer) return;
        if (typeof issuer === 'string') {
            return issuer;
        } else if ('id' in issuer && typeof issuer.id === 'string') {
            return issuer.id;
        } else {
            return;
        }
    };
    const getTrustedBoostVerifier = (
        issuer: string | Profile | undefined
    ): TrustedBoostRegistryEntry | undefined => {
        const issuerDID = getIssuerDID(issuer);
        if (!issuerDID) return;
        return boostRegistry.find(o => o.did === issuerDID);
    };

    return {
        name: 'VerifyBoost',
        displayName: 'Verify Boost Extension',
        description: 'Adds a check for validating Boost Credentials.',
        methods: {
            verifyCredential: async (_learnCard, credential) => {
                const verificationCheck = await learnCard.invoke.verifyCredential(credential);
                const boostCredential = credential?.boostCredential;
                try {
                    if (boostCredential) {
                        const verifyBoostCredential = await learnCard.invoke.verifyCredential(
                            boostCredential
                        );
                        if (!boostCredential?.boostId && !credential?.boostId) {
                            verificationCheck.warnings.push(
                                'Boost Authenticity could not be verified: Boost ID metadata is missing.'
                            );
                        }

                        if (verifyBoostCredential.errors?.length > 0) {
                            verificationCheck.errors = [
                                ...(verifyBoostCredential.errors || []),
                                ...(verificationCheck.errors || []),
                                'Boost Credential could not be verified.',
                            ];
                        } else if (boostCredential?.boostId !== credential?.boostId) {
                            verificationCheck.errors.push(
                                'Boost Authenticity could not be verified: Boost ID metadata is mismatched.'
                            );
                        } else {
                            const trustedBoostIssuer = getTrustedBoostVerifier(credential?.issuer);
                            if (trustedBoostIssuer) {
                                verificationCheck.checks.push(
                                    `Boost is Authentic. Verified by ${trustedBoostIssuer.id}.`
                                );
                            } else {
                                verificationCheck.warnings.push(
                                    `Boost Authenticity could not be verified. Issuer is outside of trust network: ${getIssuerDID(
                                        credential?.issuer
                                    )}`
                                );
                            }
                        }
                    }
                } catch (e) {
                    verificationCheck.errors.push('Boost authenticity could not be verified.');
                }
                return verificationCheck;
            },
        },
    };
};
