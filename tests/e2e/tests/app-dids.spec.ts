import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VC } from '@learncard/types';

import { getLearnCard, type LearnCard } from './helpers/learncard.helpers';
import { cleanupDb } from '../setup/db-utils';

describe('App DIDs End-to-End', () => {
    let alice: LearnCard;
    let bob: LearnCard;
    let aliceProfileId: string;
    let bobProfileId: string;

    beforeAll(async () => {
        alice = await getLearnCard('a'.repeat(64));
        bob = await getLearnCard('b'.repeat(64));

        // Create profiles
        aliceProfileId = await alice.invoke.createProfile({ profileId: 'alice-profile' });
        bobProfileId = await bob.invoke.createProfile({ profileId: 'bob-profile' });
    });

    afterAll(async () => {
        await cleanupDb();
    });

    describe('Full App DIDs Workflow', () => {
        it('creates app with DID and issues credential with app identity', async () => {
            // 1. Create integration and signing authority
            const integrationId = await alice.invoke.addIntegration({
                name: 'Test App Integration',
                description: 'Integration for testing App DIDs',
                whitelistedDomains: ['localhost'],
            });

            const signingAuthorityId = await alice.invoke.createSigningAuthority({
                name: 'lca-sa',
                endpoint: 'http://localhost:4000/sign',
            });

            await alice.invoke.associateIntegrationWithSigningAuthority({
                integrationId,
                signingAuthorityId,
            });

            // 2. Create app listing (should auto-generate slug)
            const listingId = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'E2E Test App',
                    tagline: 'An app for testing App DIDs end-to-end',
                    full_description: 'This app demonstrates the full App DIDs workflow',
                    icon_url: 'https://example.com/icon.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({
                        iframeUrl: 'https://localhost:8888',
                    }),
                    category: 'Testing',
                },
            });

            // 3. Set listing to LISTED status (simulate admin approval)
            await alice.invoke.adminUpdateListingStatus({
                listingId,
                status: 'LISTED',
            });

            // 4. Get the listing with generated slug
            const listing = await alice.invoke.getListing({ listingId });
            expect(listing.slug).toBe('e2e-test-app');

            // 5. Verify App DID format
            const domain = 'localhost%3A4000'; // Encoded domain for DID
            const expectedAppDid = `did:web:${domain}:app:${listing.slug}`;
            
            // 6. Test DID resolution endpoint
            const didResponse = await fetch(`http://localhost:4000/app/${listing.slug}/did.json`);
            expect(didResponse.status).toBe(200);
            
            const didDoc = await didResponse.json();
            expect(didDoc.id).toBe(expectedAppDid);
            expect(didDoc.verificationMethod).toBeTruthy();
            expect(didDoc.verificationMethod[0]?.controller).toBeTruthy();

            // 7. Issue credential using app identity
            const templateVC: VC = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'TestCredential'],
                issuer: expectedAppDid,
                credentialSubject: {
                    id: bobProfileId,
                    achievement: {
                        name: 'E2E Test Badge',
                        description: 'Earned for completing the App DIDs E2E test',
                    },
                },
            };

            // Issue credential via boost send (mimicking app behavior)
            const credentialUri = await alice.invoke.createBoost({
                template: templateVC,
                name: 'E2E Test Badge Boost',
                description: 'Test boost for App DIDs',
                alias: 'e2e-test-badge',
            });

            await alice.invoke.sendBoostViaSigningAuthority({
                profileId: aliceProfileId,
                boostUri: credentialUri,
                recipientProfileId: bobProfileId,
                signingAuthority: {
                    name: 'lca-sa',
                    endpoint: 'http://localhost:4000/sign',
                },
            });

            // 8. Verify credential was issued with proper issuer
            const credentials = await bob.invoke.getCredentials({ limit: 10 });
            const issuedCredential = credentials.find(vc => 
                vc.credentialSubject?.achievement?.name === 'E2E Test Badge'
            );
            
            expect(issuedCredential).toBeTruthy();
        });

        it('handles app slug collisions correctly', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'Collision Test Integration',
                description: 'Testing slug collision handling',
                whitelistedDomains: ['localhost'],
            });

            // Create multiple apps with same display name
            const listing1Id = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'Collision Test App',
                    tagline: 'First app',
                    full_description: 'First app with this name',
                    icon_url: 'https://example.com/icon1.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ iframeUrl: 'https://app1.example.com' }),
                },
            });

            const listing2Id = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'Collision Test App',
                    tagline: 'Second app',
                    full_description: 'Second app with this name',
                    icon_url: 'https://example.com/icon2.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ iframeUrl: 'https://app2.example.com' }),
                },
            });

            const listing1 = await alice.invoke.getListing({ listingId: listing1Id });
            const listing2 = await alice.invoke.getListing({ listingId: listing2Id });

            // Verify different slugs were generated
            expect(listing1.slug).toBe('collision-test-app');
            expect(listing2.slug).toBe('collision-test-app-0');

            // Verify both DIDs can be resolved independently
            const did1Response = await fetch(`http://localhost:4000/app/${listing1.slug}/did.json`);
            const did2Response = await fetch(`http://localhost:4000/app/${listing2.slug}/did.json`);

            expect(did1Response.status).toBe(200);
            expect(did2Response.status).toBe(200);

            const did1Doc = await did1Response.json();
            const did2Doc = await did2Response.json();

            expect(did1Doc.id).toBe('did:web:localhost%3A4000:app:collision-test-app');
            expect(did2Doc.id).toBe('did:web:localhost%3A4000:app:collision-test-app-0');
        });

        it('supports DID resolution for draft apps (development mode)', async () => {
            const integrationId = await alice.invoke.addIntegration({
                name: 'Dev App Integration',
                description: 'Integration for development apps',
                whitelistedDomains: ['localhost'],
            });

            const signingAuthorityId = await alice.invoke.createSigningAuthority({
                name: 'lca-sa',
                endpoint: 'http://localhost:4000/sign',
            });

            await alice.invoke.associateIntegrationWithSigningAuthority({
                integrationId,
                signingAuthorityId,
            });

            // Create app but keep in DRAFT status
            const listingId = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'Dev Test App',
                    tagline: 'Development version',
                    full_description: 'App for development testing',
                    icon_url: 'https://example.com/dev-icon.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ iframeUrl: 'https://dev.example.com' }),
                },
            });

            const listing = await alice.invoke.getListing({ listingId });
            expect(listing.app_listing_status).toBe('DRAFT');

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
                const response = await fetch(`http://localhost:4000/app/${encodeURIComponent(slug)}/did.json`);
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

            const listingId = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'No SA App',
                    tagline: 'App without signing authority',
                    full_description: 'This app has no signing authority',
                    icon_url: 'https://example.com/icon.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
                },
            });

            const listing = await alice.invoke.getListing({ listingId });

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

            const signingAuthorityId = await alice.invoke.createSigningAuthority({
                name: 'lca-sa',
                endpoint: 'http://localhost:4000/sign',
            });

            await alice.invoke.associateIntegrationWithSigningAuthority({
                integrationId,
                signingAuthorityId,
            });

            const listingId = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'Content Type Test App',
                    tagline: 'Testing content type',
                    full_description: 'App for testing content type',
                    icon_url: 'https://example.com/icon.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
                },
            });

            const listing = await alice.invoke.getListing({ listingId });
            
            const response = await fetch(`http://localhost:4000/app/${listing.slug}/did.json`);
            expect(response.status).toBe(200);
            
            const contentType = response.headers.get('content-type');
            expect(contentType).toBe('application/json');
            
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

            const listingId = await alice.invoke.createListing({
                integrationId,
                listing: {
                    display_name: 'Public Test App',
                    tagline: 'Publicly accessible app',
                    full_description: 'App for testing public access',
                    icon_url: 'https://example.com/icon.png',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
                },
            });

            // Set to LISTED status
            await alice.invoke.adminUpdateListingStatus({
                listingId,
                status: 'LISTED',
            });

            const listing = await alice.invoke.getListing({ listingId });
            
            // Test public listing by slug lookup
            const publicListing = await alice.invoke.getPublicListing({
                listingId: listing.slug,
            });

            expect(publicListing?.display_name).toBe('Public Test App');
            expect(publicListing?.app_listing_status).toBe('LISTED');
        });
    });
});