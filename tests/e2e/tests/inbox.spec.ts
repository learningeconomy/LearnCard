import { afterEach, describe, test, expect } from 'vitest';

import { getLearnCardForUser, getLearnCard, LearnCard } from './helpers/learncard.helpers';
import { sendCredentialsViaInbox, startP256DidAuthFixture } from './helpers/inbox.helpers';
import type { P256DidAuthFixture } from './helpers/inbox.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';
import type { LCNIntegration, VC, VP } from '@learncard/types';

type ExchangeResponse = {
    status: number;
    data: {
        verifiablePresentationRequest?: { challenge: string; domain: string };
        verifiablePresentation?: { verifiableCredential: VC[] };
    };
};

let a: LearnCard;
let b_anonymous: LearnCard;
let c: LearnCard;
let token: string;
let integration: LCNIntegration | undefined;
let integration2: LCNIntegration | undefined;
let listingId: string | undefined;
let listingId2: string | undefined;

// Function to extract the workflowId and interactionId from the URL
const parseInteractionUrl = (url: string): { workflowId: string; interactionId: string } | null => {
    // Regex to match '/interactions/{workflowId}/{interactionId}'
    // workflowId: alphanumeric
    // interactionId: base64url characters
    const match = url.match(/\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)(?:\?.*)?$/);

    if (match && match[1] && match[2]) {
        return {
            workflowId: match[1], // The first capturing group
            interactionId: match[2], // The second capturing group
        };
    }
    return null;
};

