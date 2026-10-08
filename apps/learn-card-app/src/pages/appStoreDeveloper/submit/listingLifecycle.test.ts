import { describe, expect, it } from 'vitest';

import { getListingMode, isListingLocked, withPendingChanges } from './listingLifecycle';

describe('getListingMode', () => {
    it('maps each listing state to what the developer can do', () => {
        expect(getListingMode(null)).toBe('draft');
        expect(getListingMode({ app_listing_status: 'DRAFT' })).toBe('draft');
        expect(getListingMode({ app_listing_status: 'PENDING_REVIEW' })).toBe('in-review');
        expect(getListingMode({ app_listing_status: 'LISTED' })).toBe('live');
        expect(getListingMode({ app_listing_status: 'ARCHIVED' })).toBe('removed');
    });

    it('tells a live app with an update in review apart from one being edited', () => {
        expect(
            getListingMode({
                app_listing_status: 'LISTED',
                pending_update: { status: 'DRAFT', changes: {} },
            })
        ).toBe('live');
        expect(
            getListingMode({
                app_listing_status: 'LISTED',
                pending_update: { status: 'PENDING_REVIEW', changes: {} },
            })
        ).toBe('update-in-review');
    });
});

describe('isListingLocked', () => {
    it('locks editing only while something is in review or removed', () => {
        expect(isListingLocked('draft')).toBe(false);
        expect(isListingLocked('live')).toBe(false);
        expect(isListingLocked('in-review')).toBe(true);
        expect(isListingLocked('update-in-review')).toBe(true);
        expect(isListingLocked('removed')).toBe(true);
    });
});

describe('withPendingChanges', () => {
    it('shows held changes on top of the live listing', () => {
        expect(
            withPendingChanges({
                display_name: 'Quiz Quest',
                tagline: 'Live tagline',
                pending_update: { status: 'DRAFT', changes: { tagline: 'New tagline' } },
            })
        ).toMatchObject({ display_name: 'Quiz Quest', tagline: 'New tagline' });
    });
});
