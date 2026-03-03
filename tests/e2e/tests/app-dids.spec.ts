import { describe, it, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, type LearnCard } from './helpers/learncard.helpers';

/**
 * Helper to construct an app DID from a slug.
 */
const getAppDidFromSlug = (slug: string): string => {
    const domain = 'localhost%3A4000';
    return `did:web:${domain}:app:${slug}`;
};

/**
 * Creates and registers a signing authority with an optional custom owner DID.
 * This mirrors the app's ensureAppSigningAuthority flow.
 */
const setupSigningAuthority = async (lc: LearnCard, name: string, ownerDid?: string) => {
    const sa = await lc.invoke.createSigningAuthority(name, ownerDid);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);
    if (!sa.endpoint || !sa.did) throw new Error(`Signing authority missing data: ${name}`);

    // Register with the SA's own DID (not the ownerDid/app DID)
    // The ownerDid is for ownership lookup, but the SA's DID is what gets resolved
    await lc.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);

    return sa;
};

describe('App DIDs End-to-End', () => {
    let alice: LearnCard;

    beforeEach(async () => {
        alice = await getLearnCardForUser('a');
    });

    describe('Full App DIDs Workflow', () => {
        it('creates app with DID and verifies DID document resolution', async () => {
            // 1. Create integration first
            const integrationId = await alice.invoke.addIntegration({
                name: 'Test App Integration',
                description: 'Integration for testing App DIDs',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create app listing (auto-generates slug)
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'E2E Test App',
                tagline: 'An app for testing App DIDs end-to-end',
                full_description: 'This app demonstrates the full App DIDs workflow',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://localhost:8888' }),
            });

            // 3. Get the listing with generated slug
            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // 4. Create SA with the APP DID as owner
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'app-did-sa', appDid);

            // 5. Associate SA with listing
            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // 6. Verify App DID format
            const expectedAppDid = getAppDidFromSlug(listing.slug);

            // 7. Test DID resolution endpoint
            const didResponse = await fetch(`http://localhost:4000/app/${listing.slug}/did.json`);
            expect(didResponse.status).toBe(200);

            const didDoc = await didResponse.json();
            expect(didDoc.id).toBe(expectedAppDid);
            expect(didDoc.verificationMethod).toBeTruthy();
            expect(didDoc.verificationMethod[0]?.controller).toBeTruthy();
        });

        it('handles app slug collisions correctly', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'Collision Test Integration',
                description: 'Testing slug collision handling',
                whitelistedDomains: ['localhost'],
            });

            // Create multiple apps with same display name
            const listing1Id = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Collision Test App',
                tagline: 'First app',
                full_description: 'First app with this name',
                icon_url: 'https://example.com/icon1.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app1.example.com' }),
            });

            const listing2Id = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Collision Test App',
                tagline: 'Second app',
                full_description: 'Second app with this name',
                icon_url: 'https://example.com/icon2.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app2.example.com' }),
            });

            const listing1 = await alice.invoke.getAppStoreListing(listing1Id);
            const listing2 = await alice.invoke.getAppStoreListing(listing2Id);

            // Verify different slugs were generated (second one should have suffix)
            expect(listing1?.slug).toBeDefined();
            expect(listing2?.slug).toBeDefined();
            expect(listing1?.slug).not.toBe(listing2?.slug);
        });

        it('supports DID resolution for draft apps (development mode)', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'Dev App Integration',
                description: 'Integration for development apps',
                whitelistedDomains: ['localhost'],
            });

            // Create app listing
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Dev Test App',
                tagline: 'Development version',
                full_description: 'App for development testing',
                icon_url: 'https://example.com/dev-icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://dev.example.com' }),
            });

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');
            expect(listing.app_listing_status).toBe('DRAFT');

            // Create SA with the APP DID as owner
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'dev-sa', appDid);

            // Associate SA with listing
            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // Verify DID resolution works for draft apps (supports dev testing)
            const didResponse = await fetch(`http://localhost:4000/app/${listing.slug}/did.json`);
            expect(didResponse.status).toBe(200);

            const didDoc = await didResponse.json();
            expect(didDoc.id).toBe(`did:web:localhost%3A4000:app:${listing.slug}`);
            expect(didDoc.verificationMethod).toBeTruthy();
        });
    });

    describe('DID Resolution Security and Validation', () => {
        it('prevents directory traversal in slug parameter', async () => {
            const maliciousSlugs = [
                '../../../etc/passwd',
                '..%2f..%2f..%2fetc%2fpasswd',
                '../admin',
                'test/../admin',
                '....//....//etc/passwd',
            ];

            for (const slug of maliciousSlugs) {
                const response = await fetch(`http://localhost:4000/app/${slug}/did.json`);
                // Should return 404 or 400, not succeed with file contents
                expect([400, 404, 422]).toContain(response.status);

                // Verify response doesn't contain filesystem content
                if (response.status !== 404) {
                    const text = await response.text();
                    expect(text).not.toContain('root:');
                    expect(text).not.toContain('bin/bash');
                }
            }
        });

        it('validates slug format for DID resolution', async () => {
            const invalidSlugs = [
                'test<script>alert(1)</script>',
                'test%00null',
                'test\x00null',
                'test..test',
                '-invalid-start',
                'invalid-end-',
                'UPPERCASE',
                'test_with_underscores',
                'test/with/slashes',
                'test with spaces',
            ];

            for (const slug of invalidSlugs) {
                const response = await fetch(
                    `http://localhost:4000/app/${encodeURIComponent(slug)}/did.json`
                );
                expect([400, 404, 422]).toContain(response.status);
            }
        });

        it('properly handles valid slug formats', async () => {
            // Test that the DID resolution works with valid slugs
            const validSlugs = [
                'simple-app',
                'app123',
                'my-awesome-app',
                'test-app-v2',
                'a',
                'app-with-many-hyphens',
            ];

            // Note: These will return 404 because no actual apps exist,
            // but they should not return validation errors
            for (const slug of validSlugs) {
                const response = await fetch(`http://localhost:4000/app/${slug}/did.json`);
                expect(response.status).toBe(404); // App doesn't exist, but slug format is valid
            }
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('handles missing signing authority gracefully', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'No SA Integration',
                description: 'Integration without signing authority',
                whitelistedDomains: ['localhost'],
            });

            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'No SA App',
                tagline: 'App without signing authority',
                full_description: 'This app has no signing authority',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
            });

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // DID resolution should fail gracefully when no SA exists
            const didResponse = await fetch(`http://localhost:4000/app/${listing.slug}/did.json`);
            expect(didResponse.status).toBe(404);
        });

        it('handles non-existent app slug', async () => {
            const response = await fetch('http://localhost:4000/app/non-existent-app/did.json');
            expect(response.status).toBe(404);
        });

        it('validates proper content-type for DID documents', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'Content Type Test Integration',
                description: 'Testing content type',
                whitelistedDomains: ['localhost'],
            });

            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Content Type Test App',
                tagline: 'Testing content type',
                full_description: 'App for testing content type',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
            });

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // Create SA with the APP DID as owner
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'content-type-sa', appDid);

            // Associate SA with listing
            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            const response = await fetch(`http://localhost:4000/app/${listing.slug}/did.json`);
            expect(response.status).toBe(200);

            const contentType = response.headers.get('content-type');
            expect(contentType).toContain('application/json');

            // Verify it's valid JSON
            const didDoc = await response.json();
            expect(didDoc.id).toBeTruthy();
            expect(didDoc['@context']).toBeTruthy();
        });
    });

    describe('Public Listing Access', () => {
        it('allows slug-based lookup for listed apps', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'Public Test Integration',
                description: 'Testing public access',
                whitelistedDomains: ['localhost'],
            });

            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Public Test App',
                tagline: 'Publicly accessible app',
                full_description: 'App for testing public access',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
            });

            // Set to LISTED status
            await alice.invoke.adminUpdateListingStatus(listingId, 'LISTED');

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // Test public listing by slug lookup
            const publicListing = await alice.invoke.getPublicAppStoreListingBySlug(listing.slug);

            expect(publicListing?.display_name).toBe('Public Test App');
            expect(publicListing?.app_listing_status).toBe('LISTED');
        });
    });
});
