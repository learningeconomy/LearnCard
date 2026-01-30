import { describe, it, beforeEach, afterAll, expect } from 'vitest';

import { AppStoreListing, Integration, Profile, SigningAuthority } from '@models';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingById, readAppStoreListingBySlug } from '@accesslayer/app-store-listing/read';
import { updateAppStoreListing } from '@accesslayer/app-store-listing/update';
import { getIntegrationForListing } from '@accesslayer/app-store-listing/relationships/read';
import { associateListingWithIntegration } from '@accesslayer/app-store-listing/relationships/create';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithSigningAuthority } from '@accesslayer/integration/relationships/create';
import { createSigningAuthority } from '@accesslayer/signing-authority/create';
import { getPrimarySigningAuthorityForIntegration } from '@accesslayer/signing-authority/relationships/read';
import { getAppDidWeb } from '@helpers/did.helpers';
import { normalizeAppSlug, isValidAppSlug } from '@helpers/slug.helpers';

// Test helpers
const makeListingInput = (overrides?: Record<string, any>) => ({
    display_name: 'Test App',
    tagline: 'A test application',
    full_description: 'This is a comprehensive test application for the app store',
    icon_url: 'https://example.com/icon.png',
    app_listing_status: 'DRAFT' as const,
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ iframeUrl: 'https://app.example.com' }),
    category: 'Learning',
    promotion_level: 'STANDARD' as const,
    ...overrides,
});

