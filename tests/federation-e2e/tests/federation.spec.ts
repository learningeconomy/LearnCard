import { describe, test, expect, beforeEach } from 'vitest';

import {
    getLearnCardForUserOnBrainA,
    getLearnCardForUserOnBrainB,
    type BrainALearnCard,
    type BrainBLearnCard,
} from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

const clearIncomingCredentials = async (user: BrainALearnCard | BrainBLearnCard) => {
    const incoming = await user.invoke.getIncomingCredentials();
    for (const cred of incoming) {
        if (cred.uri.startsWith('federated-inbox:')) {
            continue;
        }
        await user.invoke.acceptCredential(cred.uri);
    }
};

describe('Federation', () => {
    describe('Trust Registry', () => {
        test('Brain-a should trust brain-b', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');

            const isTrusted = await userA.invoke.isServiceTrusted('did:web:localhost%3A4001');

            expect(isTrusted).toBe(true);
        });

        test('Brain-b should trust brain-a', async () => {
            const userB = await getLearnCardForUserOnBrainB('b');

            const isTrusted = await userB.invoke.isServiceTrusted('did:web:localhost%3A4000');

            expect(isTrusted).toBe(true);
        });

        test('Each service should trust itself', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');
            const userB = await getLearnCardForUserOnBrainB('b');

            const selfTrustedA = await userA.invoke.isServiceTrusted('did:web:localhost%3A4000');
            const selfTrustedB = await userB.invoke.isServiceTrusted('did:web:localhost%3A4001');

            expect(selfTrustedA).toBe(true);
            expect(selfTrustedB).toBe(true);
        });

        test('Should list trusted services', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');

            const trustedServices = await userA.invoke.getTrustedServices();

            expect(trustedServices.length).toBeGreaterThanOrEqual(2);

            const hasSelf = trustedServices.some(s => s.did === 'did:web:localhost%3A4000');
            const hasBrainB = trustedServices.some(s => s.did === 'did:web:localhost%3A4001');

            expect(hasSelf).toBe(true);
            expect(hasBrainB).toBe(true);
        });
    });

    describe('DID Resolution', () => {
        test('Should resolve DID to UniversalInboxService endpoint', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');
            const userB = await getLearnCardForUserOnBrainB('b');

            const didADoc = await userA.invoke.resolveDid(userA.id.did());
            const didBDoc = await userB.invoke.resolveDid(userB.id.did());

            expect(didADoc.service).toBeDefined();
            expect(didBDoc.service).toBeDefined();

            const inboxServiceA = didADoc.service?.find(s => {
                const type = Array.isArray(s.type) ? s.type[0] : s.type;
                return type === 'UniversalInboxService';
            });
            const inboxServiceB = didBDoc.service?.find(s => {
                const type = Array.isArray(s.type) ? s.type[0] : s.type;
                return type === 'UniversalInboxService';
            });

            expect(inboxServiceA).toBeDefined();
            expect(inboxServiceB).toBeDefined();
            expect(inboxServiceA?.serviceEndpoint).toContain('localhost:4000');
            expect(inboxServiceB?.serviceEndpoint).toContain('localhost:4001');
        });
    });

    describe('Federated Inbox', () => {
        beforeEach(async () => {
            const userB = await getLearnCardForUserOnBrainB('b');
            const userC = await getLearnCardForUserOnBrainB('c');
            await clearIncomingCredentials(userB);
            await clearIncomingCredentials(userC);
        });

        test('User on brain-a can send credential to user on brain-b via DID', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');
            const userB = await getLearnCardForUserOnBrainB('b');

            const initialCount = (await userB.invoke.getIncomingCredentials()).length;

            const unsignedVc = userA.invoke.getTestVc(userB.id.did());
            const vc = await userA.invoke.issueCredential(unsignedVc);

            const result = await userA.invoke.sendCredential(userB.id.did(), vc);

            expect(result).toBeDefined();

            const incoming = await userB.invoke.getIncomingCredentials();

            expect(incoming.length).toBe(initialCount + 1);
        });

        test('User on brain-a can send a boost to user on brain-b via DID with generic send method', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');
            const userB = await getLearnCardForUserOnBrainB('c');

            const initialCount = (await userB.invoke.getIncomingCredentials()).length;

            const boostUri = await userA.invoke.createBoost(testUnsignedBoost);

            await userA.invoke.send({
                recipient: userB.id.did(),
                type: 'boost',
                templateUri: boostUri,
            });

            const incoming = await userB.invoke.getIncomingCredentials();

            expect(incoming.length).toBe(initialCount + 1);
        });

        test('Credential from untrusted service should be rejected', async () => {
            const userB = await getLearnCardForUserOnBrainB('b');

            const response = await fetch('http://localhost:4001/api/inbox/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientDid: userB.id.did(),
                    credential: { type: 'test' },
                    issuerDid: 'did:web:untrusted.example.com',
                    issuerDisplayName: 'Untrusted',
                }),
            });

            expect(response.status).toBe(400);
        });
    });

    describe('External URI Resolution', () => {
        test('Can resolve external boost URI from brain-a to brain-b', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');
            const userB = await getLearnCardForUserOnBrainB('b');

            const unsignedVc = userB.invoke.getTestVc();
            const boostUri = await userB.invoke.createBoost(unsignedVc);

            const boost = await userA.invoke.getBoost(boostUri);
            expect(boost).toBeDefined();
            expect(boost.uri).toBe(boostUri);
        });

        test('External URI resolution fails for non-existent resource', async () => {
            const userA = await getLearnCardForUserOnBrainA('a');

            await expect(
                userA.invoke.resolveFromLCN(
                    'lc:network:localhost%3A4001/trpc:boost:non-existent-id'
                )
            ).rejects.toThrow();
        });
    });
});
