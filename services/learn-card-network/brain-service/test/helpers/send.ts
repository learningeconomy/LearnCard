import { VC, VP } from '@learncard/types';
import { getUser } from './getClient';

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

export const sendCredential = async (
    from: {
        profileId: string;
        user: Awaited<ReturnType<typeof getUser>>;
    },
    to: { profileId: string; user: Awaited<ReturnType<typeof getUser>> }
) => {
    const uri = await from.user.clients.fullAuth.credential.sendCredential({
        profileId: to.profileId,
        credential: testVc,
    });

    await to.user.clients.fullAuth.credential.acceptCredential({
        profileId: from.profileId,
        uri,
    });
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
    from: {
        profileId: string;
        user: Awaited<ReturnType<typeof getUser>>;
    },
    to: { profileId: string; user: Awaited<ReturnType<typeof getUser>> }
) => {
    const uri = await from.user.clients.fullAuth.presentation.sendPresentation({
        profileId: to.profileId,
        presentation: testVp,
    });

    await to.user.clients.fullAuth.presentation.acceptPresentation({
        profileId: from.profileId,
        uri,
    });

    return uri;
};
