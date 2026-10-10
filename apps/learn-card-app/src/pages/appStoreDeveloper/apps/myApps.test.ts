import { describe, expect, it } from 'vitest';
import type { AppStoreListing } from '@learncard/types';

import { getAppStatusPath, toMyApps } from './myApps';

const listing = (
    id: string,
    name: string,
    app_listing_status: AppStoreListing['app_listing_status'],
    pending_update?: AppStoreListing['pending_update']
): AppStoreListing => ({
    listing_id: id,
    display_name: name,
    tagline: 'Tagline',
    full_description: 'Description',
    icon_url: 'https://cdn.filestackcontent.com/icon',
    app_listing_status,
    launch_type: 'EMBEDDED_IFRAME',
    launch_config_json: '{}',
    pending_update,
});

describe('toMyApps', () => {
    it('lists live apps first, then in review, drafts, and removed', () => {
        const apps = toMyApps([
            { integrationId: 'a', listing: listing('1', 'Draft App', 'DRAFT') },
            { integrationId: 'b', listing: listing('2', 'Gone App', 'ARCHIVED') },
            { integrationId: 'a', listing: listing('3', 'Review App', 'PENDING_REVIEW') },
            { integrationId: 'b', listing: listing('4', 'Live App', 'LISTED') },
        ]);

        expect(apps.map(app => app.mode)).toEqual(['live', 'in-review', 'draft', 'removed']);
    });

    it('nudges drafts and live apps with unsubmitted changes', () => {
        const apps = toMyApps([
            { integrationId: 'a', listing: listing('1', 'Draft App', 'DRAFT') },
            {
                integrationId: 'a',
                listing: listing('2', 'Live App', 'LISTED', {
                    status: 'DRAFT',
                    changes: { tagline: 'Newer' },
                }),
            },
        ]);

        expect(apps.find(app => app.mode === 'draft')?.nudge).toBe('Finish your listing');
        const live = apps.find(app => app.mode === 'live');
        expect(live?.nudge).toBe('Changes not submitted');
        expect(live?.listing.tagline).toBe('Newer');
    });
});

describe('getAppStatusPath', () => {
    it('points at the permanent status page', () => {
        expect(getAppStatusPath('abc')).toBe('/app-store/developer/apps/abc');
    });
});
