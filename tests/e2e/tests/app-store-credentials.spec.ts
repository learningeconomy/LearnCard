import { describe, it, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let appOwner: LearnCard;
let appUser: LearnCard;
let integrationId: string;
let listingId: string;
let boostUri: string;

const setupSigningAuthority = async (lc: LearnCard, name: string) => {
    const sa = await lc.invoke.createSigningAuthority(name);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
    await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);

    return sa;
};

const setupIntegrationWithSigningAuthority = async (lc: LearnCard, name: string) => {
    const sa = await setupSigningAuthority(lc, `test-sa`);

    const id = await lc.invoke.addIntegration({
        name,
        description: 'Test integration for app store credentials',
        whitelistedDomains: ['example.com'],
    });

    await lc.invoke.associateIntegrationWithSigningAuthority(
        id,
        sa.endpoint!,
        sa.name,
        sa.did!,
        true
    );

    return id;
};

const testListingData = {
    display_name: 'Test App',
    tagline: 'A test app for credential issuance',
    full_description: 'This is a test app for testing app store credential issuance.',
    icon_url: 'https://example.com/icon.png',
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ iframeUrl: 'https://example.com/app' }),
};

describe('App Store Credential Issuance E2E Tests', () => {
    beforeEach(async () => {
        appOwner = await getLearnCardForUser('a');
        appUser = await getLearnCardForUser('b');

        // Setup integration with signing authority
        integrationId = await setupIntegrationWithSigningAuthority(appOwner, 'app-cred-test');

        // Create app listing
        listingId = await appOwner.invoke.createAppStoreListing(integrationId, testListingData);

        // Set listing to LISTED so it can be installed
        await appOwner.invoke.adminUpdateListingStatus(listingId, 'LISTED');

        // Create a boost for the app
        boostUri = await appOwner.invoke.createBoost(testUnsignedBoost);

        // Install the app for the user
        await appUser.invoke.installApp(listingId);
    });

    describe('Boost Association', () => {
        it('should allow app owner to add boost to listing', async () => {
            const result = await appOwner.invoke.addBoostToApp(listingId, boostUri, 'test-badge');
            expect(result).toBe(true);

            const boosts = await appOwner.invoke.getAppBoosts(listingId);
            expect(boosts).toHaveLength(1);
            expect(boosts[0].templateAlias).toBe('test-badge');
            expect(boosts[0].boostUri).toBe(boostUri);
        });

        it('should reject duplicate templateAlias for same listing', async () => {
            await appOwner.invoke.addBoostToApp(listingId, boostUri, 'duplicate-badge');

            await expect(
                appOwner.invoke.addBoostToApp(listingId, boostUri, 'duplicate-badge')
            ).rejects.toThrow();
        });

        it('should reject invalid templateAlias format', async () => {
            await expect(
                appOwner.invoke.addBoostToApp(listingId, boostUri, 'Invalid_Badge!')
            ).rejects.toThrow();
        });

        it('should allow removing boost from listing', async () => {
            await appOwner.invoke.addBoostToApp(listingId, boostUri, 'removable-badge');

            const result = await appOwner.invoke.removeBoostFromApp(listingId, 'removable-badge');
            expect(result).toBe(true);

            const boosts = await appOwner.invoke.getAppBoosts(listingId);
            expect(boosts).toHaveLength(0);
        });

        it('should reject non-owner from adding boost', async () => {
            await expect(
                appUser.invoke.addBoostToApp(listingId, boostUri, 'unauthorized-badge')
            ).rejects.toThrow();
        });
    });

    describe('App Event: send-credential', () => {
        beforeEach(async () => {
            await appOwner.invoke.addBoostToApp(listingId, boostUri, 'achievement');
        });

        it('should issue credential to installed user', async () => {
            const result = await appUser.invoke.sendAppEvent(listingId, {
                type: 'send-credential',
                templateAlias: 'achievement',
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.boostUri).toBe(boostUri);

            // Verify credential in wallet
            const incoming = await appUser.invoke.getIncomingCredentials();
            const received = incoming.find((c: { uri: string }) => c.uri === result.credentialUri);
            expect(received).toBeDefined();
        });

        it('should reject if app not installed', async () => {
            const uninstalledUser = await getLearnCardForUser('c');

            await expect(
                uninstalledUser.invoke.sendAppEvent(listingId, {
                    type: 'send-credential',
                    templateAlias: 'achievement',
                })
            ).rejects.toThrow('App not installed');
        });

        it('should reject if templateAlias not found', async () => {
            await expect(
                appUser.invoke.sendAppEvent(listingId, {
                    type: 'send-credential',
                    templateAlias: 'nonexistent-badge',
                })
            ).rejects.toThrow('Boost not found');
        });

        it('should reject unknown event types', async () => {
            await expect(
                appUser.invoke.sendAppEvent(listingId, {
                    type: 'unknown-event-type',
                })
            ).rejects.toThrow('Unknown event type');
        });

        it('should apply template data to credential', async () => {
            // Create a boost with template variables
            const templateBoost = {
                ...testUnsignedBoost,
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    achievement: {
                        name: '{{achievementName}}',
                        description: '{{achievementDescription}}',
                    },
                },
            };

            const templateBoostUri = await appOwner.invoke.createBoost(templateBoost);
            await appOwner.invoke.addBoostToApp(listingId, templateBoostUri, 'template-badge');

            const result = await appUser.invoke.sendAppEvent(listingId, {
                type: 'send-credential',
                templateAlias: 'template-badge',
                templateData: {
                    achievementName: 'Top Scorer',
                    achievementDescription: 'Achieved the highest score',
                },
            });

            expect(result.credentialUri).toBeDefined();
        });
    });

    describe('Security', () => {
        it('should only allow installed apps to send events', async () => {
            await appOwner.invoke.addBoostToApp(listingId, boostUri, 'secure-badge');

            // Uninstall the app
            await appUser.invoke.uninstallApp(listingId);

            // Try to send event
            await expect(
                appUser.invoke.sendAppEvent(listingId, {
                    type: 'send-credential',
                    templateAlias: 'secure-badge',
                })
            ).rejects.toThrow('App not installed');
        });

        it('should require signing authority for credential issuance', async () => {
            // Use a fresh user who has NO signing authority configured
            const noSaOwner = await getLearnCardForUser('c');

            // Create integration without signing authority
            const noSaIntegrationId = await noSaOwner.invoke.addIntegration({
                name: 'no-sa-integration',
                description: 'Integration without signing authority',
                whitelistedDomains: ['example.com'],
            });

            const noSaListingId = await noSaOwner.invoke.createAppStoreListing(noSaIntegrationId, {
                ...testListingData,
                display_name: 'No SA App',
            });

            await appOwner.invoke.adminUpdateListingStatus(noSaListingId, 'LISTED');

            // Create boost as this user (no SA)
            const noSaBoostUri = await noSaOwner.invoke.createBoost(testUnsignedBoost);

            // addBoostToApp succeeds even without SA (it just won't auto-associate one)
            await noSaOwner.invoke.addBoostToApp(noSaListingId, noSaBoostUri, 'no-sa-badge');

            // Install app as appUser
            await appUser.invoke.installApp(noSaListingId);

            // sendAppEvent should fail because the integration has no signing authority
            await expect(
                appUser.invoke.sendAppEvent(noSaListingId, {
                    type: 'send-credential',
                    templateAlias: 'no-sa-badge',
                })
            ).rejects.toThrow('No signing authority');
        });
    });
});
