import { describe, test, expect } from 'vitest';

import { NetworkLearnCardFromSeed } from '@learncard/init';

import { getLearnCardForUser } from './helpers/learncard.helpers';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

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
});
