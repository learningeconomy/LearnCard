import {
    getCredentialIssuerDocumentURIs,
    getIssuanceDocumentURIs,
    getIssuerAuthorizationDocumentURIs,
    getVerificationMethodDocumentURIs,
} from './helpers';

describe('DIDKit verification document resolution', () => {
    const credential = {
        issuer: { id: 'https://issuer.example/identity' },
        proof: [
            {
                verificationMethod: 'https://issuer.example/keys#signing-key',
            },
            {
                verificationMethod: 'did:key:z6Mktest#z6Mktest',
            },
        ],
    };

    it('resolves an HTTPS issuer document for issuance', () => {
        expect(getCredentialIssuerDocumentURIs(credential)).toEqual([
            'https://issuer.example/identity',
        ]);
    });

    it('resolves an HTTPS verification method document without its fragment', () => {
        expect(getVerificationMethodDocumentURIs(credential)).toEqual([
            'https://issuer.example/keys',
        ]);
    });

    it('only resolves the issuer for an explicit authorization check', () => {
        expect(getIssuerAuthorizationDocumentURIs(credential, ['proof'])).toEqual([]);
        expect(
            getIssuerAuthorizationDocumentURIs(credential, ['proof', 'issuerAuthorization'])
        ).toEqual(['https://issuer.example/identity']);
    });

    describe('issuance', () => {
        const unsigned = { issuer: 'https://issuer.example/identity' };

        it('resolves the requested verification method document before a proof exists', () => {
            expect(
                getIssuanceDocumentURIs(unsigned, {
                    verificationMethod: 'https://issuer.example/keys#k',
                })
            ).toEqual(['https://issuer.example/identity', 'https://issuer.example/keys']);
        });

        it('does not repeat a document the issuer or an existing proof already names', () => {
            expect(
                getIssuanceDocumentURIs(credential, {
                    verificationMethod: 'https://issuer.example/keys#another-key',
                })
            ).toEqual(['https://issuer.example/identity', 'https://issuer.example/keys']);
            expect(
                getIssuanceDocumentURIs(unsigned, {
                    verificationMethod: 'https://issuer.example/identity#k',
                })
            ).toEqual(['https://issuer.example/identity']);
        });

        it('keeps current discovery when no HTTP(S) verification method is requested', () => {
            expect(getIssuanceDocumentURIs(unsigned)).toEqual(['https://issuer.example/identity']);
            expect(
                getIssuanceDocumentURIs(unsigned, {
                    verificationMethod: 'did:key:z6Mktest#z6Mktest',
                })
            ).toEqual(['https://issuer.example/identity']);
        });
    });
});
