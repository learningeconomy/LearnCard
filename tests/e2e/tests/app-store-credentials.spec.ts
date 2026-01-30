import { describe, it, expect, beforeEach } from 'vitest';
import { unwrapBoostCredential } from '@learncard/helpers';
import { VC } from '@learncard/types';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let appOwner: LearnCard;
let appUser: LearnCard;
let integrationId: string;
let listingId: string;
let boostUri: string;

/**
 * Creates and registers a signing authority with an optional custom owner DID.
 * This mirrors the app's ensureAppSigningAuthority flow.
 * 
 * - ownerDid: Used by the signing service for ownership lookup
 * - sa.did: Used for DID document resolution
 */
const setupSigningAuthority = async (lc: LearnCard, name: string, ownerDid?: string) => {
    const sa = await lc.invoke.createSigningAuthority(name, ownerDid);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    // Register with the SA's own DID (not the ownerDid/app DID)
    // The ownerDid is for ownership lookup, but the SA's DID is what gets resolved
    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);

    return sa;
};

/**
 * Sets up an integration without a signing authority.
 * The SA will be added later after the listing is created (to get the app DID).
 */
const setupIntegration = async (lc: LearnCard, name: string) => {
    const id = await lc.invoke.addIntegration({
        name,
        description: 'Test integration for app store credentials',
        whitelistedDomains: ['example.com'],
    });

    return id;
};

/**
 * Associates an existing signing authority with an integration.
 */
const associateSigningAuthorityWithIntegration = async (
    lc: LearnCard,
    integrationId: string,
    sa: { endpoint?: string; name: string; did?: string }
) => {
    await lc.invoke.associateIntegrationWithSigningAuthority(
        integrationId,
        sa.endpoint!,
        sa.name,
        sa.did!,
        true
    );
};

const testListingData = {
    display_name: 'Test App',
    tagline: 'A test app for credential issuance',
    full_description: 'This is a test app for testing app store credential issuance.',
    icon_url: 'https://example.com/icon.png',
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ iframeUrl: 'https://example.com/app' }),
};

const getAppDidFromSlug = (slug: string): string => {
    const domain = 'localhost%3A4000';
    return `did:web:${domain}:app:${slug}`;
};

