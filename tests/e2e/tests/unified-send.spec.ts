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
            expect(result.inbox?.status).toBe('pending');
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
            expect(result.inbox?.status).toBe('pending');
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

            // Parse the claim URL
            const interactionUrl = parseInteractionUrl(result.inbox!.claimUrl!);
            expect(interactionUrl).not.toBeNull();

            // Initiate the claim flow
            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl!.workflowId}/exchanges/${interactionUrl!.interactionId}`;

            const vcapiResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(vcapiResponse.status).toBe(200);

            const vcapiData = await vcapiResponse.json();
            expect(vcapiData.verifiablePresentationRequest).toBeDefined();

            const vpr = vcapiData.verifiablePresentationRequest;

            // Create a DID auth VP from user B
            const vp = await b.invoke.getDidAuthVp({
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

            const vc = claimData.verifiablePresentation.verifiableCredential[0];
            expect(vc.type).toContain('BoostCredential');
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
            expect(result.inbox?.status).toBe('pending');
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
