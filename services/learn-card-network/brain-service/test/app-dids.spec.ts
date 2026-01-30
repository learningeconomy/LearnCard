import { describe, it, beforeEach, afterAll, expect } from 'vitest';

import { AppStoreListing, Integration, Profile, SigningAuthority } from '@models';

import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingById, readAppStoreListingBySlug } from '@accesslayer/app-store-listing/read';
import { updateAppStoreListing } from '@accesslayer/app-store-listing/update';
import { createIntegration } from '@accesslayer/integration/create';
import { createSigningAuthority } from '@accesslayer/signing-authority/create';
import { getAppDidWeb } from '@helpers/did.helpers';

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

// Simple slug generator for testing (mirrors the one in routes/app-store.ts)
const generateSlugFromName = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

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

    describe('Slug Validation and Security', () => {
        it('demonstrates slug sanitization requirements', () => {
            // These tests show what the route layer should do for slug generation
            const testCases = [
                { input: 'Simple App', expected: 'simple-app' },
                { input: 'App with @#$%^&*()! chars', expected: 'app-with-chars' },
                { input: '   Whitespace App   ', expected: 'whitespace-app' },
                { input: 'Multiple---Hyphens', expected: 'multiple-hyphens' },
                { input: 'UPPERCASE APP', expected: 'uppercase-app' },
                { input: '123 Number App', expected: '123-number-app' },
            ];

            for (const { input, expected } of testCases) {
                const result = generateSlugFromName(input);
                expect(result).toBe(expected);
            }
        });

        it('handles very long names', () => {
            const longName = 'This is an extremely long app name that should be handled gracefully by the slug generation system';
            const result = generateSlugFromName(longName);
            
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
            expect(result).not.toContain(' '); // Should not contain spaces
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

    describe('Integration with Signing Authorities', () => {
        it('creates signing authority for app DID usage', async () => {
            const sa = await createSigningAuthority({
                name: 'lca-sa',
                did: `did:key:test${Math.random()}`,
                endpoint: 'https://example.com/sign',
                isDefault: false,
            });

            expect(sa.name).toBe('lca-sa');
            expect(sa.did).toContain('did:key:');
            expect(sa.endpoint).toBe('https://example.com/sign');
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
    });

    describe('Error Handling', () => {
        it('handles database constraints for unique listing_id', async () => {
            const listingId = 'duplicate-listing-id';
            
            await createAppStoreListing(
                makeListingInput({ listing_id: listingId })
            );

            // Second creation with same listing_id should fail
            await expect(
                createAppStoreListing(
                    makeListingInput({ listing_id: listingId })
                )
            ).rejects.toThrow();
        });

        it('handles database constraints for unique slug', async () => {
            const slug = 'duplicate-slug';
            
            await createAppStoreListing(
                makeListingInput({ slug })
            );

            // Second creation with same slug should fail due to unique constraint
            await expect(
                createAppStoreListing(
                    makeListingInput({ slug })
                )
            ).rejects.toThrow();
        });

        it('handles missing required fields', async () => {
            await expect(
                createAppStoreListing({} as any)
            ).rejects.toThrow();
        });
    });
});