describe('App DIDs Access Layer', () => {
    beforeEach(async () => {
        // Clean up before each test
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
    });

    afterAll(async () => {
        // Clean up after all tests
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
    });

    describe('Slug Generation and Management', () => {
        it('creates listing with slug field', async () => {
            const slug = 'test-app-slug';
            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug,
                    display_name: 'Test App With Slug' 
                })
            );

            expect(listing.slug).toBe(slug);
            expect(listing.display_name).toBe('Test App With Slug');
        });

        it('allows creating listing without explicit slug', async () => {
            const listing = await createAppStoreListing(
                makeListingInput({ display_name: 'Auto Slug App' })
            );

            expect(listing.listing_id).toBeTruthy();
            expect(listing.display_name).toBe('Auto Slug App');
            // Slug may be undefined/null if not set by route logic
        });

        it('supports reading listing by slug', async () => {
            const slug = 'readable-slug';
            const created = await createAppStoreListing(
                makeListingInput({ 
                    slug,
                    display_name: 'Readable App' 
                })
            );

            const bySlug = await readAppStoreListingBySlug(slug);
            
            expect(bySlug).toBeTruthy();
            expect(bySlug?.listing_id).toBe(created.listing_id);
            expect(bySlug?.display_name).toBe('Readable App');
        });

        it('returns null for non-existent slug', async () => {
            const result = await readAppStoreListingBySlug('non-existent-slug');
            expect(result).toBeNull();
        });

        it('handles multiple listings with different slugs', async () => {
            const listing1 = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'first-app',
                    display_name: 'First App' 
                })
            );
            
            const listing2 = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'second-app',
                    display_name: 'Second App' 
                })
            );

            const firstBySlug = await readAppStoreListingBySlug('first-app');
            const secondBySlug = await readAppStoreListingBySlug('second-app');

            expect(firstBySlug?.listing_id).toBe(listing1.listing_id);
            expect(secondBySlug?.listing_id).toBe(listing2.listing_id);
        });

        it('updates listing slug', async () => {
            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'original-slug',
                    display_name: 'Original App' 
                })
            );

            await updateAppStoreListing(listing, { 
                slug: 'updated-slug',
                display_name: 'Updated App'
            });

            const originalSlugResult = await readAppStoreListingBySlug('original-slug');
            const updatedSlugResult = await readAppStoreListingBySlug('updated-slug');

            expect(originalSlugResult).toBeNull();
            expect(updatedSlugResult?.listing_id).toBe(listing.listing_id);
            expect(updatedSlugResult?.display_name).toBe('Updated App');
        });
    });

    describe('App DID Helper Functions', () => {
        it('constructs proper app DID format', () => {
            const domain = 'localhost%3A4000';
            const slug = 'test-app';
            const expectedDid = 'did:web:localhost%3A4000:app:test-app';
            
            const appDid = getAppDidWeb(domain, slug);
            expect(appDid).toBe(expectedDid);
        });

        it('handles different domain formats', () => {
            const testCases = [
                { domain: 'example.com', slug: 'app', expected: 'did:web:example.com:app:app' },
                { domain: 'sub.domain.com', slug: 'my-app', expected: 'did:web:sub.domain.com:app:my-app' },
                { domain: 'localhost%3A8080', slug: 'dev-app', expected: 'did:web:localhost%3A8080:app:dev-app' },
            ];

            for (const { domain, slug, expected } of testCases) {
                const result = getAppDidWeb(domain, slug);
                expect(result).toBe(expected);
            }
        });

        it('handles edge cases in DID construction', () => {
            // Test that the helper doesn't throw on edge cases
            expect(() => getAppDidWeb('', '')).not.toThrow();
            expect(() => getAppDidWeb('domain.com', '')).not.toThrow();
            expect(() => getAppDidWeb('', 'slug')).not.toThrow();
        });
    });

    describe('Slug Normalization', () => {
        it('normalizes display names into valid slugs', () => {
            // Tests the actual normalizeAppSlug function from the shared helper
            const testCases = [
                { input: 'Simple App', expected: 'simple-app' },
                { input: 'App with @#$%^&*()! chars', expected: 'app-with-chars' },
                { input: '   Whitespace App   ', expected: 'whitespace-app' },
                { input: 'Multiple---Hyphens', expected: 'multiple-hyphens' },
                { input: 'UPPERCASE APP', expected: 'uppercase-app' },
                { input: '123 Number App', expected: '123-number-app' },
            ];

            for (const { input, expected } of testCases) {
                const result = normalizeAppSlug(input);
                expect(result).toBe(expected);
            }
        });

        it('truncates very long names to max length', () => {
            const longName = 'This is an extremely long app name that should be handled gracefully by the slug generation system';
            const result = normalizeAppSlug(longName);
            
            expect(result).toBeTruthy();
            expect(result.length).toBeLessThanOrEqual(50); // MAX_APP_SLUG_LENGTH
            expect(result).not.toContain(' ');
        });

        it('returns default slug for empty input', () => {
            expect(normalizeAppSlug('')).toBe('app');
            expect(normalizeAppSlug('   ')).toBe('app');
            expect(normalizeAppSlug('!!!')).toBe('app');
        });
    });

    describe('App Listing Status Handling', () => {
        it('creates listings with different statuses', async () => {
            const statuses = ['DRAFT', 'PENDING_REVIEW', 'LISTED', 'ARCHIVED'] as const;
            
            const createdListings = [];
            
            for (const status of statuses) {
                const listing = await createAppStoreListing(
                    makeListingInput({ 
                        slug: `${status.toLowerCase().replace('_', '-')}-app`,
                        display_name: `${status} App`,
                        app_listing_status: status 
                    })
                );
                createdListings.push({ listing, status });
            }

            // Verify all listings were created with correct status
            for (const { listing, status } of createdListings) {
                const retrieved = await readAppStoreListingById(listing.listing_id);
                expect(retrieved?.app_listing_status).toBe(status);
            }
        });

        it('updates listing status', async () => {
            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'status-test-app',
                    app_listing_status: 'DRAFT' 
                })
            );

            expect(listing.app_listing_status).toBe('DRAFT');

            await updateAppStoreListing(listing, { app_listing_status: 'LISTED' });

            const updated = await readAppStoreListingById(listing.listing_id);
            expect(updated?.app_listing_status).toBe('LISTED');
        });

        it('supports slug lookup for all statuses', async () => {
            // App DIDs should be resolvable for all statuses to support dev/test apps
            const statuses = ['DRAFT', 'LISTED', 'ARCHIVED'] as const;
            
            for (const status of statuses) {
                const listing = await createAppStoreListing(
                    makeListingInput({ 
                        slug: `status-${status.toLowerCase()}-app`,
                        app_listing_status: status 
                    })
                );

                const bySlug = await readAppStoreListingBySlug(listing.slug!);
                expect(bySlug?.app_listing_status).toBe(status);
            }
        });
    });

    describe('Slug Validation (Security)', () => {
        it('validates correct slug formats', () => {
            const validSlugs = [
                'a',
                'test-app',
                'my-cool-app-123',
                '123app',
                'app123',
                'a1b2c3',
            ];

            for (const slug of validSlugs) {
                expect(isValidAppSlug(slug)).toBe(true);
            }
        });

        it('rejects invalid slug formats', () => {
            const invalidSlugs = [
                '',                      // Empty
                '-test',                 // Starts with hyphen
                'test-',                 // Ends with hyphen
                'Test-App',              // Uppercase
                'test_app',              // Underscore
                'test app',              // Space
                'test.app',              // Period
                '../../../etc/passwd',   // Path traversal attempt
                'app<script>',           // XSS attempt
                'app;DROP TABLE',        // SQL injection attempt
            ];

            for (const slug of invalidSlugs) {
                expect(isValidAppSlug(slug)).toBe(false);
            }
        });

        it('rejects slugs that are too long', () => {
            const longSlug = 'a'.repeat(101);
            expect(isValidAppSlug(longSlug)).toBe(false);
            
            const maxSlug = 'a'.repeat(100);
            expect(isValidAppSlug(maxSlug)).toBe(true);
        });

        it('rejects non-string inputs', () => {
            expect(isValidAppSlug(null as any)).toBe(false);
            expect(isValidAppSlug(undefined as any)).toBe(false);
            expect(isValidAppSlug(123 as any)).toBe(false);
            expect(isValidAppSlug({} as any)).toBe(false);
        });
    });

    describe('Integration with Signing Authorities', () => {
        it('creates signing authority with endpoint', async () => {
            const endpoint = 'https://example.com/sign';
            const sa = await createSigningAuthority(endpoint);

            expect(sa.endpoint).toBe(endpoint);
        });

        it('creates integration for app listing association', async () => {
            const integration = await createIntegration({
                name: 'Test App Integration',
                description: 'Integration for app DID testing',
                whitelistedDomains: ['example.com', 'localhost'],
            });

            expect(integration.name).toBe('Test App Integration');
            expect(integration.whitelistedDomains).toContain('example.com');
            expect(integration.whitelistedDomains).toContain('localhost');
        });

        it('associates integration with signing authority', async () => {
            const endpoint = 'https://example.com/sign';
            await createSigningAuthority(endpoint);

            const integration = await createIntegration({
                name: 'SA Test Integration',
                description: 'Integration for SA testing',
                whitelistedDomains: ['example.com'],
            });

            const result = await associateIntegrationWithSigningAuthority(
                integration.id,
                endpoint,
                { name: 'app-sa', did: 'did:key:test123', isPrimary: true }
            );

            expect(result).toBe(true);
        });

        it('retrieves primary signing authority for integration', async () => {
            const endpoint = 'https://example.com/sign';
            await createSigningAuthority(endpoint);

            const integration = await createIntegration({
                name: 'Primary SA Test',
                description: 'Integration for primary SA testing',
                whitelistedDomains: ['example.com'],
            });

            await associateIntegrationWithSigningAuthority(
                integration.id,
                endpoint,
                { name: 'primary-sa', did: 'did:key:primary123', isPrimary: true }
            );

            const primarySa = await getPrimarySigningAuthorityForIntegration(integration);

            expect(primarySa).toBeTruthy();
            expect(primarySa?.relationship.name).toBe('primary-sa');
            expect(primarySa?.relationship.did).toBe('did:key:primary123');
            expect(primarySa?.relationship.isPrimary).toBe(true);
        });
    });

    describe('Listing ↔ Integration Relationship', () => {
        it('associates listing with integration and retrieves it', async () => {
            const integration = await createIntegration({
                name: 'Listing Test Integration',
                description: 'Integration for listing relationship testing',
                whitelistedDomains: ['example.com'],
            });

            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'integration-test-app',
                    display_name: 'Integration Test App' 
                })
            );

            await associateListingWithIntegration(listing.listing_id, integration.id);

            const retrievedIntegration = await getIntegrationForListing(listing.listing_id);

            expect(retrievedIntegration).toBeTruthy();
            expect(retrievedIntegration?.id).toBe(integration.id);
            expect(retrievedIntegration?.name).toBe('Listing Test Integration');
        });

        it('returns null for listing without integration', async () => {
            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'no-integration-app',
                    display_name: 'No Integration App' 
                })
            );

            const integration = await getIntegrationForListing(listing.listing_id);
            expect(integration).toBeNull();
        });
    });

    describe('Full App DID Resolution Chain', () => {
        it('sets up complete chain: listing → integration → signing authority', async () => {
            // This test verifies the complete data structure needed for app DID resolution
            
            // 1. Create signing authority
            const endpoint = 'https://example.com/sign';
            await createSigningAuthority(endpoint);

            // 2. Create integration
            const integration = await createIntegration({
                name: 'Full Chain Integration',
                description: 'Complete chain test',
                whitelistedDomains: ['example.com'],
            });

            // 3. Associate SA with integration (with DID for credential issuance)
            const saDid = 'did:key:fullchain123';
            await associateIntegrationWithSigningAuthority(
                integration.id,
                endpoint,
                { name: 'chain-sa', did: saDid, isPrimary: true }
            );

            // 4. Create listing with slug
            const slug = 'full-chain-app';
            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug,
                    display_name: 'Full Chain App',
                    app_listing_status: 'LISTED'
                })
            );

            // 5. Associate listing with integration
            await associateListingWithIntegration(listing.listing_id, integration.id);

            // Verify complete chain
            const retrievedListing = await readAppStoreListingBySlug(slug);
            expect(retrievedListing).toBeTruthy();

            const retrievedIntegration = await getIntegrationForListing(retrievedListing!.listing_id);
            expect(retrievedIntegration).toBeTruthy();

            const primarySa = await getPrimarySigningAuthorityForIntegration(retrievedIntegration!);
            expect(primarySa).toBeTruthy();
            expect(primarySa?.relationship.did).toBe(saDid);

            // Verify app DID format
            const domain = 'localhost%3A4000';
            const appDid = getAppDidWeb(domain, slug);
            expect(appDid).toBe(`did:web:${domain}:app:${slug}`);
        });
    });

    describe('Edge Cases', () => {
        it('creates listing with minimal input', async () => {
            // Access layer allows creation with minimal fields
            // Validation is handled at the route level
            const listing = await createAppStoreListing({} as any);
            expect(listing.listing_id).toBeTruthy();
        });

        it('handles special characters in display_name', async () => {
            const listing = await createAppStoreListing(
                makeListingInput({ 
                    slug: 'special-chars-app',
                    display_name: 'App with émojis 🚀 & spëcial chârs!' 
                })
            );

            expect(listing.display_name).toBe('App with émojis 🚀 & spëcial chârs!');
        });

        it('handles slugs at boundary lengths', async () => {
            // Single character slug
            const singleCharListing = await createAppStoreListing(
                makeListingInput({ slug: 'a' })
            );
            expect(singleCharListing.slug).toBe('a');

            // Max length slug (100 chars)
            const maxSlug = 'a'.repeat(100);
            const maxListing = await createAppStoreListing(
                makeListingInput({ slug: maxSlug })
            );
            expect(maxListing.slug).toBe(maxSlug);
        });
    });
});