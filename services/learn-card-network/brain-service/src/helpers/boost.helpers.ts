import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';
import { VC, JWE, UnsignedVC, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';

import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { BoostInstance } from '@models';
import { constructUri } from './uri.helpers';
import { storeCredential } from '@accesslayer/credential/create';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
import {
    createSentCredentialRelationship,
    createReceivedCredentialRelationship,
    setDefaultClaimedRole,
    createCredentialIssuedViaContractRelationship,
} from '@accesslayer/credential/relationships/create';
import { getCredentialUri } from './credential.helpers';
import { getLearnCard } from './learnCard.helpers';
import { issueCredentialWithSigningAuthority } from './signingAuthority.helpers';
import { addNotificationToQueue } from './notifications.helpers';
import { BoostStatus } from 'types/boost';
import { getDidWeb } from './did.helpers';
import { DbTermsType } from 'types/consentflowcontract';

export const getBoostUri = (id: string, domain: string): string =>
    constructUri('boost', id, domain);

export const isProfileBoostOwner = async (
    profile: ProfileType,
    boost: BoostInstance
): Promise<boolean> => {
    const owner = await getBoostOwner(boost);

    return owner?.profileId === profile.profileId;
};

export const isDraftBoost = (boost: BoostInstance): boolean => {
    return boost.status === BoostStatus.enum.DRAFT;
};

export const convertCredentialToBoostTemplateJSON = (
    credential: VC | UnsignedVC,
    defaultIssuerDid?: string
): string => {
    const template = { ...credential };

    delete template.proof;
    template.issuer = defaultIssuerDid ?? 'did:example:123';

    if (Array.isArray(template.credentialSubject)) {
        template.credentialSubject = template.credentialSubject.map(subject => {
            subject.id = 'did:example:123';

            return subject;
        });
    } else {
        template.credentialSubject.id = 'did:example:123';
    }
    return JSON.stringify(template);
};

export const verifyCredentialIsDerivedFromBoost = async (
    boost: BoostInstance,
    credential: VC,
    domain: string
): Promise<boolean> => {
    if (!boost || !credential) {
        console.error('Either boost or credential do not exist.', credential, credential);
        return false;
    }

    const boostCredential = JSON.parse(boost?.dataValues?.boost);
    const boostId = boost?.dataValues?.id;
    const boostURI = getBoostUri(boostId, domain);

    if (!boostCredential) {
        console.error('No credential template attached to boost');
        return false;
    }

    if (!isEqual(credential.boostId, boostURI)) {
        console.error('Credential boostId !== boost id', credential.boostId, boostURI);
        return false;
    }

    /// Simplify Comparison
    // if (
    //     !isEqual(credential.boostId, boostId) ||
    //     !isEqual(credential.type, boostCredential.type) ||
    //     !isEqual(
    //         credential.credentialSubject?.achievement,
    //         boostCredential.credentialSubject?.achievement
    //     ) ||
    //     !isEqual(credential.display, boostCredential.display) ||
    //     isEqual(credential.image, boostCredential.image) ||
    //     !isEqual(credential.attachments, boostCredential.attachments)
    // ) {
    //     return false;
    // }

    if (!isEqual(credential.type, boostCredential.type)) {
        console.error(
            'Credential type !== boost credential type',
            credential.type,
            boostCredential.type
        );
        return false;
    }

    if (
        credential.credentialSubject &&
        'achievement' in credential.credentialSubject &&
        typeof credential.credentialSubject.achievement === 'object'
    ) {
        if (
            !isEqual(
                credential.credentialSubject?.achievement,
                boostCredential.credentialSubject?.achievement
            )
        ) {
            console.error(
                'Credential achievement !== boost credential achievement',
                credential.credentialSubject?.achievement,
                boostCredential.credentialSubject?.achievement
            );
            return false;
        }
    }

    if (!isEqual(credential.display, boostCredential.display)) {
        console.error(
            'Credential display !== boost credential display',
            credential.display,
            boostCredential.display
        );
        return false;
    }

    if (!isEqual(credential.image, boostCredential.image)) {
        console.error(
            'Credential image !== boost credential image',
            credential.image,
            boostCredential.image
        );
        return false;
    }

    if (!isEqual(credential.attachments, boostCredential.attachments)) {
        console.error(
            'Credential attachments !== boost credential attachments',
            credential.attachments,
            boostCredential.attachments
        );
        return false;
    }
    if (boost && credential) {
        return true;
    }
    return false;
};

export const issueCertifiedBoost = async (
    boost: BoostInstance,
    credential: VC,
    domain: string
): Promise<VC | JWE | false> => {
    const learnCard = await getLearnCard();
    let lcnDID = `did:web:${domain}`;
    try {
        const didDoc = await learnCard.invoke.resolveDid(lcnDID);
        if (!didDoc) {
            lcnDID = learnCard.id.did();
        }
    } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(
                'LCN DID Document is unable to resolve while issuing Certified Boost. Reverting to did:key. Is this a test environment?',
                lcnDID
            );
        }
        lcnDID = learnCard.id.did();
    }

    try {
        if (await verifyCredentialIsDerivedFromBoost(boost, credential, domain)) {
            const unsignedCertifiedBoost = await constructCertifiedBoostCredential(
                boost,
                credential,
                domain,
                lcnDID
            );
            // TODO: Encrypt Boost Credential
            return learnCard.invoke.issueCredential(unsignedCertifiedBoost);
        } else {
            console.warn(
                'Credential is not derived from boost',
                boost.dataValues.boost,
                credential
            );
        }
    } catch (error) {
        console.warn('Could not issue certified boost', error);
    }
    return false;
};

