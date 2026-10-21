import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { initLearnCard } from '@learncard/init';
import { base58btc } from 'multiformats/bases/base58';
import type { DidDocument, VC, VerificationMethod } from '@learncard/types';
import {
    encryptCredentialForRecipients,
    resolveRecipientEncrypters,
} from './recipient-encryption.helpers';

type KeyMethod = Exclude<VerificationMethod, string>;
const didkit = readFileSync(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);
let holder: Awaited<ReturnType<typeof makeCard>>;
let rotated: Awaited<ReturnType<typeof makeCard>>;
let holderKey: KeyMethod;
let rotatedKey: KeyMethod;
const makeCard = (seed: string) => initLearnCard({ didkit, seed });
const payload = { name: 'Encrypted credential' } as VC;
const did = 'did:web:holder.example';
const documentFor = (key: KeyMethod): DidDocument => ({
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: did,
    keyAgreement: [key],
});

beforeAll(async () => {
    holder = await makeCard('a'.repeat(64));
    rotated = await makeCard('b'.repeat(64));
    holderKey = (await holder.invoke.resolveDid(holder.id.did())).keyAgreement![0] as KeyMethod;
    rotatedKey = (await rotated.invoke.resolveDid(rotated.id.did())).keyAgreement![0] as KeyMethod;
});

describe('recipient key snapshots', () => {
    it('uses the checked key after rotation and produces a DIDKit-decryptable DAG-JWE', async () => {
        const doc = documentFor({ ...holderKey, id: '#before-rotation' });
        const resolveDid = vi.fn(async () => doc);
        const encrypters = await resolveRecipientEncrypters([did, did], resolveDid);
        doc.keyAgreement = [{ ...rotatedKey, id: '#after-rotation' }];
        const jwe = await encryptCredentialForRecipients(payload, encrypters);
        expect(resolveDid).toHaveBeenCalledTimes(1);
        expect(jwe.recipients).toHaveLength(1);
        expect(await holder.invoke.decryptDagJwe(jwe)).toEqual(payload);
        expect(await rotated.invoke.decryptDagJwe(jwe).catch(() => undefined)).toBeFalsy();
    });

    it.each(['#key', '/keys/1?version=2#key', 'did:web:holder.example/keys/1?version=2#key'])(
        'supports referenced agreement keys with ID %s without matching generated kids',
        async id => {
            const key = { ...holderKey, id };
            const doc = { ...documentFor(key), keyAgreement: [id], verificationMethod: [key] };
            const keys = await resolveRecipientEncrypters([did], async () => doc);
            const jwe = await encryptCredentialForRecipients(payload, keys);
            expect(await holder.invoke.decryptDagJwe(jwe)).toEqual(payload);
        }
    );

    it.each(['base58', 'jwk'])(
        'supports X25519 %s public keys and includes every recipient',
        async encoding => {
            const bytes = base58btc.decode(holderKey.publicKeyMultibase!).slice(2);
            const key: KeyMethod = {
                id: '#encryption',
                controller: did,
                type: encoding === 'base58' ? 'X25519KeyAgreementKey2019' : 'JsonWebKey2020',
                ...(encoding === 'base58'
                    ? { publicKeyBase58: base58btc.baseEncode(bytes) }
                    : {
                          publicKeyJwk: {
                              kty: 'OKP',
                              crv: 'X25519',
                              x: Buffer.from(bytes).toString('base64url'),
                          },
                      }),
            };
            const keys = await resolveRecipientEncrypters([did, rotated.id.did()], async target =>
                target === did ? documentFor(key) : documentFor(rotatedKey)
            );
            const jwe = await encryptCredentialForRecipients(payload, keys);
            expect(jwe.recipients).toHaveLength(2);
            expect(await holder.invoke.decryptDagJwe(jwe)).toEqual(payload);
            expect(await rotated.invoke.decryptDagJwe(jwe)).toEqual(payload);
        }
    );

    it('rejects missing, unresolved, or unsupported keys before issuance', async () => {
        await expect(
            resolveRecipientEncrypters([did], async () => {
                throw new Error('not found');
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            resolveRecipientEncrypters([did], async () =>
                documentFor({
                    id: '#unsupported',
                    controller: did,
                    type: 'JsonWebKey2020',
                    publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'invalid' },
                })
            )
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('resolves a relative relationship against an absolute verification-method ID', async () => {
        const key = { ...holderKey, id: `${did}/keys/1?version=2#key` };
        const doc = {
            ...documentFor(key),
            keyAgreement: ['/keys/1?version=2#key'],
            verificationMethod: [key],
        };
        const encrypters = await resolveRecipientEncrypters([did], async () => doc);
        expect(
            await holder.invoke.decryptDagJwe(
                await encryptCredentialForRecipients(payload, encrypters)
            )
        ).toEqual(payload);
    });

    it('rejects a partial encryption result if an encrypter omits its recipient', async () => {
        const encrypters = await resolveRecipientEncrypters([did, rotated.id.did()], async target =>
            documentFor(target === did ? holderKey : rotatedKey)
        );
        encrypters[1] = { ...encrypters[1]!, encryptCek: undefined };
        await expect(encryptCredentialForRecipients(payload, encrypters)).rejects.toThrow(
            'Encryption did not cover every recipient key'
        );
    });
});
