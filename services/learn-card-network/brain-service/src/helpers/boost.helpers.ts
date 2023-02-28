import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';
import { VC, JWE, UnsignedVC } from '@learncard/types';

import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { BoostInstance, ProfileInstance } from '@models';
import { constructUri } from './uri.helpers';
import { storeCredential } from '@accesslayer/credential/create';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
import { isEncrypted } from './types.helpers';
import { createSentCredentialRelationship } from '@accesslayer/credential/relationships/create';
import { getCredentialUri } from './credential.helpers';
import { getLearnCard } from './learnCard.helpers';

export const getBoostUri = (id: string, domain: string): string =>
    constructUri('boost', id, domain);

export const isProfileBoostOwner = async (
    profile: ProfileInstance,
    boost: BoostInstance
): Promise<boolean> => {
    const owner = await getBoostOwner(boost);

    return owner?.profileId === profile.profileId;
};

export const verifyCredentialIsDerivedFromBoost = async (
    boost: BoostInstance,
    credential: VC,
    domain: string
): Promise<boolean> => {
    console.log('Compare boost & credential!');

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

    console.log('🚀🚀🚀🚀 ----');
    console.log(boostCredential);
    console.log('👀👀👀');
    console.log(credential);
    console.log('🚀🚀🚀🚀 ----');
    // TODO: Should we validate the boost id vs credential id??
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
    credential: VC | JWE,
    domain: string
): Promise<VC | JWE | false> => {
    const learnCard = await getLearnCard();
    const lcnDID = `did:web:${domain}`;
    try {
        if (await verifyCredentialIsDerivedFromBoost(boost, credential, domain)) {
            const unsignedCertifiedBoost = await constructCertifiedBoostCredential(
                boost,
                credential,
                domain,
                lcnDID
            );

            return learnCard.invoke.issueCredential(unsignedCertifiedBoost);
        } else {
            console.warn('Credential is not derived from boost', boost, credential);
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
        const decrypted = await learnCard.invoke.getDIDObject().decryptDagJWE(credential);
        return decrypted || false;
    } catch (error) {
        console.warn('Could not decrypt Boost Credential!');
        return false;
    }
};

export const sendBoost = async (
    from: ProfileInstance,
    to: ProfileInstance,
    boost: BoostInstance,
    credential: VC | JWE,
    domain: string
): Promise<string> => {
    const decryptedCredential = await decryptCredential(credential);

    const certifiedBoost = await issueCertifiedBoost(boost, decryptedCredential, domain);
    if (certifiedBoost) {
        const credentialInstance = await storeCredential(certifiedBoost);
        await createBoostInstanceOfRelationship(credentialInstance, boost);
        await createSentCredentialRelationship(from, to, credentialInstance);

        return getCredentialUri(credentialInstance.id, domain);
    } else {
        throw new Error('Credential does not match boost template.');
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