export const decryptCredential = async (credential: VC | JWE): Promise<VC | false> => {
    if (!isEncrypted(credential)) {
        return credential;
    }
    const learnCard = await getLearnCard();
    try {
        const decrypted = (await learnCard.invoke
            .getDIDObject()
            .decryptDagJWE(credential as JWE)) as VC;
        return decrypted || false;
    } catch (error) {
        console.warn('Could not decrypt Boost Credential!');
        return false;
    }
};

export const sendBoost = async (
    from: ProfileType,
    to: ProfileType,
    boost: BoostInstance,
    credential: VC | JWE,
    domain: string,
    skipNotification: boolean = false,
    autoAcceptCredential: boolean = false,
    contractTerms?: DbTermsType
): Promise<string> => {
    const decryptedCredential = await decryptCredential(credential);
    let boostUri: string | undefined;
    if (decryptedCredential) {
        if (process.env.NODE_ENV !== 'test') console.log('🚀 sendBoost:VC Decrypted');
        const certifiedBoost = await issueCertifiedBoost(boost, decryptedCredential, domain);
        if (certifiedBoost) {
            const credentialInstance = await storeCredential(certifiedBoost);

            const tasks = [
                createBoostInstanceOfRelationship(credentialInstance, boost),
                createSentCredentialRelationship(from, to, credentialInstance),
                ...(autoAcceptCredential
                    ? [createReceivedCredentialRelationship(to, from, credentialInstance)]
                    : []),
            ];

            // If this credential is being issued via a contract, create that relationship
            if (contractTerms) {
                tasks.push(
                    createCredentialIssuedViaContractRelationship(credentialInstance, contractTerms)
                );
            }

            await Promise.all(tasks);

            if (autoAcceptCredential) await setDefaultClaimedRole(to, credentialInstance);

            boostUri = getCredentialUri(credentialInstance.id, domain);
            if (process.env.NODE_ENV !== 'test') {
                console.log('🚀 sendBoost:boost certified', boostUri);
            }
        } else {
            throw new Error('Credential does not match boost template.');
        }
    } else {
        // TODO: Should we warn them if they send a credential that can't be decrypted?
        const credentialInstance = await storeCredential(credential);

        const tasks = [
            createBoostInstanceOfRelationship(credentialInstance, boost),
            createSentCredentialRelationship(from, to, credentialInstance),
            ...(autoAcceptCredential
                ? [createReceivedCredentialRelationship(to, from, credentialInstance)]
                : []),
        ];

        // If this credential is being issued via a contract, create that relationship
        if (contractTerms) {
            tasks.push(
                createCredentialIssuedViaContractRelationship(credentialInstance, contractTerms)
            );
        }

        await Promise.all(tasks);

        if (autoAcceptCredential) await setDefaultClaimedRole(to, credentialInstance);

        boostUri = getCredentialUri(credentialInstance.id, domain);
        if (process.env.NODE_ENV !== 'test') {
            console.log('🚀 sendBoost:boost sent uncertified', boostUri);
        }
    }

    if (typeof boostUri === 'string') {
        if (!skipNotification) {
            await addNotificationToQueue({
                type: LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                to: to,
                from: from,
                message: {
                    title: 'Boost Received',
                    body: `${from.displayName} has boosted you!`,
                },
                data: {
                    vcUris: [boostUri],
                },
            });
            if (process.env.NODE_ENV !== 'test') {
                console.log('🚀 sendBoost:notification sent! ✅');
            }
        }
        return boostUri;
    } else {
        throw new Error('Error sending boost.');
    }
};

