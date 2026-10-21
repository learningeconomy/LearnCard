import {
    AllocateCredentialRefreshInputValidator,
    PublishCredentialRefreshInputValidator,
    SendBoostResponseValidator,
} from '@learncard/types';

const unsignedCredential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:holder' },
};

const signedCredential = {
    ...unsignedCredential,
    proof: {
        type: 'DataIntegrityProof',
        created: '2026-09-03T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        jws: 'test-signature',
    },
};

describe('Managed credential refresh contracts', () => {
    it.each([
        ['DID-only holder', { did: 'did:example:holder' }, true],
        ['string profile ID', { did: 'did:example:holder', profileId: 'synthetic-profile' }, true],
        ['explicit null profile ID', { did: 'did:example:holder', profileId: null }, false],
    ])('preserves the optional-but-nonnullable allocation contract: %s', (_name, holder, valid) => {
        const result = AllocateCredentialRefreshInputValidator.safeParse({
            credentialId: 'urn:uuid:synthetic-credential',
            holder,
        });
        expect(result.success).toBe(valid);
        if (result.success) expect(result.data.holder).toEqual(holder);
    });

    it('strips credential contents from issuance receipts', () => {
        const response = SendBoostResponseValidator.safeParse({
            type: 'boost',
            uri: 'https://localhost%3A3000/boost/abc',
            credentialUri: 'https://localhost%3A3000/credentials/def',
            activityId: 'activity-1',
            refresh: {
                refreshId: 'refresh-1',
                refreshService: {
                    id: 'https://localhost%3A3000/refresh/refresh-1',
                    type: 'LearnCardCredentialRefresh2026',
                    authorization: { type: 'LearnCardDIDAuth' },
                },
                credentialId: 'urn:uuid:credential-1',
                issuerDid: 'did:key:issuer',
                holderDid: 'did:key:holder',
                // Unknown keys ride along in the input but must be stripped by the
                // receipt validator, never silently persisted or returned.
                credentialSubject: { id: 'did:key:holder' },
            },
        });

        expect(response.success).toBe(true);

        if (response.success) {
            expect(response.data.refresh).toBeDefined();
            expect(response.data.refresh).not.toHaveProperty('credentialSubject');
            expect(response.data.refresh!.refreshId).toBe('refresh-1');
        }
    });

    it.each([
        [
            'issuer-signed with signing-authority fields',
            {
                mode: 'issuer-signed',
                refreshId: 'refresh-1',
                signedCredential,
                credential: unsignedCredential,
                signingAuthority: { type: 'SigningAuthority' },
            },
        ],
        [
            'signing-authority with a signed credential',
            {
                mode: 'signing-authority',
                refreshId: 'refresh-1',
                credential: unsignedCredential,
                signingAuthority: { type: 'SigningAuthority' },
                signedCredential,
            },
        ],
    ])('rejects mixed publication payloads: %s', (_name, input) => {
        expect(PublishCredentialRefreshInputValidator.safeParse(input).success).toBe(false);
    });
});
