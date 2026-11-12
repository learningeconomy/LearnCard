import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { JWKWithPrivateKeyValidator } from '@learncard/types';
vi.mock('@environment', async importOriginal => ({
    environment: {
        ...(await importOriginal<typeof import('@environment')>()).environment,
        SKIP_DIDKIT_NAPI: true,
    },
}));
import { getEmptyLearnCard } from './learnCard.helpers';
import { createDeliveryKeyCustody } from './readable-delivery-keys.helpers';

describe('readable delivery real crypto path', () => {
    it('unwraps an agent key and decrypts a signed DAG-JWE without caching a seeded wallet', async () => {
        const wallet = await getEmptyLearnCard();
        const key = wallet.invoke.generateEd25519KeyFromBytes(randomBytes(32));
        const did = wallet.invoke.keyToDid('key', key);
        const credential = await wallet.invoke.issueCredential(
            {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: did,
                issuanceDate: '2026-01-01T00:00:00Z',
                credentialSubject: { id: did },
            },
            {
                proofPurpose: 'assertionMethod',
                verificationMethod: await wallet.invoke.keyToVerificationMethod('key', key),
            },
            key
        );
        const ciphertext = await wallet.invoke.createDagJwe(credential, [did]);
        const custody = createDeliveryKeyCustody({
            local: true,
            localKey: randomBytes(32).toString('hex'),
        });
        const binding = {
            profileId: 'synthetic-recipient',
            domain: 'synthetic.example',
            version: 1,
        };
        const envelope = await custody.encrypt(JSON.stringify(key), binding);
        const unwrapped = JWKWithPrivateKeyValidator.parse(
            JSON.parse(await custody.decrypt(envelope, binding))
        );
        const decrypted = await wallet.invoke.decryptDagJwe(ciphertext, [unwrapped]);
        expect(decrypted).toEqual(credential);
        const verification = await wallet.invoke.verifyCredential(credential, {
            checks: ['proof'],
        });
        expect(verification.errors).toEqual([]);
        expect(verification.checks).toContain('proof');
        const wrongKey = wallet.invoke.generateEd25519KeyFromBytes(randomBytes(32));
        expect(await wallet.invoke.decryptDagJwe(ciphertext, [wrongKey])).toBeFalsy();
    });
});