export const constructCertifiedBoostCredential = async (
    boost: BoostInstance,
    credential: VC | JWE,
    domain: string,
    issuerDid: string
): Promise<UnsignedVC> => {
    const currentDate = new Date()?.toISOString();

    const boostId = boost?.dataValues?.id;
    const boostURI = getBoostUri(boostId, domain);

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                id: '@id',
                type: '@type',
                cred: 'https://www.w3.org/2018/credentials#',
                lcn: 'https://docs.learncard.com/definitions#',
                CertifiedBoostCredential: {
                    '@id': 'lcn:certifiedBoostCredential',
                    '@context': {
                        '@version': 1.1,
                        boostId: {
                            '@id': 'lcn:boostId',
                            '@type': 'xsd:string',
                        },
                        boostCredential: {
                            '@id': 'cred:VerifiableCredential',
                            '@type': '@id',
                            '@container': '@graph',
                        },
                    },
                },
            },
        ],
        id: `urn:uuid:${uuidv4()}`,
        type: ['VerifiableCredential', 'CertifiedBoostCredential'],
        issuer: issuerDid,
        issuanceDate: currentDate,
        credentialSubject: { id: issuerDid },
        boostId: boostURI,
        boostCredential: credential,
    };
};

export const issueClaimLinkBoost = async (
    boost: BoostInstance,
    domain: string,
    from: ProfileType,
    to: ProfileType,
    signingAuthorityForUser: SigningAuthorityForUserType
): Promise<string> => {
    const boostCredential = JSON.parse(boost.dataValues?.boost) as UnsignedVC | VC;
    const boostId = boost?.dataValues?.id;
    const boostURI = getBoostUri(boostId, domain);

    boostCredential.issuer = signingAuthorityForUser.relationship.did;

    if (Array.isArray(boostCredential.credentialSubject)) {
        boostCredential.credentialSubject = boostCredential.credentialSubject.map(subject => ({
            ...subject,
            id: subject.did,
        }));
    } else {
        boostCredential.credentialSubject.id = getDidWeb(domain, to.profileId);
    }

    // Embed the boostURI into the boost credential for verification purposes.
    if (boostCredential?.type?.includes('BoostCredential')) {
        boostCredential.boostId = boostURI;
    }

    const vc = await issueCredentialWithSigningAuthority(
        from,
        boostCredential,
        signingAuthorityForUser,
        domain,
        false
    );
    // TODO: encrypt vc?

    // const lcnDid = await client.utilities.getDid.query();

    // const credential = await _learnCard.invoke
    //     .getDIDObject()
    //     .createDagJWE(vc, [userData.did, targetProfile.did, lcnDid]);

    return sendBoost(from, to, boost, vc, domain, true, true);
};
