import {
    getCredentialIssuerDocumentURIs,
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
});
