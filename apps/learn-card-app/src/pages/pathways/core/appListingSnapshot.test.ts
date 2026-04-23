import { describe, expect, it } from 'vitest';

import {
    buildAppListingSnapshot,
    type ListingSnapshotInput,
} from './appListingSnapshot';

const NOW = '2026-04-23T12:00:00.000Z';

const fullListing: ListingSnapshotInput = {
    name: 'Coursera — AWS Cloud Essentials',
    category: 'Learning',
    launch_type: 'DIRECT_LINK',
    tagline: 'Learn the fundamentals of AWS cloud.',
    icon_url: 'https://cdn.example/icon.png',
    semanticTags: ['video-lecture', 'passive', 'aws'],
};

describe('buildAppListingSnapshot', () => {
    it('projects a full listing into a complete snapshot', () => {
        const snap = buildAppListingSnapshot(fullListing, { now: NOW });

        expect(snap).toEqual({
            displayName: 'Coursera — AWS Cloud Essentials',
            category: 'Learning',
            launchType: 'DIRECT_LINK',
            tagline: 'Learn the fundamentals of AWS cloud.',
            iconUrl: 'https://cdn.example/icon.png',
            semanticTags: ['video-lecture', 'passive', 'aws'],
            snapshottedAt: NOW,
        });
    });

    it('returns null when the listing has no display name', () => {
        expect(buildAppListingSnapshot({ name: '' }, { now: NOW })).toBeNull();
        expect(buildAppListingSnapshot({ name: '   ' }, { now: NOW })).toBeNull();
    });

    it('trims whitespace from all string fields', () => {
        const snap = buildAppListingSnapshot(
            {
                name: '  Coursera  ',
                category: '  Learning  ',
                launch_type: ' DIRECT_LINK ',
                tagline: '  tag  ',
                icon_url: '  https://cdn.example/icon.png  ',
            },
            { now: NOW },
        );

        expect(snap).toEqual({
            displayName: 'Coursera',
            category: 'Learning',
            launchType: 'DIRECT_LINK',
            tagline: 'tag',
            iconUrl: 'https://cdn.example/icon.png',
            snapshottedAt: NOW,
        });
    });

    it('omits optional fields when they are empty rather than carrying empty strings', () => {
        const snap = buildAppListingSnapshot(
            {
                name: 'Coursera',
                category: '',
                launch_type: '',
                tagline: '',
                icon_url: '',
            },
            { now: NOW },
        );

        expect(snap).toEqual({
            displayName: 'Coursera',
            snapshottedAt: NOW,
        });
        // Spot-check the absence — not `undefined`, not present.
        expect(snap && 'category' in snap).toBe(false);
        expect(snap && 'launchType' in snap).toBe(false);
    });

    it('falls back to `type` when the listing lacks an explicit `category`', () => {
        // Listings in the registry may carry either field name; the
        // snapshot should tolerate the older shape without losing
        // categorization for agents.
        const snap = buildAppListingSnapshot(
            {
                name: 'Coursera',
                type: 'Learning',
            },
            { now: NOW },
        );

        expect(snap?.category).toBe('Learning');
    });

    it('prefers explicit category over type when both are present', () => {
        const snap = buildAppListingSnapshot(
            {
                name: 'Coursera',
                category: 'Learning',
                type: 'Other',
            },
            { now: NOW },
        );

        expect(snap?.category).toBe('Learning');
    });

    it('copies semanticTags into a fresh array (not aliased to the input)', () => {
        const tags = ['passive', 'aws'];
        const snap = buildAppListingSnapshot(
            {
                name: 'Coursera',
                semanticTags: tags,
            },
            { now: NOW },
        );

        expect(snap?.semanticTags).toEqual(tags);
        expect(snap?.semanticTags).not.toBe(tags);
    });

    it('omits semanticTags when the input provides an empty array', () => {
        const snap = buildAppListingSnapshot(
            {
                name: 'Coursera',
                semanticTags: [],
            },
            { now: NOW },
        );

        expect(snap && 'semanticTags' in snap).toBe(false);
    });

    it('uses the provided `now` timestamp verbatim', () => {
        const snap = buildAppListingSnapshot({ name: 'Coursera' }, { now: NOW });

        expect(snap?.snapshottedAt).toBe(NOW);
    });

    it('stamps the current wall-clock time when `now` is omitted', () => {
        const before = Date.now();
        const snap = buildAppListingSnapshot({ name: 'Coursera' });
        const after = Date.now();

        const stamped = Date.parse(snap!.snapshottedAt);

        expect(stamped).toBeGreaterThanOrEqual(before);
        expect(stamped).toBeLessThanOrEqual(after);
    });
});
