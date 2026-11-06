import { describe, expect, it } from 'vitest';
import { CredentialRefreshReceiptValidator } from '@learncard/types';
import { assertManagedCredentialBinding } from '../src/credential-refresh';

const managed = {
    id: 'https://network.example/refresh/one',
    type: 'LearnCardCredentialRefresh2026',
    authorization: { type: 'LearnCardDIDAuth' },
};
const other = { id: 'https://issuer.example/refresh/one', type: '1EdTechCredentialRefresh' };
const credential = {
    id: 'urn:uuid:credential',
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:holder' },
};

describe('exact receipt refresh binding', () => {
    const legacyReceipt = CredentialRefreshReceiptValidator.parse({
        refreshId: 'one',
        credentialId: credential.id,
        issuerDid: credential.issuer,
        holderDid: credential.credentialSubject.id,
        encryptionMode: 'network',
        refreshService: managed,
        refreshServiceBinding: 'managed-entry',
    });

    it.each([managed, [managed], [managed, other]].map(refreshService => ({ refreshService })))(
        'accepts legacy managed entry %#',
        ({ refreshService }) => {
            expect(() =>
                assertManagedCredentialBinding({ ...credential, refreshService }, legacyReceipt)
            ).not.toThrow();
        }
    );

    it.each([
        { refreshService: [managed, managed] },
        { refreshService: [managed, { type: managed.type }] },
        { refreshService: [other] },
        { refreshService: { ...managed, id: 'https://different.example' } },
        { refreshService: { ...managed, authorization: { type: 'Other' } } },
        { refreshService: undefined },
    ])('rejects invalid legacy managed binding %#', ({ refreshService }) => {
        expect(() =>
            assertManagedCredentialBinding({ ...credential, refreshService }, legacyReceipt)
        ).toThrow('MANAGED_CREDENTIAL_BINDING_MISMATCH');
    });

    it.each([managed, [managed], [managed, other]].map(refreshService => ({ refreshService })))(
        'round-trips the signed shape %#',
        ({ refreshService }) => {
            const receipt = CredentialRefreshReceiptValidator.parse({
                refreshId: 'one',
                credentialId: credential.id,
                issuerDid: credential.issuer,
                holderDid: credential.credentialSubject.id,
                encryptionMode: 'holder',
                refreshService: JSON.parse(JSON.stringify(refreshService)),
            });
            expect(receipt.refreshService).toEqual(refreshService);
            expect(() =>
                assertManagedCredentialBinding({ ...credential, refreshService }, receipt)
            ).not.toThrow();
            const changed = Array.isArray(refreshService) ? managed : [managed];
            expect(() =>
                assertManagedCredentialBinding({ ...credential, refreshService: changed }, receipt)
            ).toThrow('MANAGED_CREDENTIAL_BINDING_MISMATCH');
            if (Array.isArray(refreshService) && refreshService.length > 1) {
                for (const altered of [
                    [other, managed],
                    [managed],
                    [managed, { ...other, id: 'https://changed.example' }],
                ]) {
                    expect(() =>
                        assertManagedCredentialBinding(
                            { ...credential, refreshService: altered },
                            receipt
                        )
                    ).toThrow('MANAGED_CREDENTIAL_BINDING_MISMATCH');
                }
            }
        }
    );
});
