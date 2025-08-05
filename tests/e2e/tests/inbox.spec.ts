import { describe, test, expect } from 'vitest';

import { getLearnCardForUser, getLearnCard, LearnCard } from './helpers/learncard.helpers';
import { sendCredentialsViaInbox } from './helpers/inbox.helpers';

let a: LearnCard;
let b_anonymous: LearnCard;
let c: LearnCard;
let token: string;

// Function to extract the workflowId and interactionId from the URL
const parseInteractionUrl = (url: string): { workflowId: string; interactionId: string } | null => {
    // Regex to match '/interactions/{workflowId}/{interactionId}'
    // workflowId: alphanumeric
    // interactionId: base64url characters
    const match = url.match(/\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)(?:\?.*)?$/);
    
    if (match && match[1] && match[2]) {
        return {
            workflowId: match[1],  // The first capturing group
            interactionId: match[2], // The second capturing group
        };
    }
    return null;
  };

describe('Inbox', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b_anonymous = await getLearnCard('b')
        c = await getLearnCardForUser('c');        

        const grantId = await a.invoke.addAuthGrant({
            name: 'test',
            scope: 'inbox:write',
        });

        token = await a.invoke.getAPITokenForAuthGrant(grantId);
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
            const response = await fetch(
                `http://localhost:4000/api/inbox/issue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('DELIVERED'),
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
            const vcapiResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            expect(vcapiResponse.status).toBe(200);
            const vcapiData = await vcapiResponse.json(); 
            expect(vcapiData).toBeDefined();
 
            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();
            expect(vpr.query).toBeDefined();
            expect(vpr.challenge).toBeDefined();
            expect(vpr.domain).toBeDefined();


            const vp = await b_anonymous.invoke.getDidAuthVp({ challenge: vpr.challenge, domain: vpr.domain });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifiablePresentation: vp }) });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json(); 
            expect(vprData).toBeDefined();

            const vc = vprData.verifiablePresentation.verifiableCredential[0];
            expect(vc).toMatchObject(credentialToSend)

            // Trying to claim again WITH the SAME presentation should fail
            const vprResponse2 = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifiablePresentation: vp }) });
            expect(vprResponse2.status).toBe(400);


            // Starting the claim process over, with a new empty request to get a new challenge should succeed
            const vcapiResponse2 = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            expect(vcapiResponse2.status).toBe(200);
            const vcapiData2 = await vcapiResponse2.json(); 
            expect(vcapiData2).toBeDefined();
 
            const vpr2 = vcapiData2.verifiablePresentationRequest;
            expect(vpr2).toBeDefined();

            const vp2 = await b_anonymous.invoke.getDidAuthVp({ challenge: vpr2.challenge, domain: vpr2.domain });
            expect(vp2).toBeDefined();

            const vprResponse3 = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifiablePresentation: vp2 }) });
            expect(vprResponse3.status).toBe(200);
            const vprData3 = await vprResponse3.json(); 
            expect(vprData3).toBeDefined();

            const vc3 = vprData3.verifiablePresentation.verifiableCredential[0];
            expect(vc3).toMatchObject(credentialToSend)
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
            const response = await fetch(
                `http://localhost:4000/api/inbox/issue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('DELIVERED'),
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
            const vcapiResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            expect(vcapiResponse.status).toBe(200);
            const vcapiData = await vcapiResponse.json(); 
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();
            expect(vpr.query).toBeDefined();
            expect(vpr.challenge).toBeDefined();
            expect(vpr.domain).toBeDefined();

            const vp = await a.invoke.getDidAuthVp({ challenge: vpr.challenge, domain: vpr.domain });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifiablePresentation: vp }) });
            expect(vprResponse.status).toBe(200);
            const vprData = await vprResponse.json(); 
            expect(vprData).toBeDefined();

            const vc = vprData.verifiablePresentation.verifiableCredential[0];
            expect(vc).toMatchObject(credentialToSend)

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
            const verificationDelivery = await (await fetch('http://localhost:4000/api/test/last-delivery')).json();
            const verificationToken = verificationDelivery?.templateModel?.verificationToken;
            await c.invoke.verifyContactMethod(verificationToken);            
            
            // Prepare the payload for the HTTP request
            const credentialToSend = await a.invoke.issueCredential(await a.invoke.getTestVc());
            
            const payload = {
                credential: credentialToSend,
                recipient: { type: 'email', value: 'userC@test.com' },
            };

            // Send the boost using the HTTP route
            const response = await fetch(
                `http://localhost:4000/api/inbox/issue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('DELIVERED'),
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
            if(!receivedCredentials[0]) {
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
            const vcapiResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json(); 
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();

            const vp = await b_anonymous.invoke.getDidAuthVp({ challenge: vpr.challenge, domain: vpr.domain });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifiablePresentation: vp }) });
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
            await b_anonymous.invoke.createProfile({ displayName: 'User B', profileId: 'userb', shortBio: 'User B', bio: 'User B' });

            // accept the inbox credential
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`; 
            const vcapiResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json(); 
            expect(vcapiData).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;
            expect(vpr).toBeDefined();

            const vp = await b_anonymous.invoke.getDidAuthVp({ challenge: vpr.challenge, domain: vpr.domain });
            expect(vp).toBeDefined();

            const vprResponse = await fetch(vcapiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifiablePresentation: vp }) });
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
            if(!receivedCredentials[0] || !receivedCredentials[1]) {
                throw new Error('Failed to receive credentials');
            }
            const uri1 = receivedCredentials[0].uri;
            const uri2 = receivedCredentials[1].uri;

            const credential1 = await b_anonymous.read.get(uri1);
            const credential2 = await b_anonymous.read.get(uri2);
            expect(credentialNames2).toContain(credential1?.name);
            expect(credentialNames2).toContain(credential2?.name);
        });

 
        test('(6) should allow sending a credential using the HTTP route with a signing authority', async () => {
            const sa = await a.invoke.createSigningAuthority('test-sa');
            if (!sa) { 
                throw new Error('Failed to create signing authority');
            }
            const registered = await a.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
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
            const response = await fetch(
                `http://localhost:4000/api/inbox/issue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            expect(response.status).toBe(200);
            const inboxIssuanceResponse = await response.json();
            expect(inboxIssuanceResponse).toBeDefined();
            expect(inboxIssuanceResponse).toMatchObject({
                issuanceId: expect.any(String),
                status: expect.stringMatching('DELIVERED'),
                recipient: expect.objectContaining({
                    type: 'email',
                    value: 'userB@test.com',
                }),
                claimUrl: expect.any(String),
            });
        });
     
    });
});
