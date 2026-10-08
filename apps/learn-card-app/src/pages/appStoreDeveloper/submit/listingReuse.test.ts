import { describe, expect, it } from 'vitest';

import { findReusableListing } from './listingReuse';

const context = {
    previewKey: 'partner-preview:http://localhost:4321/:Quiz Quest',
    previewUrl: 'http://localhost:4321/',
    displayName: 'Quiz Quest',
};

const listing = (
    id: string,
    overrides: Partial<{
        app_listing_status: 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'ARCHIVED';
        launch_type: 'EMBEDDED_IFRAME' | 'DIRECT_LINK';
        launch_config_json: string;
        tagline: string;
    }> = {}
) => ({
    listing_id: id,
    app_listing_status: 'DRAFT' as const,
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ url: 'https://quizquest.app' }),
    display_name: 'Quiz Quest',
    tagline: 'Learn by playing',
    ...overrides,
});

describe('findReusableListing', () => {
    it('prefers the listing this browser last worked on, even once submitted', () => {
        const listings = [listing('a'), listing('b', { app_listing_status: 'PENDING_REVIEW' })];

        expect(
            findReusableListing(listings, { ...context, storedListingId: 'b' })?.listing_id
        ).toBe('b');
    });

    it('finds the preview draft made for this app', () => {
        const listings = [
            listing('other'),
            listing('preview', {
                launch_config_json: JSON.stringify({ devPreviewKey: context.previewKey }),
            }),
        ];

        expect(findReusableListing(listings, context)?.listing_id).toBe('preview');
    });

    it('reuses a draft left by an older publish flow instead of creating another', () => {
        const listings = [listing('legacy-1'), listing('legacy-2')];

        expect(findReusableListing(listings, context)?.listing_id).toBe('legacy-1');
        expect(findReusableListing(listings, context)?.listing_id).toBe('legacy-1');
    });

    it('ignores submitted listings and other app types when nothing was stored', () => {
        const listings = [
            listing('live', { app_listing_status: 'LISTED' }),
            listing('link', { launch_type: 'DIRECT_LINK' }),
        ];

        expect(findReusableListing(listings, context)).toBeUndefined();
    });

    it('ignores a stored listing that no longer exists', () => {
        expect(
            findReusableListing([listing('a')], { ...context, storedListingId: 'gone' })?.listing_id
        ).toBe('a');
    });
});