describe('Inbox', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b_anonymous = await getLearnCard('b');
        c = await getLearnCardForUser('c');

        const grantId = await a.invoke.addAuthGrant({
            name: 'test',
            scope: 'inbox:write',
        });

        token = await a.invoke.getAPITokenForAuthGrant(grantId);
    });

    describe.each(['workflow', 'inbox-claim'] as const)('P-256 DIDAuth %s', branch => {
        let p256: P256DidAuthFixture | undefined;

        beforeEach(async () => {
            p256 = await startP256DidAuthFixture();
        });

        afterEach(async () => {
            await p256?.close();
            p256 = undefined;
        });

        const postExchange = async (url: string, presentation?: VP): Promise<ExchangeResponse> => {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(presentation ? { verifiablePresentation: presentation } : {}),
            });
            return { status: response.status, data: await response.json() };
        };

        const initiate = async (url: string): Promise<{ challenge: string; domain: string }> => {
            const response = await postExchange(url);
            expect(response.status).toBe(200);
            expect(response.data.verifiablePresentationRequest).toMatchObject({
                challenge: expect.any(String),
                domain: expect.any(String),
            });
            const { challenge, domain } = response.data.verifiablePresentationRequest!;
            return { challenge, domain };
        };

        const createExchange = async (holderDid: string) => {
            if (branch === 'inbox-claim') {
                const credential = await a.invoke.issueCredential(await a.invoke.getTestVc());
                const response = await fetch('http://localhost:4000/api/inbox/issue', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        credential,
                        recipient: { type: 'email', value: 'p256-holder@test.com' },
                    }),
                });
                expect(response.status).toBe(200);
                expect(await response.json()).toMatchObject({ status: 'PENDING' });
                const delivery = await fetch('http://localhost:4000/api/test/last-delivery');
                const claimUrl = (await delivery.json()).templateModel.claimUrl;
                const interaction = parseInteractionUrl(claimUrl);
                expect(interaction?.workflowId).toBe('inbox-claim');
                if (!interaction) throw new Error('Missing inbox claim interaction');
                const url = `http://localhost:4000/api/workflows/inbox-claim/exchanges/${interaction.interactionId}`;
                return { url, expectedCredential: credential, freshUrl: async () => url };
            }

            const sa = await a.invoke.createSigningAuthority('p256-exchange');
            if (!sa) throw new Error('Failed to create exchange signing authority');
            await a.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'P-256 exchange',
                type: 'achievement',
                category: 'Achievement',
            });
            await a.invoke.updateBoost(boostUri, { defaultPermissions: { canView: true } });
            const freshUrl = async () => {
                // Generic claim links are intentionally reusable unless a usage limit is set.
                const exchange = await a.invoke.generateClaimLink(
                    boostUri,
                    { endpoint: sa.endpoint!, name: sa.name },
                    { totalUses: 1 }
                );
                const id = Buffer.from(JSON.stringify(exchange)).toString('base64url');
                return `http://localhost:4000/api/workflows/claim/exchanges/${id}`;
            };
            return {
                url: await freshUrl(),
                expectedCredential: {
                    name: testUnsignedBoost.name,
                    credentialSubject: { id: holderDid },
                },
                freshUrl,
            };
        };

        const expectIssued = (response: ExchangeResponse, expectedCredential: object) => {
            expect(response.status, JSON.stringify(response.data)).toBe(200);
            expect(response.data.verifiablePresentation!.verifiableCredential).toHaveLength(1);
            expect(response.data.verifiablePresentation!.verifiableCredential[0]).toMatchObject(
                expectedCredential
            );
        };

        const expectDenied = (response: ExchangeResponse, status = 400) => {
            expect(response.status).toBe(status);
            expect(response.data).not.toHaveProperty('verifiablePresentation');
            expect(response.data).not.toHaveProperty('verifiableCredential');
        };

        test.each(['did:key', 'did:web'] as const)(
            '%s completes issuance, denies replay, and accepts a fresh challenge',
            async method => {
                const fixture = p256!;
                const holder = method === 'did:key' ? fixture.keyHolder : fixture.webHolder;
                const exchange = await createExchange(holder.did);
                const request = await initiate(exchange.url);
                const presentation = await fixture.sign(holder, request);
                expectIssued(
                    await postExchange(exchange.url, presentation),
                    exchange.expectedCredential
                );
                expectDenied(
                    await postExchange(exchange.url, presentation),
                    branch === 'workflow' ? 404 : 400
                );

                // Inbox restarts with {}; a consumed single-use generic link needs a newly
                // generated claim link, not a reset of the exhausted link.
                const freshUrl = await exchange.freshUrl();
                const freshRequest = await initiate(freshUrl);
                expect(freshRequest.challenge).not.toBe(request.challenge);
                expectDenied(await postExchange(freshUrl, presentation));
                expectIssued(
                    await postExchange(freshUrl, await fixture.sign(holder, freshRequest)),
                    exchange.expectedCredential
                );
            }
        );

        test.each(['challenge', 'domain', 'purpose'] as const)(
            'rejects an incorrect %s without consuming the exchange',
            async invalid => {
                const fixture = p256!;
                const holder = fixture.keyHolder;
                const exchange = await createExchange(holder.did);
                const request = await initiate(exchange.url);
                const overrides =
                    invalid === 'challenge'
                        ? { challenge: `${request.challenge}-incorrect` }
                        : invalid === 'domain'
                          ? { domain: 'http://localhost:1' }
                          : { proofPurpose: 'assertionMethod' };
                const invalidPresentation = await fixture.sign(holder, request, overrides);
                expectDenied(await postExchange(exchange.url, invalidPresentation));

                // Reuse the original challenge, without another initiation hiding consumption.
                expectIssued(
                    await postExchange(exchange.url, await fixture.sign(holder, request)),
                    exchange.expectedCredential
                );
            }
        );

        test('rejects did:web without authentication authorization and preserves the exchange', async () => {
            const fixture = p256!;
            const exchange = await createExchange(fixture.webHolder.did);
            const request = await initiate(exchange.url);
            const presentation = await fixture.sign(fixture.unauthorizedWebHolder, request);
            fixture.removeAuthentication();
            expectDenied(await postExchange(exchange.url, presentation));
            expectIssued(
                await postExchange(exchange.url, await fixture.sign(fixture.webHolder, request)),
                exchange.expectedCredential
            );
        });
    });

    describe('Issue Credential', () => {
        test('(1) an anonymous user can claim a credential sent via universal inbox', async () => {
            // Prepare the payload for the HTTP request
            const credentialToSend = await a.invoke.issueCredential(await a.invoke.getTestVc());

            const payload = {
                credential: credentialToSend,
                recipient: { type: 'email', value: 'userB@test.com' },
            };

            // Send the boost using the HTTP route
            const response = await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('PENDING'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userB@test.com',
                }),
                claimUrl: expect.any(String),
            });

            // Fetch the claimUrl from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();

            expect(deliveryData).toBeDefined();
            const claimUrl = deliveryData.templateModel.claimUrl;

            expect(claimUrl).toBeDefined();

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }
            expect(interactionUrl.workflowId).toBeDefined();
            expect(interactionUrl.interactionId).toBeDefined();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);
            const vcapiData = await vcapiResponse.json();
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();
            expect(vpr.query).toBeDefined();
            expect(vpr.challenge).toBeDefined();
            expect(vpr.domain).toBeDefined();

            const vp = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json();
            expect(vprData).toBeDefined();

            const vc = vprData.verifiablePresentation.verifiableCredential[0];
            expect(vc).toMatchObject(credentialToSend);

            // Trying to claim again WITH the SAME presentation should fail
            const vprResponse2 = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(vprResponse2.status).toBe(400);

            // Starting the claim process over, with a new empty request to get a new challenge should succeed
            const vcapiResponse2 = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse2.status).toBe(200);
            const vcapiData2 = await vcapiResponse2.json();
            expect(vcapiData2).toBeDefined();

            const vpr2 = vcapiData2.verifiablePresentationRequest;
            expect(vpr2).toBeDefined();

            const vp2 = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr2.challenge,
                domain: vpr2.domain,
            });
            expect(vp2).toBeDefined();

            const vprResponse3 = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp2 }),
            });
            expect(vprResponse3.status).toBe(200);
            const vprData3 = await vprResponse3.json();
            expect(vprData3).toBeDefined();

            const vc3 = vprData3.verifiablePresentation.verifiableCredential[0];
            expect(vc3).toMatchObject(credentialToSend);
        });

        test('(2) an existing user can claim a credential sent via universal inbox with a new contact method', async () => {
            // User starts without a verified contact method
            const startingContactMethods = await a.invoke.getMyContactMethods();
            expect(startingContactMethods).toBeDefined();
            expect(startingContactMethods.length).toBe(0);

            // Prepare the payload for the HTTP request
            const credentialToSend = await a.invoke.issueCredential(await a.invoke.getTestVc());

            const payload = {
                credential: credentialToSend,
                recipient: { type: 'email', value: 'userB@test.com' },
            };

            // Send the boost using the HTTP route
            const response = await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('PENDING'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userB@test.com',
                }),
                claimUrl: expect.any(String),
            });

            // Fetch the claimUrl from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();

            expect(deliveryData).toBeDefined();
            const claimUrl = deliveryData.templateModel.claimUrl;

            expect(claimUrl).toBeDefined();

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }
            expect(interactionUrl.workflowId).toBeDefined();
            expect(interactionUrl.interactionId).toBeDefined();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);
            const vcapiData = await vcapiResponse.json();
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();
            expect(vpr.query).toBeDefined();
            expect(vpr.challenge).toBeDefined();
            expect(vpr.domain).toBeDefined();

            const vp = await a.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json();
            expect(vprData).toBeDefined();

            const vc = vprData.verifiablePresentation.verifiableCredential[0];
            expect(vc).toMatchObject(credentialToSend);

            // User has a verified email after claiming the cred
            const contactMethods = await a.invoke.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods.length).toBe(1);
            if (!contactMethods[0]) {
                throw new Error('No contact methods found');
            }
            expect(contactMethods[0].value).toBe('userB@test.com');
            expect(contactMethods[0].isVerified).toBe(true);
        });

        test('(3) an existing user automatically receives a credential sent via universal inbox with an existing contact method', async () => {
            // Verify the contact method for user C
            await c.invoke.addContactMethod({ type: 'email', value: 'userC@test.com' });
            const verificationDelivery = await (
                await fetch('http://localhost:4000/api/test/last-delivery')
            ).json();
            const verificationToken = verificationDelivery?.templateModel?.verificationToken;
            await c.invoke.verifyContactMethod(verificationToken);

            // Prepare the payload for the HTTP request
            const credentialToSend = await a.invoke.issueCredential(await a.invoke.getTestVc());

            const payload = {
                credential: credentialToSend,
                recipient: { type: 'email', value: 'userC@test.com' },
            };

            // Send the boost using the HTTP route
            const response = await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('ISSUED'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userC@test.com',
                }),
            });

            // The claimUrl should be undefined because it's not sent if the recipient has an existing contact method
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();

            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeUndefined();

            // Instead, the credential should be received by the user
            const receivedCredentials = await c.invoke.getIncomingCredentials();
            expect(receivedCredentials.length).toBe(1);
            if (!receivedCredentials[0]) {
                throw new Error('Failed to receive credential');
            }
            const uri = receivedCredentials[0].uri;

            const credential = await c.read.get(uri);
            expect(credential).toMatchObject(credentialToSend);
        });

        test('(4) an anonymous user can claim multiple credentials sent via universal inbox', async () => {
            const credentialNames = ['Test 1', 'Test 2', 'Test 3'];
            await sendCredentialsViaInbox(a, token, 'userB@test.com', credentialNames);

            // Fetch the claimUrl from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData.templateModel.claimUrl;
            expect(claimUrl).toBeDefined();

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }
            expect(interactionUrl.workflowId).toBeDefined();
            expect(interactionUrl.interactionId).toBeDefined();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();

            const vp = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json();
            expect(vprData).toBeDefined();

            const vcs = vprData.verifiablePresentation.verifiableCredential;
            expect(vcs).toBeDefined();
            expect(vcs.length).toBe(credentialNames.length);
            for (const vc of vcs) {
                expect(credentialNames).toContain(vc.name);
            }
        });

        test('(5) an anonymous user with pending inbox credentials can sign-up for an account and receive future credentials automatically in their learncard', async () => {
            const credentialNames = ['Test 1', 'Test 2', 'Test 3'];
            await sendCredentialsViaInbox(a, token, 'userB@test.com', credentialNames);

            // Fetch the claimUrl from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData.templateModel.claimUrl;
            expect(claimUrl).toBeDefined();

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }
            expect(interactionUrl.workflowId).toBeDefined();
            expect(interactionUrl.interactionId).toBeDefined();

            // sign up for an account
            await b_anonymous.invoke.createProfile({
                displayName: 'User B',
                profileId: 'userb',
                shortBio: 'User B',
                bio: 'User B',
            });

            // accept the inbox credential
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();

            const vp = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json();
            expect(vprData).toBeDefined();

            const vcs = vprData.verifiablePresentation.verifiableCredential;
            expect(vcs).toBeDefined();
            expect(vcs.length).toBe(credentialNames.length);
            for (const vc of vcs) {
                expect(credentialNames).toContain(vc.name);
            }

            const credentialNames2 = ['Test 4', 'Test 5'];
            await sendCredentialsViaInbox(a, token, 'userB@test.com', credentialNames2);

            // Instead, the credential should be received by the user
            const receivedCredentials = await b_anonymous.invoke.getIncomingCredentials();
            expect(receivedCredentials.length).toBe(2);
            if (!receivedCredentials[0] || !receivedCredentials[1]) {
                throw new Error('Failed to receive credentials');
            }
            const uri1 = receivedCredentials[0].uri;
            const uri2 = receivedCredentials[1].uri;

            const credential1 = await b_anonymous.read.get(uri1);
            const credential2 = await b_anonymous.read.get(uri2);
            expect(credentialNames2).toContain(credential1?.name);
            expect(credentialNames2).toContain(credential2?.name);
        });

        test('(6) it should not automatically associate and verify the contact method with the profile if a claim link is not from the contact method', async () => {
            // User starts without a verified contact method
            await expect(b_anonymous.invoke.getMyContactMethods()).rejects.toThrowError();

            // Prepare the payload for the HTTP request
            const credentialToSend = await a.invoke.issueCredential(await a.invoke.getTestVc());

            const payload = {
                credential: credentialToSend,
                recipient: { type: 'email', value: 'userB@test.com' },
            };

            // Send the boost using the HTTP route
            const response = await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const inboxIssuanceResponse = await response.json();
            // Get the claim URL from the response—not the contact method!
            const claimUrl = inboxIssuanceResponse?.claimUrl;
            expect(claimUrl).toBeDefined();

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }
            expect(interactionUrl.workflowId).toBeDefined();
            expect(interactionUrl.interactionId).toBeDefined();

            // sign up for an account
            await b_anonymous.invoke.createProfile({
                displayName: 'User B',
                profileId: 'userb',
                shortBio: 'User B',
                bio: 'User B',
            });

            // accept the inbox credential
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();

            const vp = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json();
            expect(vprData).toBeDefined();

            const vc = vprData.verifiablePresentation.verifiableCredential[0];
            expect(vc).toMatchObject(credentialToSend);

            // User has a verified email after claiming the cred
            const contactMethods = await b_anonymous.invoke.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods.length).toBe(0);

            const credentialNames2 = ['Test 4', 'Test 5'];
            await sendCredentialsViaInbox(a, token, 'userB@test.com', credentialNames2);

            // Instead, the credential should be received by the user
            const receivedCredentials = await b_anonymous.invoke.getIncomingCredentials();
            expect(receivedCredentials.length).toBe(0);
        });

        test('(7) should allow sending a credential using the HTTP route with a signing authority', async () => {
            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) {
                throw new Error('Failed to create signing authority');
            }
            const registered = await a.invoke.registerSigningAuthority(
                sa.endpoint!,
                sa.name,
                sa.did!
            );
            if (!registered) {
                throw new Error('Failed to register signing authority');
            }

            // Prepare the payload for the HTTP request
            const payload = {
                credential: await a.invoke.issueCredential(await a.invoke.getTestVc()),
                recipient: { type: 'email', value: 'userB@test.com' },
                configuration: {
                    webhookUrl: 'https://example.com/webhook',
                    signingAuthority: {
                        endpoint: sa.endpoint!,
                        name: sa.name,
                    },
                },
            };

            // Send the boost using the HTTP route
            const response = await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('PENDING'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userB@test.com',
                }),
                claimUrl: expect.any(String),
            });
        });

        test('(8) should send a ISSUANCE_DELIVERED notification to the issuer if a webhook is configured', async () => {
            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) {
                throw new Error('Failed to create signing authority');
            }
            const registered = await a.invoke.registerSigningAuthority(
                sa.endpoint!,
                sa.name,
                sa.did!
            );
            if (!registered) {
                throw new Error('Failed to register signing authority');
            }

            // Prepare the payload for the HTTP request
            const payload = {
                credential: await a.invoke.issueCredential(await a.invoke.getTestVc()),
                recipient: { type: 'email', value: 'userB@test.com' },
                configuration: {
                    webhookUrl: 'https://example.com/webhook',
                    signingAuthority: {
                        endpoint: sa.endpoint!,
                        name: sa.name,
                    },
                },
            };

            // Send the boost using the HTTP route
            await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            // Check if the ISSUANCE_DELIVERED notification was added to the queue
            const notificationQueueData = await fetch(
                'http://localhost:4000/api/test/notification-queue'
            );
            const notificationQueue = await notificationQueueData.json();
            expect(notificationQueue).toBeDefined();
            expect(notificationQueue.length).toBe(1);
            const notification = notificationQueue[0];
            expect(notification.type).toBe('ISSUANCE_DELIVERED');
            expect(notification.webhookUrl).toBe('https://example.com/webhook');
            expect(notification.data.inbox).toBeDefined();
            expect(notification.data.inbox.issuanceId).toBeDefined();
            expect(notification.data.inbox.status).toBe('PENDING');
        });

        test('(9) should send a ISSUANCE_CLAIMED notification to the issuer if a webhook is configured', async () => {
            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) {
                throw new Error('Failed to create signing authority');
            }
            const registered = await a.invoke.registerSigningAuthority(
                sa.endpoint!,
                sa.name,
                sa.did!
            );
            if (!registered) {
                throw new Error('Failed to register signing authority');
            }

            // Prepare the payload for the HTTP request
            const payload = {
                credential: await a.invoke.issueCredential(await a.invoke.getTestVc()),
                recipient: { type: 'email', value: 'userB@test.com' },
                configuration: {
                    webhookUrl: 'https://example.com/webhook',
                    signingAuthority: {
                        endpoint: sa.endpoint!,
                        name: sa.name,
                    },
                },
            };

            // Send the boost using the HTTP route
            await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            // Fetch the claimUrl from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData.templateModel.claimUrl;

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }

            // accept the inbox credential
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const vcapiData = await vcapiResponse.json();

            const vpr = vcapiData.verifiablePresentationRequest;

            const vp = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });

            // Check if the ISSUANCE_CLAIMED notification was added to the queue
            const notificationQueueData = await fetch(
                'http://localhost:4000/api/test/notification-queue'
            );
            const notificationQueue = await notificationQueueData.json();
            expect(notificationQueue).toBeDefined();

            const claimedNotification = notificationQueue.find(
                (n: any) => n.type === 'ISSUANCE_CLAIMED'
            );
            expect(claimedNotification.type).toBe('ISSUANCE_CLAIMED');
            expect(claimedNotification.webhookUrl).toBe('https://example.com/webhook');
            expect(claimedNotification.data.inbox).toBeDefined();
            expect(claimedNotification.data.inbox.issuanceId).toBeDefined();
            expect(claimedNotification.data.inbox.status).toBe('ISSUED');
        });

        test('(10) should send a ISSUANCE_ERROR notification to the issuer if a webhook is configured', async () => {
            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) {
                throw new Error('Failed to create signing authority');
            }
            const registered = await a.invoke.registerSigningAuthority(
                sa.endpoint!,
                sa.name,
                sa.did!
            );
            if (!registered) {
                throw new Error('Failed to register signing authority');
            }

            const badTestVc = await a.invoke.getTestVc();
            badTestVc['banana'] = { '@context': 'broken' };

            // Prepare the payload for the HTTP request
            const payload = {
                credential: badTestVc,
                recipient: { type: 'email', value: 'userB@test.com' },
                configuration: {
                    webhookUrl: 'https://example.com/webhook',
                    signingAuthority: {
                        endpoint: sa.endpoint!,
                        name: sa.name,
                    },
                },
            };

            // Send the boost using the HTTP route
            await fetch(`http://localhost:4000/api/inbox/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            // Fetch the claimUrl from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData.templateModel.claimUrl;

            const interactionUrl = parseInteractionUrl(claimUrl);
            if (!interactionUrl) {
                throw new Error('Failed to parse interaction URL');
            }

            // accept the inbox credential
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const vcapiData = await vcapiResponse.json();

            const vpr = vcapiData.verifiablePresentationRequest;

            const vp = await b_anonymous.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });

            // Check if the ISSUANCE_ERROR notification was added to the queue
            const notificationQueueData = await fetch(
                'http://localhost:4000/api/test/notification-queue'
            );
            const notificationQueue = await notificationQueueData.json();
            expect(notificationQueue).toBeDefined();

            const errorNotification = notificationQueue.find(
                (n: any) => n.type === 'ISSUANCE_ERROR'
            );
            if (!errorNotification) {
                throw new Error('Failed to find ISSUANCE_ERROR notification');
            }
            expect(errorNotification.type).toBe('ISSUANCE_ERROR');
            expect(errorNotification.webhookUrl).toBe('https://example.com/webhook');
            expect(errorNotification.data.inbox).toBeDefined();
            expect(errorNotification.data.inbox.issuanceId).toBeDefined();
            expect(errorNotification.data.inbox.status).toBe('PENDING');
        });
    });

    describe('Claim credentials INTO inbox from an integration', () => {
        beforeEach(async () => {
            a = await getLearnCardForUser('a');
            b_anonymous = await getLearnCard('b');
            c = await getLearnCardForUser('c');

            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) {
                throw new Error('Failed to create signing authority');
            }
            await a.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
            const integrationId = await a.invoke.addIntegration({
                name: 'test',
                whitelistedDomains: ['localhost:4000'],
                description: 'test',
            });

            listingId = await a.invoke.createAppStoreListing(integrationId, {
                display_name: 'Inbox Listing',
                tagline: 'Inbox listing',
                full_description: 'Inbox listing for tests',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://example.com' }),
            });

            await a.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint!,
                sa.name,
                sa.did!,
                true
            );

            const integrationId2 = await a.invoke.addIntegration({
                name: 'port-3000',
                whitelistedDomains: ['localhost:3000'],
                description: 'Integration ID 2',
            });

            listingId2 = await a.invoke.createAppStoreListing(integrationId2, {
                display_name: 'Inbox Listing 2',
                tagline: 'Inbox listing 2',
                full_description: 'Inbox listing for tests',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://example.com' }),
            });

            await a.invoke.associateListingWithSigningAuthority(
                listingId2,
                sa.endpoint!,
                sa.name,
                sa.did!,
                true
            );

            integration = await a.invoke.getIntegration(integrationId);
            integration2 = await a.invoke.getIntegration(integrationId2);
        });

        it('should allow you to claim a credential into your inbox from an integration', async () => {
            const payload = {
                type: 'email',
                value: 'userA@test.com',
                configuration: {
                    publishableKey: integration?.publishableKey,
                    listingId,
                },
            };

            // Send challenge
            const challengeResponse = await fetch(
                `http://localhost:4000/api/contact-methods/challenge`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            // Fetch the verification token from our new test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            console.log(deliveryData);
            const otpChallenge = deliveryData.templateModel.verificationCode;

            const res = await fetch(`http://localhost:4000/api/contact-methods/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contactMethod: { type: 'email', value: 'userA@test.com' },
                    otpChallenge,
                }),
            });
            const sessionJwt = (await res.json()).sessionJwt;
            expect(sessionJwt).toBeDefined();
            expect(sessionJwt).toBeTypeOf('string');

            const credential = await a.invoke.getTestVc();
            const claimPayload = {
                credential,
                configuration: {
                    publishableKey: integration?.publishableKey,
                    listingId,
                },
            };

            const claimResponse = await fetch(`http://localhost:4000/api/inbox/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionJwt}`,
                },
                body: JSON.stringify(claimPayload),
            });
            const claimData = await claimResponse.json();
            expect(claimData).toBeDefined();
            expect(claimData).toBeTypeOf('object');
            expect(claimData.status).toBe('PENDING');
        });

        it('should reject a claim if not from a whitelisted domain', async () => {
            const payload = {
                type: 'email',
                value: 'userA@test.com',
                configuration: {
                    publishableKey: integration2?.publishableKey,
                    listingId: listingId2,
                },
            };

            // Send challenge
            const challengeResponse = await fetch(
                `http://localhost:4000/api/contact-methods/challenge`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );
            const challengeData = await challengeResponse.json();
            expect(challengeData.code).toBe('UNAUTHORIZED');
        });
    });
});
