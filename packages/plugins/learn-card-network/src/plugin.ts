import { getClient } from '@learncard/network-brain-client';
import {
    JWEValidator,
    LCNProfile,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    Profile,
    ConsentFlowContractValidator,
    ConsentFlowTermsValidator,
    JWE,
    AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX,
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
    let did = learnCard.id.did();

    learnCard?.debug?.('Adding LearnCardNetwork Plugin');
    const client = await getClient(url, async challenge => {
        const jwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

        if (typeof jwt !== 'string') throw new Error('Error getting DID-Auth-JWT!');

        return jwt;
    });

    let userData: LCNProfile | undefined;

    const initialQuery = client.profile.getProfile.query().then(result => {
        userData = result;

        if (userData?.did) did = userData.did;
    });

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
                        result = await _learnCard.invoke.decryptDagJwe(result as JWE, [
                            _learnCard.id.keypair(),
                        ]);
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

                const jwe = await _learnCard.invoke.createDagJwe(credential, [
                    _learnCard.id.did(),
                    ...recipients,
                ]);

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
            createManagedProfile: async (_learnCard, profile) => {
                const newDid = await client.profileManager.createManagedProfile.mutate(profile);

                return newDid;
            },
            createProfileManager: async (_learnCard, profile) => {
                if (!userData) throw new Error('Please make an account first!');

                const newDid = await client.profileManager.createProfileManager.mutate(profile);

                return newDid;
            },
            createChildProfileManager: async (_learnCard, parentUri, profile) => {
                if (!userData) throw new Error('Please make an account first!');

                const newDid = await client.profileManager.createChildProfileManager.mutate({
                    parentUri,
                    profile,
                });

                return newDid;
            },
            createManagedServiceProfile: async (_learnCard, profile) => {
                if (!userData) throw new Error('Please make an account first!');

                const newDid = await client.profile.createManagedServiceProfile.mutate(profile);

                return newDid;
            },
            getAvailableProfiles: async (_learnCard, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.getAvailableProfiles.query(options);
            },
            getManagedProfiles: async (_learnCard, options = {}) => {
                return client.profileManager.getManagedProfiles.query(options);
            },
            getManagedServiceProfiles: async (_learnCard, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.getManagedServiceProfiles.query(options);
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
            updateProfileManagerProfile: async (_learnCard, manager) => {
                return client.profileManager.updateProfileManager.mutate(manager);
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
                await initialQuery;

                if (!profileId) return client.profile.getProfile.query();

                return client.profile.getOtherProfile.query({ profileId });
            },
            getProfileManagerProfile: async (_learnCard, id) => {
                if (!id) return client.profileManager.getProfileManager.query();

                return client.profileManager.getOtherProfileManager.query({ id });
            },
            searchProfiles: async (
                _learnCard,
                input = '',
                {
                    limit = 25,
                    includeSelf = false,
                    includeConnectionStatus = false,
                    includeServiceProfiles = false,
                } = {}
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
            getConnections: async _learnCard => {
                console.warn(
                    'The getConnections method is deprecated! Please use getPaginatedConnections instead!'
                );

                if (!userData) throw new Error('Please make an account first!');

                return client.profile.connections.query();
            },
            getPaginatedConnections: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.paginatedConnections.query(options);
            },
            getPendingConnections: async _learnCard => {
                console.warn(
                    'The getPendingConnections method is deprecated! Please use getPaginatedPendingConnections instead!'
                );

                if (!userData) throw new Error('Please make an account first!');

                return client.profile.pendingConnections.query();
            },
            getPaginatedPendingConnections: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.paginatedPendingConnections.query(options);
            },
            getConnectionRequests: async _learnCard => {
                console.warn(
                    'The getConnectionRequests method is deprecated! Please use getPaginatedConnectionRequests instead!'
                );

                if (!userData) throw new Error('Please make an account first!');

                return client.profile.connectionRequests.query();
            },
            getPaginatedConnectionRequests: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.profile.paginatedConnectionRequests.query(options);
            },

            generateInvite: async (_learnCard, challenge, expiration) => {
                if (!userData) throw new Error('Please make an account first!');
                return client.profile.generateInvite.mutate({ challenge, expiration });
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

                const credential = await _learnCard.invoke.createDagJwe(vc, [
                    userData.did,
                    target.did,
                ]);

                return client.credential.sendCredential.mutate({ profileId, credential });
            },
            acceptCredential: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.credential.acceptCredential.mutate({ uri, options });
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

                const presentation = await _learnCard.invoke.createDagJwe(vp, [
                    userData.did,
                    target.did,
                ]);

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
            createChildBoost: async (_learnCard, parentUri, credential, metadata) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.createChildBoost.mutate({
                    parentUri,
                    boost: { credential, ...metadata },
                });
            },
            getBoost: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoost.query({ uri });
            },
            getBoosts: async (_learnCard, query) => {
                console.warn(
                    'The getBoosts method is deprecated! Please use getPaginatedBoosts instead!'
                );

                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoosts.query({ query });
            },
            countBoosts: async (_learnCard, query) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.countBoosts.query({ query });
            },
            getPaginatedBoosts: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getPaginatedBoosts.query(options);
            },
            getBoostChildren: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostChildren.query({ uri, ...options });
            },
            countBoostChildren: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.countBoostChildren.query({ uri, ...options });
            },
            getBoostSiblings: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostSiblings.query({ uri, ...options });
            },
            countBoostSiblings: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.countBoostSiblings.query({ uri, ...options });
            },
            getFamilialBoosts: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getFamilialBoosts.query({ uri, ...options });
            },
            countFamilialBoosts: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.countFamilialBoosts.query({ uri, ...options });
            },
            getBoostParents: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostParents.query({ uri, ...options });
            },
            countBoostParents: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.countBoostParents.query({ uri, ...options });
            },
            makeBoostParent: async (_learnCard, uris) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.makeBoostParent.mutate(uris);
            },
            removeBoostParent: async (_learnCard, uris) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.removeBoostParent.mutate(uris);
            },
            getBoostRecipients: async (
                _learnCard,
                uri,
                limit = 25,
                skip = undefined,
                includeUnacceptedBoosts = true
            ) => {
                console.warn(
                    'The getBoostRecipients method is deprecated! Please use getPaginatedBoostRecipients instead!'
                );

                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostRecipients.query({
                    uri,
                    limit,
                    skip,
                    includeUnacceptedBoosts,
                });
            },
            getPaginatedBoostRecipients: async (
                _learnCard,
                uri,
                limit = 25,
                cursor = undefined,
                includeUnacceptedBoosts = true,
                query
            ) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getPaginatedBoostRecipients.query({
                    uri,
                    limit,
                    cursor,
                    includeUnacceptedBoosts,
                    query,
                });
            },
            countBoostRecipients: async (_learnCard, uri, includeUnacceptedBoosts = true) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostRecipientCount.query({ uri, includeUnacceptedBoosts });
            },
            getBoostChildrenProfileManagers: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getChildrenProfileManagers.query({ uri, ...options });
            },
            updateBoost: async (_learnCard, uri, updates, credential) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.updateBoost.mutate({
                    uri,
                    updates: { ...(credential && { credential }), ...updates },
                });
            },
            getBoostAdmins: async (_learnCard, uri, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.getBoostAdmins.query({ uri, ...options });
            },
            getBoostPermissions: async (_learnCard, uri, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                if (!profileId) return client.boost.getBoostPermissions.query({ uri });

                return client.boost.getOtherBoostPermissions.query({ uri, profileId });
            },
            updateBoostPermissions: async (_learnCard, uri, updates, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                if (!profileId) return client.boost.updateBoostPermissions.query({ uri, updates });

                const result = await client.boost.updateOtherBoostPermissions.query({
                    uri,
                    profileId,
                    updates,
                });

                if (result) await _learnCard.invoke.clearDidWebCache?.();

                return result;
            },
            addBoostAdmin: async (_learnCard, uri, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.boost.addBoostAdmin.mutate({ uri, profileId });

                if (result) await _learnCard.invoke.clearDidWebCache?.();

                return result;
            },
            removeBoostAdmin: async (_learnCard, uri, profileId) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.boost.removeBoostAdmin.mutate({ uri, profileId });

                if (result) await _learnCard.invoke.clearDidWebCache?.();

                return result;
            },
            deleteBoost: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.boost.deleteBoost.mutate({ uri });
            },
            sendBoost: async (
                _learnCard,
                profileId,
                boostUri,
                options = { encrypt: true, skipNotification: false }
            ) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await _learnCard.invoke.resolveFromLCN(boostUri);
                const data = await UnsignedVCValidator.spa(result);

                if (!data.success) throw new Error('Did not get a valid boost from URI');

                const targetProfile = await _learnCard.invoke.getProfile(profileId);

                if (!targetProfile) throw new Error('Target profile not found');

                let boost = data.data;

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
                if (boost?.type?.includes('BoostCredential')) boost.boostId = boostUri;

                if (typeof options === 'object' && options.overideFn) {
                    boost = options.overideFn(boost);
                }

                const vc = await _learnCard.invoke.issueCredential(boost);

                // options is allowed to be a boolean to maintain backwards compatibility
                if ((typeof options === 'object' && !options.encrypt) || !options) {
                    return client.boost.sendBoost.mutate({
                        profileId,
                        uri: boostUri,
                        credential: vc,
                        options: {
                            skipNotification:
                                typeof options === 'object' && options.skipNotification,
                        },
                    });
                }

                const lcnDid = await client.utilities.getDid.query();

                const credential = await _learnCard.invoke.createDagJwe(vc, [
                    userData.did,
                    targetProfile.did,
                    lcnDid,
                ]);

                return client.boost.sendBoost.mutate({
                    profileId,
                    uri: boostUri,
                    credential,
                    options: {
                        skipNotification: typeof options === 'object' && options.skipNotification,
                    },
                });
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

            createContract: async (_learnCard, contract) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.createConsentFlowContract.mutate(contract);
            },

            getContract: async (_learnCard, uri) => {
                return client.contracts.getConsentFlowContract.query({ uri });
            },

            getContracts: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getConsentFlowContracts.query(options);
            },

            deleteContract: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.deleteConsentFlowContract.mutate({ uri });
            },

            getConsentFlowData: async (_learnCard, uri, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getConsentedDataForContract.query({ uri, ...options });
            },

            getConsentFlowDataForDid: async (_learnCard, did, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getConsentedDataForDid.query({ did, ...options });
            },

            getAllConsentFlowData: async (_learnCard, query = {}, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getConsentedData.query({ query, ...options });
            },

            writeCredentialToContract: async (
                _learnCard,
                did,
                contractUri,
                credential,
                boostUri
            ) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.writeCredentialToContract.mutate({
                    did,
                    contractUri,
                    credential,
                    boostUri,
                });
            },

            consentToContract: async (_learnCard, contractUri, { terms, expiresAt, oneTime }) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.consentToContract.mutate({
                    contractUri,
                    terms,
                    expiresAt,
                    oneTime,
                });
            },

            getConsentedContracts: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getConsentedContracts.query(options);
            },

            updateContractTerms: async (_learnCard, uri, { terms, expiresAt, oneTime }) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.updateConsentedContractTerms.mutate({
                    uri,
                    terms,
                    expiresAt,
                    oneTime,
                });
            },

            withdrawConsent: async (_learnCard, uri) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.withdrawConsent.mutate({ uri });
            },

            getConsentFlowTransactions: async (_learnCard, uri, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getTermsTransactionHistory.query({ uri, ...options });
            },

            getCredentialsForContract: async (_learnCard, termsUri, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getCredentialsForContract.query({ termsUri, ...options });
            },

            getConsentFlowCredentials: async (_learnCard, options = {}) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.getAllCredentialsForTerms.query(options);
            },

            verifyConsent: async (_learnCard, uri, profileId) => {
                return client.contracts.verifyConsent.query({ uri, profileId });
            },

            syncCredentialsToContract: async (_learnCard, termsUri, categories) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.contracts.syncCredentialsToContract.mutate({
                    termsUri,
                    categories,
                });
            },

            addDidMetadata: async (_learnCard, metadata) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.didMetadata.addDidMetadata.mutate(metadata);

                if (result) await _learnCard.invoke.clearDidWebCache?.();

                return result;
            },

            getDidMetadata: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.didMetadata.getDidMetadata.query({ id });
            },

            getMyDidMetadata: async () => {
                if (!userData) throw new Error('Please make an account first!');

                return client.didMetadata.getMyDidMetadata.query();
            },

            updateDidMetadata: async (_learnCard, id, updates) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.didMetadata.updateDidMetadata.mutate({ id, updates });

                if (result) await _learnCard.invoke.clearDidWebCache?.();

                return result;
            },

            deleteDidMetadata: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                const result = await client.didMetadata.deleteDidMetadata.mutate({ id });

                if (result) await _learnCard.invoke.clearDidWebCache?.();

                return result;
            },

            createClaimHook: async (_learnCard, hook) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.claimHook.createClaimHook.mutate({ hook });
            },

            getClaimHooksForBoost: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.claimHook.getClaimHooksForBoost.query(options);
            },

            deleteClaimHook: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.claimHook.deleteClaimHook.mutate({ id });
            },

            addAuthGrant: async (_learnCard, authGrant) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.authGrants.addAuthGrant.mutate(authGrant);
            },
            revokeAuthGrant: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.authGrants.revokeAuthGrant.mutate({ id });
            },
            deleteAuthGrant: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.authGrants.deleteAuthGrant.mutate({ id });
            },
            updateAuthGrant: async (_learnCard, id, updates) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.authGrants.updateAuthGrant.mutate({ id, updates });
            },
            getAuthGrant: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.authGrants.getAuthGrant.query({ id });
            },
            getAuthGrants: async (_learnCard, options) => {
                if (!userData) throw new Error('Please make an account first!');

                return client.authGrants.getAuthGrants.query(options);
            },
            getAPITokenForAuthGrant: async (_learnCard, id) => {
                if (!userData) throw new Error('Please make an account first!');

                const authGrant = await client.authGrants.getAuthGrant.query({ id });
                if (!authGrant) throw new Error('Auth grant not found');
                if (authGrant.status !== 'active') throw new Error('Auth grant is not active');
                if (!authGrant.challenge) throw new Error('Auth grant has no challenge');
                if (!authGrant.scope) throw new Error('Auth grant has no scope');
                if (authGrant.expiresAt && new Date(authGrant.expiresAt) < new Date())
                    throw new Error('Auth grant is expired');

                const apiToken = (await _learnCard.invoke.getDidAuthVp({
                    challenge: authGrant.challenge,
                    proofFormat: 'jwt',
                })) as string;

                if (!apiToken) throw new Error('Failed to get API Token for auth grant');

                return apiToken;
            },

            resolveFromLCN: async (_learnCard, uri) => {
                const result = await client.storage.resolve.query({ uri });

                return UnsignedVCValidator.or(VCValidator)
                    .or(VPValidator)
                    .or(JWEValidator)
                    .or(ConsentFlowContractValidator)
                    .or(ConsentFlowTermsValidator)
                    .parseAsync(result);
            },

            getLCNClient: () => client,
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
            verifyCredential: async (_learnCard, credential, options) => {
                const verificationCheck = await learnCard.invoke.verifyCredential(
                    credential,
                    options
                );
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
