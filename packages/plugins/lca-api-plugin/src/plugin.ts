import { getClient, Client } from '@learncard/lca-api-client';
import { LearnCard } from '@learncard/core';
import pbkdf2Hmac from 'pbkdf2-hmac';

import { ThemeEnum } from './types';

import { LCAPluginDependentMethods, LCAPlugin } from './types';
import { JWKWithPrivateKey } from '@learncard/types';
import { toUint8Array } from 'hex-lite';
export * from './types';

const getNewClient = async (
    url: string,
    learnCard: LearnCard<any, 'id', LCAPluginDependentMethods>
) => {
    return getClient(url, async challenge => {
        const jwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

        if (typeof jwt !== 'string') throw new Error('Error getting DID-Auth-JWT!');

        return jwt;
    });
};

const getEncryptionJwk = async (
    client: Client,
    learnCard: LearnCard<any, 'id', LCAPluginDependentMethods>
): Promise<JWKWithPrivateKey> => {
    const key = await client.utilities.getEncryptionKey.query();
    return learnCard.invoke.generateEd25519KeyFromBytes(toUint8Array(key));
};

const ensureKeyAgreement = async (
    jwk: JWKWithPrivateKey,
    learnCard: LearnCard<any, 'id', LCAPluginDependentMethods>
) => {
    if (!learnCard.id.did().includes('did:web')) return; // did is not LCN Profile

    const encryptionDid = learnCard.invoke.keyToDid('key', jwk);
    const encryptionDidDoc = await learnCard.invoke.resolveDid(encryptionDid);

    const userDidDoc = await learnCard.invoke.resolveDid(learnCard.id.did());

    if (
        userDidDoc.keyAgreement?.some(keyAgreement => {
            return encryptionDidDoc.keyAgreement?.some(eKeyAgreement => {
                if (typeof eKeyAgreement === 'string' || typeof keyAgreement === 'string')
                    return false;

                return eKeyAgreement.publicKeyBase58 === keyAgreement.publicKeyBase58;
            });
        })
    ) {
        return; // Profile has already added this encryption key
    }

    await learnCard.invoke.addDidMetadata({
        verificationMethod: encryptionDidDoc.verificationMethod,
        keyAgreement: encryptionDidDoc.keyAgreement,
    });
};

/**
 * @group Plugins
 */
