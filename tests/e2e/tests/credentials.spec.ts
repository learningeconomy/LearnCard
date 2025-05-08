import { describe, test, expect } from 'vitest';

import { getLearnCardForUser } from './helpers/learncard.helpers';
import { UnsignedVC } from '@learncard/types';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

describe('Credentials', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can issue credentials that others can verify', async () => {
        const c = await getLearnCardForUser('c');

        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const verification = await c.invoke.verifyCredential(vc);

        expect(verification.warnings).toHaveLength(0);
        expect(verification.errors).toHaveLength(0);
    });

    test('Users can issue VC 2.0 credentials that others can verify', async () => {
        const c = await getLearnCardForUser('c');

        const unsignedVc: UnsignedVC = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            id: 'http://university.example/credentials/3732',
            type: ['VerifiableCredential', 'ExampleDegreeCredential'],
            issuer: a.id.did(),
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 3_600_000).toISOString(),
            credentialSubject: { id: b.id.did() },
        };
        const vc = await a.invoke.issueCredential(unsignedVc);

        const verification = await c.invoke.verifyCredential(vc);

        expect(verification.warnings).toHaveLength(0);
        expect(verification.errors).toHaveLength(0);
    });

    test('Users can send/receive credentials via LCN', async () => {
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.invoke.sendCredential('testb', vc);

        const incomingCreds = await b.invoke.getIncomingCredentials();

        expect(incomingCreds).toHaveLength(1);
        expect(incomingCreds[0].uri).toEqual(uri);

        const resolvedVc = await b.read.get(incomingCreds[0].uri);

        expect(resolvedVc).toEqual(vc);

        await b.invoke.acceptCredential(uri);

        expect(await a.invoke.getSentCredentials()).toHaveLength(1);
        expect(await b.invoke.getReceivedCredentials()).toHaveLength(1);
        expect(await b.invoke.getIncomingCredentials()).toHaveLength(0);
    });

    test('Users can store and recall credentials', async () => {
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.store.LearnCloud.uploadEncrypted!(vc);
        await a.index.LearnCloud.add({ id: 'test', uri });

        const records = await a.index.LearnCloud.get();

        expect(records).toHaveLength(1);
        expect(records[0].uri).toEqual(uri);
        expect(await a.read.get(uri)).toEqual(vc);

        // Make sure it's bespoke per user
        const bRecords = await b.index.LearnCloud.get();
        expect(bRecords).toHaveLength(0);
        expect(await b.read.get(uri)).toBeUndefined();
    });
});
