import { VC, VP } from '@learncard/types';
import { getUser } from './getClient';
import { UnsignedVC } from '../../../../../packages/learn-card-types/dist/vc';

export const testVc: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'http://example.org/credentials/3731',
    type: ['VerifiableCredential'],
    credentialSubject: { id: 'did:web:localhost%3A3000:users:myseedisc' },
    issuer: 'did:web:localhost%3A3000:users:taylor',
    issuanceDate: '2020-08-19T21:41:50Z',
    proof: {
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        type: 'Ed25519Signature2020',
        proofPurpose: 'assertionMethod',
        proofValue:
            'z5yES8h51z4GXFiYnrepWbz3veZZ9gAA99LRKpcU1u3EM9LrkmGKXhxEJPwSJcRAHuX1S7uq5nKJeaUT9RMVjWvT5',
        verificationMethod: 'did:web:localhost%3A3000:users:taylor#owner',
        created: '2023-02-16T19:57:33.033Z',
    },
};

export const testUnsignedBoost: UnsignedVC = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        {
            type: '@type',
            xsd: 'https://www.w3.org/2001/XMLSchema#',
            lcn: 'https://docs.learncard.com/definitions#',
            BoostCredential: {
                '@id': 'lcn:boostCredential',
                '@context': {
                    boostId: { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                    display: {
                        '@id': 'lcn:boostDisplay',
                        '@context': {
                            backgroundImage: {
                                '@id': 'lcn:boostBackgroundImage',
                                '@type': 'xsd:string',
                            },
                            backgroundColor: {
                                '@id': 'lcn:boostBackgroundColor',
                                '@type': 'xsd:string',
                            },
                        },
                    },
                    image: { '@id': 'lcn:boostImage', '@type': 'xsd:string' },
                    attachments: {
                        '@id': 'lcn:boostAttachments',
                        '@container': '@set',
                        '@context': {
                            type: { '@id': 'lcn:boostAttachmentType', '@type': 'xsd:string' },
                            title: { '@id': 'lcn:boostAttachmentTitle', '@type': 'xsd:string' },
                            url: { '@id': 'lcn:boostAttachmentUrl', '@type': 'xsd:string' },
                        },
                    },
                },
            },
        },
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: 'did:web:localhost%3A3000:users:test',
    issuanceDate: '2020-08-19T21:41:50Z',
    name: 'Example Boost',
    credentialSubject: {
        id: 'did:example:d23dd687a7dc6787646f2eb98d0',
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:123',
            type: ['Achievement'],
            achievementType: 'Influencer',
            name: 'Awesome Badge',
            description: 'Awesome People Earn Awesome Badge',
            image: '',
            criteria: { narrative: 'Earned by being awesome.' },
        },
    },
};

export const sendCredential = async (
    from: { profileId: string; user: Awaited<ReturnType<typeof getUser>> },
    to: { profileId: string; user: Awaited<ReturnType<typeof getUser>> }
) => {
    const uri = await from.user.clients.fullAuth.credential.sendCredential({
        profileId: to.profileId,
        credential: testVc,
    });

    await to.user.clients.fullAuth.credential.acceptCredential({ uri });

    return uri;
};

export const testVp: VP = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'http://example.org/credentials/3731',
        type: ['VerifiableCredential'],
        credentialSubject: { id: 'did:web:localhost%3A3000:users:myseedisc' },
        issuer: 'did:web:localhost%3A3000:users:taylor',
        issuanceDate: '2020-08-19T21:41:50Z',
        proof: {
            '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
            type: 'Ed25519Signature2020',
            proofPurpose: 'assertionMethod',
            proofValue:
                'zwqzKNAYmmzWVej4qHY4RAVJENf2wDazcdWm4hSgsyjaDVKY6G2R5R817urBib7VxcYRKzUSk7fWPzbgwHm4uTRZ',
            verificationMethod: 'did:web:localhost%3A3000:users:taylor#owner',
            created: '2023-02-16T19:47:27.906Z',
        },
    },
    proof: {
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        type: 'Ed25519Signature2020',
        proofPurpose: 'assertionMethod',
        proofValue:
            'z3JSLpBUhKsu2LJTrfY8mnm9K3XY9t6Nucq3FjJd4ZyFNvwdNdwgQvdcxUqZYAe1sQ5UE2xbFH6p519Y3p91YUS96',
        verificationMethod: 'did:web:localhost%3A3000:users:taylor#owner',
        created: '2023-02-16T19:47:35.720Z',
    },
    holder: 'did:web:localhost%3A3000:users:taylor',
};

export const sendPresentation = async (
    from: { profileId: string; user: Awaited<ReturnType<typeof getUser>> },
    to: { profileId: string; user: Awaited<ReturnType<typeof getUser>> }
) => {
    const uri = await from.user.clients.fullAuth.presentation.sendPresentation({
        profileId: to.profileId,
        presentation: testVp,
    });

    await to.user.clients.fullAuth.presentation.acceptPresentation({ uri });

    return uri;
};

export const sendBoost = async (
    from: { profileId: string; user: Awaited<ReturnType<typeof getUser>> },
    to: { profileId: string; user: Awaited<ReturnType<typeof getUser>> },
    uri: string,
    autoAcceptIncomingBoost: boolean = true
): Promise<string> => {
    // TODO: Actually resolve boost from storage.
    //const boost = await from.user.clients.fullAuth.storage.resolve({ uri });
    const credential = await from.user.learnCard.invoke.issueCredential({
        ...testUnsignedBoost,
        issuer: from.user.learnCard.id.did(),
        credentialSubject: {
            ...testUnsignedBoost.credentialSubject,
            id: to.user.learnCard.id.did(),
        },
        boostId: uri,
    });

    const credentialUri = await from.user.clients.fullAuth.boost.sendBoost({
        profileId: to.profileId,
        uri,
        credential,
    });

    if (autoAcceptIncomingBoost) {
        await to.user.clients.fullAuth.credential.acceptCredential({ uri: credentialUri });
    }

    return credentialUri;
};