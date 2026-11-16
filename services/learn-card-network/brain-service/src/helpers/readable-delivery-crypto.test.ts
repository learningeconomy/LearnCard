import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';
import type { UnsignedVC, VC } from '@learncard/types';
import { setBitstringStatusListBit } from '@learncard/helpers';
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
import { verifyDeliveryCredential } from './readable-delivery-verifier.helpers';

describe('readable delivery real crypto path', () => {
    it('verifies did:web proofs and signed status lists, rejects revocation and blocks private fetches', async () => {
        const wallet = await getEmptyLearnCard();
        const key = wallet.invoke.generateEd25519KeyFromBytes(randomBytes(32));
        const keyDid = wallet.invoke.keyToDid('key', key);
        const keyDoc = await wallet.invoke.resolveDid(keyDid);
        let statusList: VC | undefined;
        let reads = 0;
        const server = createServer((request, response) => {
            reads++;
            response.setHeader('Content-Type', 'application/json');
            response.end(
                JSON.stringify(request.url === '/status-list.json' ? statusList : document)
            );
        });
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        const origin = `http://localhost:${(server.address() as AddressInfo).port}`;
        const issuer = `did:web:localhost%3A${(server.address() as AddressInfo).port}:users:issuer`;
        const vm = `${issuer}#key`;
        const publicKey = keyDoc.verificationMethod![0]!;
        if (typeof publicKey === 'string') throw new Error('Expected embedded verification method');
        const document = {
            '@context': ['https://www.w3.org/ns/did/v1'],
            id: issuer,
            verificationMethod: [{ ...publicKey, id: vm, controller: issuer }],
            assertionMethod: [vm],
        };
        const sign = (credential: UnsignedVC): Promise<VC> =>
            wallet.invoke.issueCredential(
                credential,
                {
                    type: 'DataIntegrityProof',
                    cryptosuite: 'eddsa-rdfc-2022',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: vm,
                },
                key
            );
        const list = async (revoked: boolean): Promise<VC> => {
            const bits = Buffer.alloc(16384);
            if (revoked) setBitstringStatusListBit(bits, 0, true);
            return sign({
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                id: `${origin}/status-list.json`,
                type: ['VerifiableCredential', 'BitstringStatusListCredential'],
                issuer,
                validFrom: '2026-01-01T00:00:00Z',
                credentialSubject: {
                    type: 'BitstringStatusList',
                    statusPurpose: 'revocation',
                    encodedList: `u${gzipSync(bits).toString('base64url')}`,
                },
            });
        };
        try {
            statusList = await list(false);
            const credential = await sign({
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
                issuer,
                validFrom: '2026-01-01T00:00:00Z',
                credentialSubject: { id: keyDid },
                credentialStatus: {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: '0',
                    statusListCredential: `${origin}/status-list.json`,
                },
            });
            expect(await verifyDeliveryCredential(credential, origin)).toEqual({
                proof: 'valid',
                status: 'valid',
                dates: 'valid',
            });
            statusList = await list(true);
            expect(await verifyDeliveryCredential(credential, origin)).toMatchObject({
                proof: 'valid',
                status: 'invalid',
            });
            statusList = await list(false);
            statusList.credentialSubject = {
                ...statusList.credentialSubject,
                encodedList: `u${gzipSync(Buffer.alloc(16384, 1)).toString('base64url')}`,
            };
            expect((await verifyDeliveryCredential(credential, origin)).status).toBe('invalid');
            const before = reads;
            expect((await verifyDeliveryCredential(credential)).proof).toBe('unavailable');
            expect(reads).toBe(before);
        } finally {
            server.closeAllConnections();
            await new Promise<void>((resolve, reject) =>
                server.close(error => (error ? reject(error) : resolve()))
            );
        }
    }, 20_000);
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
        expect(await verifyDeliveryCredential(credential)).toEqual({
            proof: 'valid',
            status: 'not_applicable',
            dates: 'valid',
        });
        expect(
            (
                await verifyDeliveryCredential({
                    ...credential,
                    credentialSubject: { id: 'did:key:edited' },
                })
            ).proof
        ).toBe('invalid');
        expect(
            (
                await verifyDeliveryCredential({
                    ...credential,
                    expirationDate: '2020-01-01T00:00:00Z',
                })
            ).dates
        ).toBe('invalid');
        const wrongKey = wallet.invoke.generateEd25519KeyFromBytes(randomBytes(32));
        expect(await wallet.invoke.decryptDagJwe(ciphertext, [wrongKey])).toBeFalsy();
    });
});