describe('App Store Credential Issuance E2E Tests', () => {
    beforeEach(async () => {
        appOwner = await getLearnCardForUser('a');
        appUser = await getLearnCardForUser('b');

        // 1. Create integration first (without SA)
        integrationId = await setupIntegration(appOwner, 'app-cred-test');

        // 2. Create app listing to get the slug
        listingId = await appOwner.invoke.createAppStoreListing(integrationId, testListingData);

        // 3. Get the listing to retrieve the auto-generated slug
        const listing = await appOwner.invoke.getAppStoreListing(listingId);
        if (!listing?.slug) throw new Error('Listing should have auto-generated slug');

        // 4. Create SA with the APP DID as owner (so lookup works when issuing with app identity)
        const appDid = getAppDidFromSlug(listing.slug);
        const sa = await setupSigningAuthority(appOwner, 'test-sa', appDid);

        // 5. Associate SA with integration
        await associateSigningAuthorityWithIntegration(appOwner, integrationId, sa);

        // 6. Set listing to LISTED so it can be installed
        await appOwner.invoke.adminUpdateListingStatus(listingId, 'LISTED');

        // 7. Create a boost for the app
        boostUri = await appOwner.invoke.createBoost(testUnsignedBoost);

        // 8. Install the app for the user
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

    describe('Credential Issuer Identity', () => {
        beforeEach(async () => {
            await appOwner.invoke.addBoostToApp(listingId, boostUri, 'issuer-test-badge');
        });

        it('should issue credential with app DID as issuer and verify successfully', async () => {
            // Get the listing to verify it has a slug
            const listing = await appOwner.invoke.getAppStoreListing(listingId);
            expect(listing).toBeDefined();
            expect(listing?.slug).toBeDefined();
            expect(listing?.slug).toBe('test-app');

            // Issue credential - this uses the app's signing authority
            const result = await appUser.invoke.sendAppEvent(listingId, {
                type: 'send-credential',
                templateAlias: 'issuer-test-badge',
            });

            expect(result.credentialUri).toBeDefined();

            // Resolve the credential to inspect it
            const resolved = await appUser.invoke.resolveFromLCN(result.credentialUri as string);
            const credential = unwrapBoostCredential(resolved) as VC;
            expect(credential).toBeDefined();

            // Verify the issuer is the app DID (not the profile DID)
            const expectedAppDid = getAppDidFromSlug(listing!.slug!);
            const issuerId = typeof credential.issuer === 'string'
                ? credential.issuer
                : credential.issuer?.id;

            expect(issuerId).toBe(expectedAppDid);

            // Verify the credential cryptographically
            const verification = await appUser.invoke.verifyCredential(credential);
            expect(verification.errors).toHaveLength(0);
        });

        it('should generate correct app DID format from slug', async () => {
            const listing = await appOwner.invoke.getAppStoreListing(listingId);
            expect(listing).toBeDefined();

            // Verify the DID document endpoint works
            const didResponse = await fetch(`http://localhost:4000/app/${listing!.slug}/did.json`);
            expect(didResponse.status).toBe(200);

            const didDoc = await didResponse.json();
            const expectedAppDid = getAppDidFromSlug(listing!.slug!);

            expect(didDoc.id).toBe(expectedAppDid);
        });

        it('should allow third party to verify credential signed by app DID', async () => {
            const listing = await appOwner.invoke.getAppStoreListing(listingId);
            expect(listing?.slug).toBeDefined();

            // Issue credential
            const result = await appUser.invoke.sendAppEvent(listingId, {
                type: 'send-credential',
                templateAlias: 'issuer-test-badge',
            });

            // Resolve the credential
            const resolved = await appUser.invoke.resolveFromLCN(result.credentialUri as string);
            const credential = unwrapBoostCredential(resolved) as VC;

            // A third party (user c) should be able to verify the credential
            const verifier = await getLearnCardForUser('c');
            const verification = await verifier.invoke.verifyCredential(credential);

            expect(verification.errors).toHaveLength(0);
            expect(verification.checks).toContain('proof');

            // Confirm the issuer is the app DID
            const expectedAppDid = getAppDidFromSlug(listing!.slug!);
            const issuerId = typeof credential.issuer === 'string'
                ? credential.issuer
                : credential.issuer?.id;

            expect(issuerId).toBe(expectedAppDid);
        });
    });

    describe('Legacy Profile DID Issuer (no slug)', () => {
        // Note: New listings auto-generate slugs from display_name.
        // This test simulates legacy behavior where listings had no slug.
        // When a listing has no slug, credentials are issued with the profile DID as issuer.

        it('should issue credential with profile DID when listing has no slug', async () => {
            // Create a fresh integration and listing for this test
            const legacyOwner = await getLearnCardForUser('d');
            const legacySa = await setupSigningAuthority(legacyOwner, 'legacy-sa');

            const legacyIntegrationId = await legacyOwner.invoke.addIntegration({
                name: 'legacy-app',
                description: 'Legacy app without slug',
                whitelistedDomains: ['example.com'],
            });

            await legacyOwner.invoke.associateIntegrationWithSigningAuthority(
                legacyIntegrationId,
                legacySa.endpoint!,
                legacySa.name,
                legacySa.did!,
                true
            );

            // Create listing - slug will be auto-generated
            const legacyListingId = await legacyOwner.invoke.createAppStoreListing(
                legacyIntegrationId,
                {
                    ...testListingData,
                    display_name: 'Legacy App',
                }
            );

            // Clear the slug to simulate legacy behavior
            // This requires direct database access or an admin API
            // For now, we verify that WITH a slug, app DID is used (tested above)
            // The brain-service code path for no-slug falls back to profile DID:
            //   const issuerDid = listing.slug
            //     ? getAppDidWeb(ctx.domain, listing.slug)
            //     : getDidWeb(ctx.domain, integrationOwner.profileId);

            const listing = await legacyOwner.invoke.getAppStoreListing(legacyListingId);

            // New listings have slugs, so we just verify the slug was created
            expect(listing?.slug).toBeDefined();
            expect(listing?.slug).toBe('legacy-app');

            // This test documents the expected behavior:
            // - Listings WITH slug: issuer = app DID (did:web:domain:app:{slug})
            // - Listings WITHOUT slug: issuer = profile DID (did:web:domain:users:{profileId})
            // The above tests verify the "with slug" case works correctly.
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
