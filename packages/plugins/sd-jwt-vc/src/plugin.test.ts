jest.mock('./verify', () => ({
    verifySdJwtVc: jest.fn(),
}));

import { verifySdJwtVc } from './verify';
import { getSdJwtVcPlugin } from './plugin';

const mockVerify = verifySdJwtVc as unknown as jest.Mock;

type LearnCardMock = any;

const buildLearnCard = (
    chainedVerifyCredential: jest.Mock = jest.fn(async () => ({
        checks: ['proof'],
        warnings: [],
        errors: [],
    }))
): LearnCardMock => ({
    invoke: {
        verifyCredential: chainedVerifyCredential,
        resolveDid: jest.fn(async () => ({})),
    },
});

const sdJwtVc = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'SdJwtVcCredential'],
    issuer: 'did:web:issuer.example.com',
    sdJwtVct: 'https://example.com/credentials/test-cert',
    proof: {
        type: 'SdJwtCompactProof',
        jwt: 'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.payload.sig~',
        verificationMethod: 'did:web:issuer.example.com#key-1',
        proofPurpose: 'assertionMethod',
    },
};

const ldVc = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'TestCredential'],
    issuer: 'did:key:zABC',
    proof: {
        type: 'Ed25519Signature2020',
        verificationMethod: 'did:key:zABC#zABC',
        proofPurpose: 'assertionMethod',
        proofValue: 'z58…',
    },
};

beforeEach(() => {
    mockVerify.mockReset();
    mockVerify.mockResolvedValue({
        checks: ['parse', 'issuer_signature'],
        warnings: [],
        errors: [],
    });
});

describe('SdJwtVcPlugin.verifyCredential', () => {
    it('routes SdJwtCompactProof credentials to verifySdJwtVc, bypassing the chained verifier', async () => {
        const chained = jest.fn();
        const lc = buildLearnCard(chained);
        const plugin = getSdJwtVcPlugin(lc);

        const result = await plugin.methods.verifyCredential(
            lc as never,
            sdJwtVc as never
        );

        expect(mockVerify).toHaveBeenCalledTimes(1);
        expect(mockVerify).toHaveBeenCalledWith(lc, sdJwtVc.proof.jwt, {});
        expect(chained).not.toHaveBeenCalled();
        expect(result.errors).toEqual([]);
        expect(result.checks).toContain('issuer_signature');
    });

    it('surfaces SD-JWT verification errors back to the caller', async () => {
        mockVerify.mockResolvedValue({
            checks: ['parse'],
            warnings: [],
            errors: ['signature_invalid: bad signature'],
        });
        const lc = buildLearnCard();
        const plugin = getSdJwtVcPlugin(lc);

        const result = await plugin.methods.verifyCredential(
            lc as never,
            sdJwtVc as never
        );

        expect(result.errors).toEqual(['signature_invalid: bad signature']);
    });

    it('delegates non-SD-JWT credentials to the chained verifyCredential', async () => {
        const chained = jest.fn(async () => ({
            checks: ['proof'],
            warnings: [],
            errors: [],
        }));
        const lc = buildLearnCard(chained);
        const plugin = getSdJwtVcPlugin(lc);

        await plugin.methods.verifyCredential(lc as never, ldVc as never);

        expect(mockVerify).not.toHaveBeenCalled();
        expect(chained).toHaveBeenCalledTimes(1);
        const [credentialArg] = chained.mock.calls[0];
        expect(credentialArg).toBe(ldVc);
    });

    it('passes options through to the chained verifier for non-SD-JWT credentials', async () => {
        const chained = jest.fn(async () => ({
            checks: ['proof'],
            warnings: [],
            errors: [],
        }));
        const lc = buildLearnCard(chained);
        const plugin = getSdJwtVcPlugin(lc);

        await plugin.methods.verifyCredential(lc as never, ldVc as never, {
            challenge: 'abc',
            domain: 'verifier.example.com',
        });

        const [, optionsArg] = chained.mock.calls[0];
        expect(optionsArg).toEqual({
            challenge: 'abc',
            domain: 'verifier.example.com',
        });
    });

    it('does NOT route to verifySdJwtVc when proof.jwt is missing (defensive)', async () => {
        const chained = jest.fn(async () => ({ checks: [], warnings: [], errors: [] }));
        const lc = buildLearnCard(chained);
        const plugin = getSdJwtVcPlugin(lc);
        const malformed = { ...sdJwtVc, proof: { type: 'SdJwtCompactProof' } };

        await plugin.methods.verifyCredential(lc as never, malformed as never);

        expect(mockVerify).not.toHaveBeenCalled();
        expect(chained).toHaveBeenCalledTimes(1);
    });

    it('handles credentials with array-valued proof (multi-proof VC)', async () => {
        const chained = jest.fn();
        const lc = buildLearnCard(chained);
        const plugin = getSdJwtVcPlugin(lc);
        const arrayProofVc = { ...sdJwtVc, proof: [sdJwtVc.proof] };

        await plugin.methods.verifyCredential(lc as never, arrayProofVc as never);

        expect(mockVerify).toHaveBeenCalledWith(lc, sdJwtVc.proof.jwt, {});
        expect(chained).not.toHaveBeenCalled();
    });

    it('does NOT route SD-JWT-specific path when proof.type is JwtProof2020 (existing path stays untouched)', async () => {
        const chained = jest.fn(async () => ({
            checks: ['proof'],
            warnings: [],
            errors: [],
        }));
        const lc = buildLearnCard(chained);
        const plugin = getSdJwtVcPlugin(lc);
        const jwtVc = {
            ...ldVc,
            proof: {
                type: 'JwtProof2020',
                jwt: 'eyJhbGciOiJFZERTQSJ9.payload.sig',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:key:zABC#zABC',
            },
        };

        await plugin.methods.verifyCredential(lc as never, jwtVc as never);

        expect(mockVerify).not.toHaveBeenCalled();
        expect(chained).toHaveBeenCalledTimes(1);
    });
});
