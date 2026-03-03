import { describe, it, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: LearnCard;
let b: LearnCard;

// Function to extract the workflowId and interactionId from the URL
const parseInteractionUrl = (url: string): { workflowId: string; interactionId: string } | null => {
    const match = url.match(/\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)(?:\?.*)?$/);

    if (match && match[1] && match[2]) {
        return {
            workflowId: match[1],
            interactionId: match[2],
        };
    }

    return null;
};

const setupSigningAuthority = async (lc: LearnCard, name: string) => {
    const sa = await lc.invoke.createSigningAuthority(name);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
    await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);

    return sa;
};

describe('Unified Send API E2E Tests', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');

        await setupSigningAuthority(a, 'unified-send-sa');
    });

    describe('Recipient Type Detection', () => {
        it('should detect email recipient and route to inbox', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            // Send to an email address - should route to Universal Inbox
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'unified-test@example.com',
                templateUri: boostUri,
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('boost');
            expect(result.uri).toBe(boostUri);

            // Should have inbox field since it was sent via email
            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
            expect(result.inbox?.status).toBe('PENDING');
        });

        // Skipping until phone support is added
        it.skip('should detect phone recipient and route to inbox', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            // Send to a phone number - should route to Universal Inbox
            const result = await a.invoke.send({
                type: 'boost',
                recipient: '+15559876543',
                templateUri: boostUri,
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('boost');
            expect(result.uri).toBe(boostUri);

            // Should have inbox field since it was sent via phone
            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
            expect(result.inbox?.status).toBe('PENDING');
        });

        it('should detect DID recipient and use direct send', async () => {
            const bProfile = await b.invoke.getProfile();
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            // Send to a DID - should use direct send (no inbox routing)
            const result = await a.invoke.send({
                type: 'boost',
                recipient: bProfile!.did,
                templateUri: boostUri,
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('boost');
            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);

            // Should NOT have inbox field for direct send
            expect(result.inbox).toBeUndefined();
        });

        it('should detect profileId recipient and use direct send', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            // Send to a profile ID - should use direct send
            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
            });

            expect(result).toBeDefined();
            expect(result.type).toBe('boost');
            expect(result.credentialUri).toBeDefined();

            // Should NOT have inbox field for direct send
            expect(result.inbox).toBeUndefined();
        });
    });

    describe('Send Options for Email/Phone Recipients', () => {
        it('should support suppressDelivery option and return claimUrl', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'suppress-test@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result).toBeDefined();
            expect(result.inbox).toBeDefined();
            expect(result.inbox?.claimUrl).toBeDefined();
            expect(result.inbox?.claimUrl).toContain('interactions');
        });

        it('should support webhookUrl option', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'webhook-test@example.com',
                templateUri: boostUri,
                options: {
                    webhookUrl: 'https://example.com/webhook/claimed',
                },
            });

            expect(result).toBeDefined();
            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
        });

        it('should support branding options', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'branding-test@example.com',
                templateUri: boostUri,
                options: {
                    branding: {
                        issuerName: 'Test Organization',
                        issuerLogoUrl: 'https://example.com/logo.png',
                        credentialName: 'Achievement Badge',
                        recipientName: 'John Doe',
                    },
                },
            });

            expect(result).toBeDefined();
            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
        });

        it('should support all options combined', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'all-options@example.com',
                templateUri: boostUri,
                options: {
                    webhookUrl: 'https://example.com/webhook',
                    suppressDelivery: true,
                    branding: {
                        issuerName: 'Combined Test Org',
                        credentialName: 'Full Options Badge',
                    },
                },
            });

            expect(result).toBeDefined();
            expect(result.inbox).toBeDefined();
            expect(result.inbox?.claimUrl).toBeDefined();
        });
    });

    describe('Email/Phone Claim Flow', () => {
        // Helper to perform the full claim flow
        const performClaimFlow = async (claimUrl: string, claimer: LearnCard) => {
            const interactionUrl = parseInteractionUrl(claimUrl);
            expect(interactionUrl).not.toBeNull();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            // Initiate the claim flow
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData.verifiablePresentationRequest).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;

            // Create a DID auth VP
            const vp = await claimer.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            // Complete the claim
            const claimResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(claimResponse.status).toBe(200);

            const claimData = await claimResponse.json();
            expect(claimData.verifiablePresentation).toBeDefined();
            expect(claimData.verifiablePresentation.verifiableCredential).toBeDefined();

            return claimData.verifiablePresentation.verifiableCredential[0];
        };

        it('should allow anonymous user to claim credential sent via email', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'claim-flow@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);
            expect(vc.type).toContain('BoostCredential');
        });

        it('should apply templateData to the claimed credential', async () => {
            const templateBoost = {
                ...testUnsignedBoost,
                name: 'Certificate for {{recipientName}}',
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    achievement: {
                        ...testUnsignedBoost.credentialSubject.achievement,
                        name: '{{courseName}} Completion Certificate',
                        description: 'Awarded to {{recipientName}} for completing {{courseName}}',
                    },
                },
            };

            const boostUri = await a.invoke.createBoost(templateBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'template-claim@example.com',
                templateUri: boostUri,
                templateData: {
                    recipientName: 'Alice Johnson',
                    courseName: 'Advanced TypeScript',
                },
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify templateData was applied to the credential
            expect(vc.name).toBe('Certificate for Alice Johnson');
            expect(vc.credentialSubject.achievement.name).toBe('Advanced TypeScript Completion Certificate');
            expect(vc.credentialSubject.achievement.description).toContain('Alice Johnson');
            expect(vc.credentialSubject.achievement.description).toContain('Advanced TypeScript');
        });

        it('should preserve signedCredential through claim flow', async () => {
            // Set up the unsigned boost with user A as issuer
            const unsignedBoost = {
                ...testUnsignedBoost,
                issuer: a.id.did('key'),
            };

            const boostUri = await a.invoke.createBoost(unsignedBoost);

            // Sign the credential client-side
            const signedVc = await a.invoke.issueCredential(unsignedBoost);
            const originalProof = signedVc.proof;

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'signed-claim@example.com',
                templateUri: boostUri,
                signedCredential: signedVc,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const claimedVc = await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify the credential proof matches the original signed credential
            expect(claimedVc.proof).toBeDefined();
            expect(claimedVc.proof.type).toBe(originalProof.type);
            expect(claimedVc.proof.verificationMethod).toBe(originalProof.verificationMethod);
        });

        it('should allow claiming credential created with on-the-fly template', async () => {
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'onthefly-claim@example.com',
                template: {
                    credential: testUnsignedBoost,
                    name: 'On-the-fly Claimable Boost',
                    category: 'Achievement',
                },
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();
            expect(result.uri).toBeDefined();

            // Verify boost was created
            const boost = await a.invoke.getBoost(result.uri);
            expect(boost).toBeDefined();
            expect(boost.name).toBe('On-the-fly Claimable Boost');

            // Claim the credential
            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);
            expect(vc.type).toContain('BoostCredential');
        });

        it('should set correct credentialSubject.id on claimed credential', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'subject-id@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify the credential subject ID is set to the claimer's DID
            const bProfile = await b.invoke.getProfile();
            expect(vc.credentialSubject.id).toBe(bProfile!.did);
        });

        it('should verify claimed credential has a proof', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'verify-proof@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);

            expect(vc.proof).toBeDefined();
            expect(vc.proof.proofValue).toBeDefined();
            // Because we're using the unified-send-sa signing authority, the verification method should include it
            expect(vc.proof.verificationMethod.includes('unified-send-sa')).toBeTruthy();
        });

        it('should include boostId in claimed credential', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'boost-id@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify boostId is set correctly
            expect(vc.boostId).toBe(boostUri);
        });
    });

    describe('TemplateData and SignedCredential for Inbox', () => {
        it('should apply templateData when sending to email', async () => {
            const templateBoost = {
                ...testUnsignedBoost,
                name: 'Certificate for {{recipientName}}',
            };

            const boostUri = await a.invoke.createBoost(templateBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'template-e2e@example.com',
                templateUri: boostUri,
                templateData: {
                    recipientName: 'E2E Test User',
                },
            });

            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
            expect(result.inbox?.status).toBe('PENDING');
        });

        it('should use signedCredential when provided for email recipient', async () => {
            testUnsignedBoost.issuer = a.id.did('key')
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            // Sign credential client-side
            const signedVc = await a.invoke.issueCredential(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'signed-e2e@example.com',
                templateUri: boostUri,
                signedCredential: signedVc,
            });

            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
        });

        it('should work with on-the-fly template for email recipient', async () => {
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'onthefly-e2e@example.com',
                template: {
                    credential: testUnsignedBoost,
                    name: 'On-the-fly E2E Boost',
                    category: 'Achievement',
                },
            });

            expect(result.inbox).toBeDefined();
            expect(result.inbox?.issuanceId).toBeDefined();
            expect(result.uri).toBeDefined();
        });
    });

    describe('Boost Tracking for Inbox Credentials', () => {
        // Helper to perform the full claim flow
        const performClaimFlow = async (claimUrl: string, claimer: LearnCard) => {
            const interactionUrl = parseInteractionUrl(claimUrl);
            expect(interactionUrl).not.toBeNull();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            // Initiate the claim flow
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData.verifiablePresentationRequest).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;

            // Create a DID auth VP
            const vp = await claimer.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            // Complete the claim
            const claimResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(claimResponse.status).toBe(200);

            const claimData = await claimResponse.json();
            expect(claimData.verifiablePresentation).toBeDefined();
            expect(claimData.verifiablePresentation.verifiableCredential).toBeDefined();

            return claimData.verifiablePresentation.verifiableCredential[0];
        };

        it('should track boost recipients after inbox claim', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Inbox Tracking Test Boost',
            });

            // Get initial recipient count
            const initialRecipients = await a.invoke.getBoostRecipients(boostUri);
            const initialCount = initialRecipients.length;

            // Send via inbox (email delivery verifies contact method)
            await a.invoke.send({
                type: 'boost',
                recipient: 'boost-tracking-claim@example.com',
                templateUri: boostUri,
            });

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // Claim the credential
            await performClaimFlow(claimUrl, b);

            // Verify boost recipients increased
            const finalRecipients = await a.invoke.getBoostRecipients(boostUri);
            expect(finalRecipients.length).toBe(initialCount + 1);

            // Verify user B is in the recipients list
            const bProfile = await b.invoke.getProfile();

            const bRecipient = finalRecipients.find(
                (r: { to: { profileId: string } }) => r.to.profileId === bProfile!.profileId
            );
            expect(bRecipient).toBeDefined();
        });

        it('should create sent credential relationship after inbox claim', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Sent Credential Tracking Boost',
            });

            // Get initial sent credentials count
            const initialSent = await a.invoke.getSentCredentials();
            const initialSentCount = initialSent.length;

            // Send via inbox
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'sent-tracking@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            // Claim the credential
            await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify sent credentials increased
            const finalSent = await a.invoke.getSentCredentials();
            expect(finalSent.length).toBe(initialSentCount + 1);
        });

        it('should track boost recipients with on-the-fly template after claim', async () => {
            // Send with on-the-fly template (email delivery verifies contact method)
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'onthefly-tracking@example.com',
                template: {
                    credential: testUnsignedBoost,
                    name: 'On-the-fly Tracking Boost',
                    category: 'Achievement',
                },
            });

            expect(result.uri).toBeDefined();

            // Get initial recipient count for the created boost
            const initialRecipients = await a.invoke.getBoostRecipients(result.uri);
            const initialCount = initialRecipients.length;

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // Claim the credential
            await performClaimFlow(claimUrl, b);

            // Verify boost recipients increased
            const finalRecipients = await a.invoke.getBoostRecipients(result.uri);
            expect(finalRecipients.length).toBe(initialCount + 1);

            // Verify user B is in the recipients list
            const bProfile = await b.invoke.getProfile();
            const bRecipient = finalRecipients.find(
                (r: { to: { profileId: string } }) => r.to.profileId === bProfile!.profileId
            );
            expect(bRecipient).toBeDefined();
        });

        it('should track boost with templateData after inbox claim', async () => {
            const templateBoost = {
                ...testUnsignedBoost,
                name: 'Certificate for {{recipientName}}',
            };

            const boostUri = await a.invoke.createBoost(templateBoost, {
                name: 'Template Data Tracking Boost',
            });

            // Get initial recipient count
            const initialRecipients = await a.invoke.getBoostRecipients(boostUri);
            const initialCount = initialRecipients.length;

            // Send via inbox with templateData
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'templatedata-tracking@example.com',
                templateUri: boostUri,
                templateData: {
                    recipientName: 'Tracking Test User',
                },
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            // Claim the credential
            const vc = await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify templateData was applied
            expect(vc.name).toBe('Certificate for Tracking Test User');

            // Verify boost recipients increased
            const finalRecipients = await a.invoke.getBoostRecipients(boostUri);
            expect(finalRecipients.length).toBe(initialCount + 1);
        });

        it('should track boost with signedCredential after inbox claim', async () => {
            const unsignedBoost = {
                ...testUnsignedBoost,
                issuer: a.id.did('key'),
            };

            const boostUri = await a.invoke.createBoost(unsignedBoost, {
                name: 'Signed Credential Tracking Boost',
            });

            // Get initial recipient count
            const initialRecipients = await a.invoke.getBoostRecipients(boostUri);
            const initialCount = initialRecipients.length;

            // Sign the credential client-side
            const signedVc = await a.invoke.issueCredential(unsignedBoost);

            // Send via inbox with signedCredential
            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'signed-tracking@example.com',
                templateUri: boostUri,
                signedCredential: signedVc,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            // Claim the credential
            await performClaimFlow(result.inbox!.claimUrl!, b);

            // Verify boost recipients increased
            const finalRecipients = await a.invoke.getBoostRecipients(boostUri);
            expect(finalRecipients.length).toBe(initialCount + 1);
        });

        it('should show boost in issuer sent credentials after multiple inbox claims', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Multiple Claims Tracking Boost',
            });

            // Get initial counts
            const initialSent = await a.invoke.getSentCredentials();
            const initialRecipients = await a.invoke.getBoostRecipients(boostUri);

            // Send to first recipient
            const result1 = await a.invoke.send({
                type: 'boost',
                recipient: 'multi-claim-1@example.com',
                templateUri: boostUri,
                options: { suppressDelivery: true },
            });

            // Claim as user b
            await performClaimFlow(result1.inbox!.claimUrl!, b);

            // Check counts after first claim
            const afterFirstClaim = await a.invoke.getSentCredentials();
            const recipientsAfterFirst = await a.invoke.getBoostRecipients(boostUri);
            expect(afterFirstClaim.length).toBe(initialSent.length + 1);
            expect(recipientsAfterFirst.length).toBe(initialRecipients.length + 1);
        });

        it('should verify direct send still tracks boost recipients correctly', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Direct Send Comparison Boost',
            });

            // Get initial recipient count
            const initialRecipients = await a.invoke.getBoostRecipients(boostUri);
            const initialCount = initialRecipients.length;

            // Send directly to user B (not via inbox)
            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.inbox).toBeUndefined();

            // Accept the credential
            await b.invoke.acceptCredential(result.credentialUri);

            // Verify boost recipients increased
            const finalRecipients = await a.invoke.getBoostRecipients(boostUri);
            expect(finalRecipients.length).toBe(initialCount + 1);

            // Compare with inbox path - should work the same way
            const boostUri2 = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Inbox Send Comparison Boost',
            });

            const initialRecipients2 = await a.invoke.getBoostRecipients(boostUri2);

            const inboxResult = await a.invoke.send({
                type: 'boost',
                recipient: 'comparison-test@example.com',
                templateUri: boostUri2,
                options: { suppressDelivery: true },
            });

            await performClaimFlow(inboxResult.inbox!.claimUrl!, b);

            const finalRecipients2 = await a.invoke.getBoostRecipients(boostUri2);
            expect(finalRecipients2.length).toBe(initialRecipients2.length + 1);
        });
    });

    describe('Auto-delivery After Email Verification', () => {
        // Helper to perform the full claim flow (duplicated for this describe block)
        const performClaimFlow = async (claimUrl: string, claimer: LearnCard) => {
            const interactionUrl = parseInteractionUrl(claimUrl);
            expect(interactionUrl).not.toBeNull();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            // Initiate the claim flow
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData.verifiablePresentationRequest).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;

            // Create a DID auth VP
            const vp = await claimer.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            // Complete the claim
            const claimResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(claimResponse.status).toBe(200);

            const claimData = await claimResponse.json();
            expect(claimData.verifiablePresentation).toBeDefined();
            expect(claimData.verifiablePresentation.verifiableCredential).toBeDefined();

            return claimData.verifiablePresentation.verifiableCredential[0];
        };

        it('should auto-deliver to user after they claim first credential via email', async () => {
            // Use a unique email for this test
            const testEmail = `auto-delivery-${Date.now()}@example.com`;

            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'First Auto-delivery Boost',
            });

            // First send via inbox (email delivery verifies contact method)
            const result1 = await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri,
            });

            expect(result1.inbox?.status).toBe('PENDING');

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // User B claims the credential - this verifies their email
            await performClaimFlow(claimUrl, b);

            // Now send another credential to the same email
            const boostUri2 = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Second Auto-delivery Boost',
            });

            const result2 = await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri2,
                options: {
                    suppressDelivery: true,
                },
            });

            // Second send should be auto-delivered
            expect(result2.inbox?.status).toBe('ISSUED');

            // User B should have the credential in their incoming credentials
            const incoming = await b.invoke.getIncomingCredentials();
            expect(incoming.length).toBeGreaterThan(0);

            // The auto-delivered credential should be in incoming
            // We can verify by checking that there's an incoming credential from the sender
            const autoDelivered = incoming.find(
                (c: { uri: string }) => c.uri !== undefined
            );
            expect(autoDelivered).toBeDefined();
        });

        it('should auto-deliver and track boost recipients after email verification', async () => {
            const testEmail = `auto-track-${Date.now()}@example.com`;

            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Auto-track First Boost',
            });

            // Get initial recipient count
            const initialRecipients = await a.invoke.getBoostRecipients(boostUri);

            // First send via inbox (email delivery verifies contact method)
            await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri,
            });

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // User B claims - this verifies their email and creates boost relationship
            await performClaimFlow(claimUrl, b);

            // Check recipients increased after claim
            const afterClaimRecipients = await a.invoke.getBoostRecipients(boostUri);
            expect(afterClaimRecipients.length).toBe(initialRecipients.length + 1);

            // Create second boost and send to same email
            const boostUri2 = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Auto-track Second Boost',
            });

            const initialRecipients2 = await a.invoke.getBoostRecipients(boostUri2);

            const result2 = await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri2,
                options: {
                    suppressDelivery: true,
                },
            });

            // Should be auto-delivered
            expect(result2.inbox?.status).toBe('ISSUED');

            // Boost recipients should also be tracked for auto-delivered credentials
            const finalRecipients2 = await a.invoke.getBoostRecipients(boostUri2);
            expect(finalRecipients2.length).toBe(initialRecipients2.length + 1);
        });

        it('should auto-deliver with on-the-fly template after email verification', async () => {
            const testEmail = `onthefly-auto-${Date.now()}@example.com`;

            // First send with on-the-fly template (email delivery verifies contact method)
            await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                template: {
                    credential: testUnsignedBoost,
                    name: 'On-the-fly First Boost',
                    category: 'Achievement',
                },
            });

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // User B claims - this verifies their email
            await performClaimFlow(claimUrl, b);

            // Second send with another on-the-fly template to same email
            const result2 = await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                template: {
                    credential: testUnsignedBoost,
                    name: 'On-the-fly Second Boost',
                    category: 'Achievement',
                },
                options: {
                    suppressDelivery: true,
                },
            });

            // Should be auto-delivered
            expect(result2.inbox?.status).toBe('ISSUED');

            // User B should have the credential in incoming
            const incoming = await b.invoke.getIncomingCredentials();
            expect(incoming.length).toBeGreaterThan(0);
        });

        it('should auto-deliver multiple credentials after initial verification', async () => {
            const testEmail = `multi-auto-${Date.now()}@example.com`;

            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Multi-auto First Boost',
            });

            // First send via inbox (email delivery verifies contact method)
            await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri,
            });

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // User B claims - this verifies their email
            await performClaimFlow(claimUrl, b);

            // Send multiple credentials to the same verified email
            const boostNames = ['Multi-auto Second', 'Multi-auto Third', 'Multi-auto Fourth'];
            const sendResults = [];

            for (const name of boostNames) {
                const uri = await a.invoke.createBoost(testUnsignedBoost, { name });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: testEmail,
                    templateUri: uri,
                    options: {
                        suppressDelivery: true,
                    },
                });
                sendResults.push(result);
            }

            // All should be auto-delivered
            for (const result of sendResults) {
                expect(result.inbox?.status).toBe('ISSUED');
            }

            // User B should have all credentials in their incoming
            const incoming = await b.invoke.getIncomingCredentials();
            expect(incoming.length).toBeGreaterThanOrEqual(boostNames.length);
        });

        it('should auto-deliver with templateData after email verification', async () => {
            const testEmail = `template-auto-${Date.now()}@example.com`;

            const templateBoost = {
                ...testUnsignedBoost,
                name: 'Certificate for {{recipientName}}',
            };

            const boostUri = await a.invoke.createBoost(templateBoost, {
                name: 'Template Auto-delivery Boost',
            });

            // First send via inbox (email delivery verifies contact method)
            await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri,
                templateData: {
                    recipientName: 'First User',
                },
            });

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // User B claims - this verifies their email
            const vc1 = await performClaimFlow(claimUrl, b);
            expect(vc1.name).toBe('Certificate for First User');

            // Send again with different templateData
            const result2 = await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri,
                templateData: {
                    recipientName: 'Second Achievement',
                },
                options: {
                    suppressDelivery: true,
                },
            });

            // Should be auto-delivered
            expect(result2.inbox?.status).toBe('ISSUED');

            // User B should have the credential in incoming
            const incoming = await b.invoke.getIncomingCredentials();
            expect(incoming.length).toBeGreaterThan(0);
        });
    });

    describe('Claim Security and Edge Cases', () => {
        // Helper to perform the full claim flow
        const performClaimFlow = async (claimUrl: string, claimer: LearnCard) => {
            const interactionUrl = parseInteractionUrl(claimUrl);
            expect(interactionUrl).not.toBeNull();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            // Initiate the claim flow
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData.verifiablePresentationRequest).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;

            // Create a DID auth VP
            const vp = await claimer.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            expect(vp).toBeDefined();

            // Complete the claim
            const claimResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });

            return { claimResponse, vcapiUrl, vp, vpr };
        };

        it('should reject double-claim with same VP (replay protection)', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Double Claim Test Boost',
            });

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'double-claim@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            const { claimResponse, vcapiUrl, vp } = await performClaimFlow(result.inbox!.claimUrl!, b);
            expect(claimResponse.status).toBe(200);

            // Try to claim again with the SAME VP - should fail
            const replayResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(replayResponse.status).toBe(400);
        });

        it('should allow restarting claim with new challenge after successful claim', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Restart Claim Test Boost',
            });

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'restart-claim@example.com',
                templateUri: boostUri,
                options: {
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            // First claim
            const { claimResponse, vcapiUrl } = await performClaimFlow(result.inbox!.claimUrl!, b);
            expect(claimResponse.status).toBe(200);

            // Start a new claim flow with fresh empty request
            const newFlowResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(newFlowResponse.status).toBe(200);

            const newFlowData = await newFlowResponse.json();
            expect(newFlowData.verifiablePresentationRequest).toBeDefined();

            // Complete with new VP
            const newVp = await b.invoke.getDidAuthVp({
                challenge: newFlowData.verifiablePresentationRequest.challenge,
                domain: newFlowData.verifiablePresentationRequest.domain,
            });

            const secondClaimResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: newVp }),
            });
            expect(secondClaimResponse.status).toBe(200);
        });

        it('should verify email contact method after claim via email delivery', async () => {
            const testEmail = `verify-contact-${Date.now()}@example.com`;

            // User B starts without this email verified
            const startingContactMethods = await b.invoke.getMyContactMethods();
            const hasEmail = startingContactMethods.some(
                (cm: { type: string; value: string }) => cm.value === testEmail
            );
            expect(hasEmail).toBe(false);

            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Contact Verification Test Boost',
            });

            // Send via inbox (email delivery verifies contact method)
            await a.invoke.send({
                type: 'boost',
                recipient: testEmail,
                templateUri: boostUri,
            });

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            // User B claims via the email delivery link
            await performClaimFlow(claimUrl, b);

            // After claiming, the email should be verified as a contact method
            const contactMethods = await b.invoke.getMyContactMethods();
            const verifiedEmail = contactMethods.find(
                (cm: { type: string; value: string; isVerified: boolean }) =>
                    cm.value === testEmail && cm.isVerified === true
            );
            expect(verifiedEmail).toBeDefined();
        });
    });

    describe('Webhook Notifications', () => {
        it('should send ISSUANCE_DELIVERED notification when webhook is configured', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Webhook Delivered Test Boost',
            });

            await a.invoke.send({
                type: 'boost',
                recipient: 'webhook-delivered@example.com',
                templateUri: boostUri,
                options: {
                    webhookUrl: 'https://example.com/webhook/delivered',
                },
            });

            // Check notification queue
            const notificationQueueData = await fetch(
                'http://localhost:4000/api/test/notification-queue'
            );
            const notificationQueue = await notificationQueueData.json();

            expect(notificationQueue).toBeDefined();
            expect(notificationQueue.length).toBeGreaterThan(0);

            const deliveredNotification = notificationQueue.find(
                (n: { type: string }) => n.type === 'ISSUANCE_DELIVERED'
            );
            expect(deliveredNotification).toBeDefined();
            expect(deliveredNotification.webhookUrl).toBe('https://example.com/webhook/delivered');
            expect(deliveredNotification.data.inbox).toBeDefined();
            expect(deliveredNotification.data.inbox.issuanceId).toBeDefined();
        });

        it('should send ISSUANCE_CLAIMED notification after claim with webhook', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                name: 'Webhook Claimed Test Boost',
            });

            const result = await a.invoke.send({
                type: 'boost',
                recipient: 'webhook-claimed@example.com',
                templateUri: boostUri,
                options: {
                    webhookUrl: 'https://example.com/webhook/claimed',
                    suppressDelivery: true,
                },
            });

            expect(result.inbox?.claimUrl).toBeDefined();

            // Perform claim
            const interactionUrl = parseInteractionUrl(result.inbox!.claimUrl!);
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const vcapiData = await vcapiResponse.json();
            const vpr = vcapiData.verifiablePresentationRequest;

            const vp = await b.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });

            await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });

            // Check notification queue for ISSUANCE_CLAIMED
            const notificationQueueData = await fetch(
                'http://localhost:4000/api/test/notification-queue'
            );
            const notificationQueue = await notificationQueueData.json();

            const claimedNotification = notificationQueue.find(
                (n: { type: string }) => n.type === 'ISSUANCE_CLAIMED'
            );
            expect(claimedNotification).toBeDefined();
            expect(claimedNotification.webhookUrl).toBe('https://example.com/webhook/claimed');
            expect(claimedNotification.data.inbox).toBeDefined();
            expect(claimedNotification.data.inbox.status).toBe('ISSUED');
        });
    });

    describe('Multiple Credentials Per Claim', () => {
        it('should allow sending multiple boosts to same email and claiming all at once', async () => {
            const testEmail = `multi-cred-${Date.now()}@example.com`;
            const numBoosts = 3;

            // Send multiple boosts to same email
            for (let i = 0; i < numBoosts; i++) {
                const boostUri = await a.invoke.createBoost(testUnsignedBoost, {
                    name: `Multi Test ${i + 1}`,
                });

                await a.invoke.send({
                    type: 'boost',
                    recipient: testEmail,
                    templateUri: boostUri,
                });
            }

            // Fetch the claimUrl from test endpoint
            const testResponse = await fetch('http://localhost:4000/api/test/last-delivery');
            const deliveryData = await testResponse.json();
            const claimUrl = deliveryData?.templateModel?.claimUrl;
            expect(claimUrl).toBeDefined();

            const interactionUrl = parseInteractionUrl(claimUrl);
            expect(interactionUrl).not.toBeNull();

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            // Initiate claim
            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            const vpr = vcapiData.verifiablePresentationRequest;

            const vp = await b.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });

            // Complete claim
            const claimResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            expect(claimResponse.status).toBe(200);

            const claimData = await claimResponse.json();
            const vcs = claimData.verifiablePresentation.verifiableCredential;

            // Should receive all credentials
            expect(vcs).toBeDefined();
            expect(vcs.length).toBe(numBoosts);

            // Verify all credentials have boostId (indicating they came from boosts)
            for (const vc of vcs) {
                expect(vc.boostId).toBeDefined();
            }
        });
    });

    describe('Error Handling', () => {
        it('should reject send to non-existent boost for email recipient', async () => {
            await expect(
                a.invoke.send({
                    type: 'boost',
                    recipient: 'nonexistent@example.com',
                    templateUri: 'urn:lc:boost:nonexistent123',
                })
            ).rejects.toThrow();
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain existing behavior for profile ID recipients', async () => {
            const boostUri = await a.invoke.createBoost(testUnsignedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);

            // Verify user B received the credential
            const incoming = await b.invoke.getIncomingCredentials();
            const received = incoming.find((c: { uri: string }) => c.uri === result.credentialUri);
            expect(received).toBeDefined();
        });

        it('should maintain existing behavior with on-the-fly template for profile ID', async () => {
            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                template: {
                    credential: testUnsignedBoost,
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBeDefined();

            // Verify boost was created
            const boost = await a.invoke.getBoost(result.uri);
            expect(boost).toBeDefined();
        });
    });
});
