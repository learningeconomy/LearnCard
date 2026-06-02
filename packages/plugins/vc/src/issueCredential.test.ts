jest.mock('multiformats/bases/base58', () => ({ base58btc: {} }), { virtual: true });
jest.mock('multiformats/bases/base64', () => ({ base64url: {} }), { virtual: true });

import { issueCredential } from './issueCredential';

type Keypair = {
    kty: string;
    crv: string;
    x: string;
    d: string;
};

type Credential = {
    '@context': string[];
    type: string[];
    issuer: string;
    validFrom: string;
    credentialSubject: { id: string };
};

type ProofOptionsForTest = {
    type?: string;
    proofPurpose?: string;
    cryptosuite?: string;
    proofFormat?: string;
    verificationMethod?: string;
};

const keypair: Keypair = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'issuer-key',
    d: 'issuer-secret',
};

const credential: Credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
};

const getLearnCard = () => {
    const issueCredentialMock = jest.fn(
        async (
            unsignedCredential: Credential,
            _options: ProofOptionsForTest,
            _keypair: Keypair
        ) => ({
            ...unsignedCredential,
            proof: {
                type: 'DataIntegrityProof',
                created: '2026-01-01T00:00:00Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:example:issuer#key-1',
            },
        })
    );

    const initLearnCard = {
        invoke: {
            issueCredential: issueCredentialMock,
        },
    };

    const learnCard = {
        id: {
            keypair: () => keypair,
        },
        invoke: {
            didToVerificationMethod: jest.fn(async () => 'did:example:issuer#key-1'),
            resolveDid: jest.fn(async () => ({ verificationMethod: [] })),
        },
    };

    return { initLearnCard, issueCredentialMock, learnCard };
};

describe('issueCredential', () => {
    test('defaults to DataIntegrityProof with eddsa-rdfc-2022', async () => {
        const { initLearnCard, issueCredentialMock, learnCard } = getLearnCard();

        await issueCredential(initLearnCard as never)(learnCard as never, credential as never);

        expect(issueCredentialMock).toHaveBeenCalledWith(
            credential,
            expect.objectContaining({
                type: 'DataIntegrityProof',
                cryptosuite: 'eddsa-rdfc-2022',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:example:issuer#key-1',
            }),
            keypair
        );
    });

    test('does not add a cryptosuite for explicit non-DataIntegrity proofs', async () => {
        const { initLearnCard, issueCredentialMock, learnCard } = getLearnCard();

        await issueCredential(initLearnCard as never)(learnCard as never, credential as never, {
            type: 'Ed25519Signature2020',
        });

        const options = issueCredentialMock.mock.calls[0][1] as ProofOptionsForTest;

        expect(options.type).toBe('Ed25519Signature2020');
        expect(options.cryptosuite).toBeUndefined();
    });

    test('preserves explicit DataIntegrity cryptosuite overrides', async () => {
        const { initLearnCard, issueCredentialMock, learnCard } = getLearnCard();

        await issueCredential(initLearnCard as never)(learnCard as never, credential as never, {
            type: 'DataIntegrityProof',
            cryptosuite: 'json-eddsa-2022',
        });

        const options = issueCredentialMock.mock.calls[0][1] as ProofOptionsForTest;

        expect(options.cryptosuite).toBe('json-eddsa-2022');
    });

    test('leaves type unset and does not inject a cryptosuite for JWT proof format', async () => {
        const { initLearnCard, issueCredentialMock, learnCard } = getLearnCard();

        await issueCredential(initLearnCard as never)(learnCard as never, credential as never, {
            proofFormat: 'jwt',
        });

        const options = issueCredentialMock.mock.calls[0][1] as ProofOptionsForTest;

        expect(options.type).toBeUndefined();
        expect(options.cryptosuite).toBeUndefined();
        expect(options.proofFormat).toBe('jwt');
    });
});
