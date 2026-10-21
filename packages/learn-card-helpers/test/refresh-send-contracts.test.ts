import { describe, it, expect } from 'vitest';

import {
    ManagedCredentialRefreshReceiptValidator,
    SendBoostInputValidator,
    SendBoostResponseValidator,
} from '@learncard/types';

const managedRefreshService = {
    id: 'https://network.learncard.test/api/credential-refreshes/refresh-123',
    type: 'LearnCardCredentialRefresh2026' as const,
    authorization: { type: 'LearnCardDIDAuth' },
};

const receipt = {
    refreshId: 'refresh-123',
    refreshService: managedRefreshService,
    credentialId: 'urn:uuid:4564cde0-9b3a-4b7e-9d2f-2f4a1e6f8a10',
    issuerDid: 'did:web:issuer',
    holderDid: 'did:web:holder',
    credentialStatus: {
        type: 'BitstringStatusListEntry',
        statusPurpose: 'revocation',
        statusListIndex: '94567',
        statusListCredential: 'https://example.com/status/3#list',
    },
};

const validBaseInput = {
    type: 'boost' as const,
    recipient: 'did:web:holder',
    templateUri: 'https://network.learncard.test/templates/boost-1',
};

describe('ManagedCredentialRefreshReceiptValidator', () => {
    it('parses a complete receipt including a credential status descriptor', () => {
        const parsed = ManagedCredentialRefreshReceiptValidator.parse(receipt);

        expect(parsed.refreshId).toBe('refresh-123');
        expect(parsed.refreshService.type).toBe('LearnCardCredentialRefresh2026');
        expect(parsed.credentialId).toBe('urn:uuid:4564cde0-9b3a-4b7e-9d2f-2f4a1e6f8a10');
        expect(parsed.issuerDid).toBe('did:web:issuer');
        expect(parsed.holderDid).toBe('did:web:holder');
        expect(parsed.credentialStatus).toEqual(receipt.credentialStatus);
    });

    it('allows an omitted credentialStatus and array-form status', () => {
        const { credentialStatus: _omitted, ...withoutStatus } = receipt;

        expect(
            ManagedCredentialRefreshReceiptValidator.parse(withoutStatus).credentialStatus
        ).toBeUndefined();

        const arrayForm = {
            ...withoutStatus,
            credentialStatus: [receipt.credentialStatus],
        };

        expect(ManagedCredentialRefreshReceiptValidator.parse(arrayForm).credentialStatus).toEqual([
            receipt.credentialStatus,
        ]);
    });

    it('rejects malformed receipts', () => {
        // Missing refreshId
        const { refreshId: _refreshId, ...noRefreshId } = receipt;
        expect(ManagedCredentialRefreshReceiptValidator.safeParse(noRefreshId).success).toBe(false);

        // Empty credentialId
        expect(
            ManagedCredentialRefreshReceiptValidator.safeParse({
                ...receipt,
                credentialId: '',
            }).success
        ).toBe(false);

        // Non-string issuerDid
        expect(
            ManagedCredentialRefreshReceiptValidator.safeParse({ ...receipt, issuerDid: 42 })
                .success
        ).toBe(false);

        // Wrong refreshService type (standard service is not a managed receipt service)
        expect(
            ManagedCredentialRefreshReceiptValidator.safeParse({
                ...receipt,
                refreshService: {
                    id: 'https://example.com/refresh',
                    type: '1EdTechCredentialRefresh',
                },
            }).success
        ).toBe(false);

        // Missing holderDid
        const { holderDid: _holderDid, ...noHolder } = receipt;
        expect(ManagedCredentialRefreshReceiptValidator.safeParse(noHolder).success).toBe(false);
    });

    it('does not retain unrelated credential content (receipts are metadata only)', () => {
        const smuggled = {
            ...receipt,
            credentialSubject: { id: 'did:web:holder' },
            proof: { type: 'DataIntegrityProof' },
        } as Record<string, unknown>;

        const parsed = ManagedCredentialRefreshReceiptValidator.parse(smuggled) as Record<
            string,
            unknown
        >;

        expect(parsed).not.toHaveProperty('credentialSubject');
        expect(parsed).not.toHaveProperty('proof');
    });
});

describe('SendBoostInputValidator refresh option', () => {
    it('parses with refresh omitted', () => {
        const parsed = SendBoostInputValidator.parse(validBaseInput);

        expect(parsed.refresh).toBeUndefined();
    });

    it('parses with refresh false and refresh true', () => {
        expect(SendBoostInputValidator.parse({ ...validBaseInput, refresh: false }).refresh).toBe(
            false
        );
        expect(SendBoostInputValidator.parse({ ...validBaseInput, refresh: true }).refresh).toBe(
            true
        );
    });

    it('rejects non-boolean refresh values', () => {
        expect(
            SendBoostInputValidator.safeParse({ ...validBaseInput, refresh: 'yes' }).success
        ).toBe(false);
    });
});

describe('SendBoostResponseValidator refresh receipt', () => {
    const baseResponse = {
        type: 'boost' as const,
        credentialUri: 'https://network.learncard.test/credentials/uri-1',
        uri: 'https://network.learncard.test/boosts/boost-1',
        activityId: 'activity-123',
    };

    it('retains a receipt through parsing without dropping unrelated response fields', () => {
        const parsed = SendBoostResponseValidator.parse({ ...baseResponse, refresh: receipt });

        expect(parsed.uri).toBe(baseResponse.uri);
        expect(parsed.credentialUri).toBe(baseResponse.credentialUri);
        expect(parsed.activityId).toBe(baseResponse.activityId);
        expect(parsed.refresh).toEqual(receipt);
    });

    it('leaves refresh undefined for a normal send response', () => {
        const parsed = SendBoostResponseValidator.parse(baseResponse);

        expect(parsed.refresh).toBeUndefined();
    });

    it('rejects a malformed receipt', () => {
        const { holderDid: _holderDid, ...malformed } = receipt;

        expect(
            SendBoostResponseValidator.safeParse({ ...baseResponse, refresh: malformed }).success
        ).toBe(false);
    });
});
