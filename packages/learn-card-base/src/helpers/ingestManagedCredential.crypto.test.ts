import { beforeAll, describe, expect, it } from 'vitest';
import { generateLearnCard } from '@learncard/core';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import { getDidKitPlugin } from '@learncard/didkit-plugin-node';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import { getEncryptionPlugin } from '@learncard/encryption-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import type { CredentialRefreshReceipt, JWE } from '@learncard/types';
import { ingestManagedCredential } from './ingestManagedCredential';

const createWallet = async (seed: string) => {
    const crypto = await (await generateLearnCard()).addPlugin(CryptoPlugin);
    const didkit = await crypto.addPlugin(await getDidKitPlugin());
    const didkey = await didkit.addPlugin(await getDidKeyPlugin(didkit, seed, 'key'));
    const encryption = await didkey.addPlugin(await getEncryptionPlugin(didkey));
    return encryption.addPlugin(getVCPlugin(encryption));
};

describe('managed ingestion with native signatures and JWE', () => {
    let issuer: Awaited<ReturnType<typeof createWallet>>;
    let holder: Awaited<ReturnType<typeof createWallet>>;
    let receipt: CredentialRefreshReceipt;
    let encrypted: JWE;

    beforeAll(async () => {
        issuer = await createWallet('a'.repeat(64));
        holder = await createWallet('b'.repeat(64));
        receipt = {
            refreshId: 'crypto-1',
            credentialId: 'urn:uuid:crypto-1',
            issuerDid: issuer.id.did(),
            holderDid: holder.id.did(),
            encryptionMode: 'network',
            refreshService: {
                id: 'https://network.example/refresh/crypto-1',
                type: 'LearnCardCredentialRefresh2026',
                authorization: { type: 'LearnCardDIDAuth' },
            },
        };
        const signed = await issuer.invoke.issueCredential({
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                {
                    LearnCardCredentialRefresh2026:
                        'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
                    authorization: {
                        '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                        '@context': {
                            LearnCardDIDAuth:
                                'https://docs.learncard.com/definitions#LearnCardDIDAuth',
                        },
                    },
                },
            ],
            id: receipt.credentialId,
            issuer: receipt.issuerDid,
            type: ['VerifiableCredential'],
            validFrom: '2026-01-01T00:00:00Z',
            credentialSubject: { id: receipt.holderDid },
            refreshService: receipt.refreshService,
        });
        encrypted = await issuer.invoke.createDagJwe(signed, [holder.id.did()]);
    });

    const ingest = (jwe: JWE, baseline = receipt) =>
        ingestManagedCredential(
            {
                read: { get: async () => holder.invoke.decryptDagJwe(jwe) },
                invoke: {
                    getCredentialRefreshReceipt: async () => baseline,
                    verifyCredential: credential => holder.invoke.verifyCredential(credential),
                },
            },
            'delivery'
        );

    it('decrypts and verifies the real signed payload', async () => {
        expect((await ingest(encrypted)).credential.id).toBe(receipt.credentialId);
    });
    it('rejects tampered ciphertext', async () => {
        await expect(ingest({ ...encrypted, ciphertext: 'AAAA' })).rejects.toThrow();
    });
    it('does not treat spoofed recipient kids as successful decryption', async () => {
        const other = await createWallet('c'.repeat(64));
        const wrong = await other.invoke.createDagJwe({ secret: 'not-for-holder' });
        const spoofed = {
            ...wrong,
            recipients: wrong.recipients.map(recipient => ({
                ...recipient,
                header: { ...recipient.header, kid: encrypted.recipients[0]?.header.kid },
            })),
        };
        await expect(ingest(spoofed)).rejects.toThrow();
    });
    it('rejects a real valid signature bound to a different receipt id', async () => {
        await expect(
            ingest(encrypted, { ...receipt, credentialId: 'urn:uuid:other' })
        ).rejects.toThrow();
    });
    it('rejects a switched canonical refresh service', async () => {
        await expect(
            ingest(encrypted, {
                ...receipt,
                refreshService: {
                    ...receipt.refreshService,
                    id: 'https://network.example/refresh/other',
                },
            })
        ).rejects.toThrow();
    });
});
