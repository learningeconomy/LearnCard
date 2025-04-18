import { describe, test, expect } from 'vitest';

import { toUint8Array } from 'hex-lite';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let b: LearnCard;

describe('Encryption', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can encrypt and decrypt VCs', async () => {
        const vc = await a.invoke.issueCredential(a.invoke.getTestVc(b.id.did()));
        const jwe = await a.invoke.createDagJwe(vc, [b.id.did()]);

        expect(await b.invoke.decryptDagJwe(jwe)).toEqual(vc);
        expect(await a.invoke.decryptDagJwe(jwe)).toEqual(vc);
    });

    test('Custom decryption JWK', async () => {
        const customJwk = a.invoke.generateEd25519KeyFromBytes(toUint8Array('0'.repeat(64)));
        const customDidKey = a.invoke.keyToDid('key', customJwk);
        const customDidDoc = await a.invoke.resolveDid(customDidKey);

        await a.invoke.addDidMetadata({
            verificationMethod: customDidDoc.verificationMethod,
            keyAgreement: customDidDoc.keyAgreement,
        });

        const vc = await a.invoke.issueCredential(a.invoke.getTestVc(b.id.did()));
        const jwe = await a.invoke.createDagJwe(vc);

        expect(await a.invoke.decryptDagJwe(jwe)).toEqual(vc);
        expect(await b.invoke.decryptDagJwe(jwe, [customJwk])).toEqual(vc);
    });
});