export const getLCAPlugin = async (
    initialLearnCard: LearnCard<any, 'id', LCAPluginDependentMethods>,
    url: string,
    useCustomHash = false
): Promise<LCAPlugin> => {
    let learnCard = initialLearnCard;
    let oldDid = learnCard.id.did();
    let encryptionJwk: JWKWithPrivateKey;

    // Don't break whole wallet if connection to LCA API can't be made.
    try {
        let client = await getNewClient(url, learnCard);

        const updateLearnCard = async (
            _learnCard: LearnCard<any, 'id', LCAPluginDependentMethods>
        ) => {
            const newDid = _learnCard.id.did();

            if (oldDid !== newDid) {
                client = await getNewClient(url, _learnCard);
                oldDid = newDid;
                encryptionJwk = await getEncryptionJwk(client, _learnCard);
                await ensureKeyAgreement(encryptionJwk, _learnCard);
            }

            learnCard = _learnCard;
        };

        const initialized = learnCard.invoke
            .getProfile()
            .then(async profile => {
                if (profile) await updateLearnCard(learnCard);
                encryptionJwk = await getEncryptionJwk(
                    await getNewClient(url, learnCard),
                    learnCard
                );
            })
            .catch(error => {
                console.warn('[LCA Plugin] Initialization warning:', error);
                // Continue without encryption JWK if initialization fails
                // This allows the plugin methods to still work even if initial setup has issues
            });

        return {
            name: 'LearnCard App',
            displayName: 'LearnCard App Plugin',
            description: 'Adds bespoke logic to the LearnCard App.',
            methods: {
                registerDeviceForPushNotifications: async (_learnCard, token) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.notifications.registerDeviceForPushNotifications.mutate({
                        token,
                    });
                },
                unregisterDeviceForPushNotifications: async (_learnCard, token) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.notifications.unregisterDeviceForPushNotifications.mutate({
                        token,
                    });
                },
                getNotifications: async (_learnCard, options, filters) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.notifications.notifications.query({
                        options,
                        filters,
                    }) as any;
                },
                queryNotifications: async (_learnCard, query, options = {}) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.notifications.queryNotifications.query({
                        query,
                        options: {
                            limit: options.limit ?? 20,
                            cursor: options.cursor,
                            sort: options.sort ?? 'REVERSE_CHRONOLOGICAL',
                        },
                    }) as any;
                },
                markAllNotificationsRead: async _learnCard => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.notifications.markAllNotificationsRead.mutate();
                },
                updateNotificationMeta: async (_learnCard, _id, meta) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.notifications.updateNotificationMeta.mutate({
                        _id,
                        meta,
                    });
                },
                createSigningAuthority: async (_learnCard, name, ownerDid) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.signingAuthority.createSigningAuthority.mutate({
                        name,
                        ownerDid,
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
                resetLCAClient: async _learnCard => {
                    await initialized;
                    client = await getNewClient(url, _learnCard);
                    learnCard = _learnCard;
                },
                generateBoostInfo: async (_learnCard, description) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.ai.generateBoostInfo.query({ description });

                    return {
                        title: result.title,
                        description: result.description,
                        category: result.category,
                        type: result.type,
                        skills: (result as any).skills,
                        narrative: result.narrative ?? '',
                    };
                },
                generateImage: async (_learnCard, prompt) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return (await client.ai.generateImage.query({ prompt })).url;
                },
                generateBoostSkills: async (_learnCard, description: string) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.ai.generateBoostSkills.query({ description });

                    return result;
                },
                generateSkillIcons: async (_learnCard, names: string[]) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.ai.generateSkillIcons.query({ names });

                    return result;
                },
                createPin: async (_learnCard, pin) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.createPin.mutate({ pin });

                    return result;
                },
                hasPin: async (_learnCard, did) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.hasPin.query({ did });

                    return result;
                },
                verifyPin: async (_learnCard, pin, did) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.verifyPin.query({ pin, did });

                    return result;
                },
                updatePin: async (_learnCard, currentPin, newPin) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.updatePin.mutate({ currentPin, newPin });

                    return result;
                },
                generatePinUpdateToken: async _learnCard => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.generatePinUpdateToken.mutate();

                    if (result?.token && result?.tokenExpire) {
                        return {
                            token: result.token,
                            tokenExpire: new Date(result.tokenExpire),
                        };
                    }

                    return null;
                },
                validatePinUpdateToken: async (_learnCard, token) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.validatePinUpdateToken.query({ token });

                    return result;
                },
                updatePinWithToken: async (_learnCard, token, newPin) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.pins.updatePinWithToken.mutate({ token, newPin });

                    return result;
                },
                generateAnalyticsAccessToken: async (_learnCard, payload) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.analytics.generateAnalyticsAccessToken.mutate(
                        payload
                    );

                    return result;
                },
                decryptDagJwe: async (_learnCard, jwe, jwks = []) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return initialLearnCard.invoke.decryptDagJwe(
                        jwe,
                        encryptionJwk ? [encryptionJwk, ...jwks] : jwks
                    );
                },
                hash: async (_learnCard, message, algorithm = 'PBKDF2-HMAC-SHA256') => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    if (!useCustomHash || algorithm !== 'PBKDF2-HMAC-SHA256' || !encryptionJwk) {
                        return undefined;
                    }

                    const crypto = learnCard.invoke.crypto();

                    const uint8Message = new TextEncoder().encode(message);

                    const pk = encryptionJwk.d;
                    const hmacKey = await pbkdf2Hmac(pk, 'salt', 1000, 32);
                    const cryptoKey = await crypto.subtle.importKey(
                        'raw',
                        hmacKey,
                        { name: 'HMAC', hash: 'SHA-256' },
                        false,
                        ['sign']
                    );

                    const digestBuffer = await crypto.subtle.sign('HMAC', cryptoKey, uint8Message);

                    const digestArray = Array.from(new Uint8Array(digestBuffer));

                    return digestArray
                        .map(byte => (byte as any).toString(16).padStart(2, '0'))
                        .join('');
                },
                getFirebaseUserByEmail: async (_learnCard, email) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.getFirebaseUserByEmail.query({ email });

                    return result?.userRecord || null;
                },
                authenticateWithKeycloak: async (_learnCard, token) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.authenticateWithKeycloak.mutate({
                        keycloakToken: token,
                    });

                    return result;
                },
                authenticateWithScoutsSSO: async (_learnCard, username, password) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.authenticateWithScoutsSSO.mutate({
                        username,
                        password,
                    });

                    return result || null;
                },
                sendLoginVerificationCode: async (_learnCard, email) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.sendLoginVerificationCode.mutate({
                        email,
                    });

                    return result;
                },
                verifyLoginCode: async (_learnCard, email, code) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.verifyLoginCode.mutate({ email, code });

                    return result;
                },
                verifyNetworkHandoffToken: async (_learnCard, token) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.verifyNetworkHandoffToken.mutate({
                        token,
                    });

                    return result;
                },
                getProofOfLoginVp: async (_learnCard, token) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.firebase.getProofOfLoginVp.mutate({ token });

                    return result;
                },
                createPreferences: async (_learnCard, preferences) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.preferences.createPreferences.mutate(preferences);

                    return result;
                },
                getPreferencesForDid: async _learnCard => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.preferences.getPreferencesForDid.query();

                    return result;
                },
                updatePreferences: async (_learnCard, preferences) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.preferences.updatePreferences.mutate(preferences);

                    return result;
                },
                sendEndorsementShareLink: async (
                    _learnCard,
                    email,
                    shareLink,
                    issuer,
                    credential,
                    message
                ) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    const result = await client.credentials.sendEndorsementShareLink.mutate({
                        email,
                        shareLink,
                        issuer,
                        credential,
                        message,
                    });

                    return result;
                },

                // SSS Key Management Methods
                getAuthShare: async (_learnCard, authToken, providerType) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.keys.getAuthShare.mutate({ authToken, providerType });
                },

                storeAuthShare: async (
                    _learnCard,
                    authToken,
                    providerType,
                    authShare,
                    primaryDid,
                    securityLevel
                ) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.keys.storeAuthShare.mutate({
                        authToken,
                        providerType,
                        authShare,
                        primaryDid,
                        securityLevel,
                    });
                },

                addRecoveryMethod: async (
                    _learnCard,
                    authToken,
                    providerType,
                    type,
                    encryptedShare,
                    credentialId
                ) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.keys.addRecoveryMethod.mutate({
                        authToken,
                        providerType,
                        type,
                        encryptedShare,
                        credentialId,
                    });
                },

                getRecoveryShare: async (
                    _learnCard,
                    authToken,
                    providerType,
                    type,
                    credentialId
                ) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.keys.getRecoveryShare.query({
                        authToken,
                        providerType,
                        type,
                        credentialId,
                    });
                },

                markMigrated: async (_learnCard, authToken, providerType) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.keys.markMigrated.mutate({ authToken, providerType });
                },

                deleteUserKey: async (_learnCard, authToken, providerType) => {
                    await initialized;
                    await updateLearnCard(_learnCard);

                    return client.keys.deleteUserKey.mutate({ authToken, providerType });
                },
            },
        };
    } catch (e) {
        console.error(
            'Unable to initialize LCA API Connection. Starting plugin in offline mode...',
            e
        );
        return {
            name: 'LearnCard App',
            displayName: 'LearnCard App Plugin (Offline)',
            description: 'Adds bespoke logic to the LearnCard App. (Unable to connect to LCA API)',
            methods: {
                registerDeviceForPushNotifications: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                unregisterDeviceForPushNotifications: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                getNotifications: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                queryNotifications: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                markAllNotificationsRead: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                updateNotificationMeta: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                createSigningAuthority: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                getSigningAuthorities: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                authorizeSigningAuthority: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                resetLCAClient: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                },
                generateBoostInfo: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return {
                        title: '',
                        description: '',
                        category: '',
                        type: '',
                        skills: [],
                        narrative: '',
                    };
                },
                generateImage: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return '';
                },
                generateBoostSkills: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return [];
                },
                generateSkillIcons: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return {};
                },
                createPin: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                hasPin: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                verifyPin: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                updatePin: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                generatePinUpdateToken: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return null;
                },
                validatePinUpdateToken: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                updatePinWithToken: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                generateAnalyticsAccessToken: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return null;
                },
                decryptDagJwe: async (_learnCard, jwe, jwks = []) =>
                    initialLearnCard.invoke.decryptDagJwe(jwe, jwks),
                hash: async () => undefined,

                getFirebaseUserByEmail: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return null;
                },

                authenticateWithKeycloak: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { firebaseToken: '' };
                },
                authenticateWithScoutsSSO: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return null;
                },
                sendLoginVerificationCode: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false, message: '' };
                },
                verifyLoginCode: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false, message: '' };
                },
                verifyNetworkHandoffToken: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false, message: '' };
                },
                getProofOfLoginVp: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false, error: 'Offline' };
                },
                createPreferences: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                updatePreferences: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },
                getPreferencesForDid: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { theme: ThemeEnum.Colorful };
                },
                sendEndorsementShareLink: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return false;
                },

                // SSS Key Management Methods (Offline)
                getAuthShare: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return null;
                },
                storeAuthShare: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false };
                },
                addRecoveryMethod: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false };
                },
                getRecoveryShare: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return null;
                },
                markMigrated: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false };
                },
                deleteUserKey: async () => {
                    console.error('Unable to connect to LCA API. Plugin must be re-added.');
                    return { success: false };
                },
            },
        };
    }
};
