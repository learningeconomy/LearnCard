import { describe, expect, it } from 'vitest';

import { DEFAULT_APP_ICON_URL } from './constants';
import {
    EMPTY_LISTING_DETAILS,
    listingToData,
    toListingUpdates,
    toSubmissionUpdates,
} from './listingForm';
import type { ListingData } from './listingForm';

const data: ListingData = {
    ...EMPTY_LISTING_DETAILS,
    name: ' Quiz Quest ',
    tagline: 'Learn by playing',
    description: 'Answer questions.',
    iconUrl: 'https://cdn.filestackcontent.com/icon',
    screenshots: ['https://cdn.filestackcontent.com/shot', ''],
    highlights: [' Earn badges ', ''],
    ageRating: '9+',
    contactEmail: 'help@quizquest.app',
    androidAppStoreId: 'app.quizquest',
    heroColor: '#123456',
};

describe('toListingUpdates', () => {
    it('maps every listing field to its stored name', () => {
        expect(toListingUpdates(data)).toEqual({
            display_name: 'Quiz Quest',
            tagline: 'Learn by playing',
            full_description: 'Answer questions.',
            icon_url: 'https://cdn.filestackcontent.com/icon',
            screenshots: ['https://cdn.filestackcontent.com/shot'],
            highlights: ['Earn badges'],
            age_rating: '9+',
            android_app_store_id: 'app.quizquest',
            hero_background_color: '#123456',
            contact_email: 'help@quizquest.app',
        });
    });

    it('never touches how the app runs', () => {
        const updates = toListingUpdates(data);
        expect(updates).not.toHaveProperty('launch_type');
        expect(updates).not.toHaveProperty('launch_config_json');
    });

    it('leaves out blank optional fields the store would reject as empty', () => {
        const updates = toListingUpdates(data);

        expect(updates).not.toHaveProperty('privacy_policy_url');
        expect(updates).not.toHaveProperty('terms_url');
        expect(updates).not.toHaveProperty('promo_video_url');
        expect(updates).not.toHaveProperty('category');
    });

    it('leaves out malformed links and colors but keeps valid ones', () => {
        const updates = toListingUpdates({
            ...data,
            privacyPolicyUrl: 'myapp.com/privacy',
            termsUrl: 'https://quizquest.app/terms',
            heroColor: '#12',
        });

        expect(updates).not.toHaveProperty('privacy_policy_url');
        expect(updates.terms_url).toBe('https://quizquest.app/terms');
        expect(updates).not.toHaveProperty('hero_background_color');
    });

    it('leaves out blank required fields, the default icon, and an invalid email', () => {
        const updates = toListingUpdates({
            ...data,
            name: '',
            tagline: ' ',
            description: '',
            iconUrl: DEFAULT_APP_ICON_URL,
            contactEmail: 'not-an-email',
        });

        expect(updates).not.toHaveProperty('display_name');
        expect(updates).not.toHaveProperty('tagline');
        expect(updates).not.toHaveProperty('full_description');
        expect(updates).not.toHaveProperty('icon_url');
        expect(updates).not.toHaveProperty('contact_email');
    });
});

describe('listingToData', () => {
    it('ignores the placeholder text written for preview listings', () => {
        const restored = listingToData({
            display_name: 'Quiz Quest',
            tagline: 'Quiz Quest preview',
            full_description: 'Quiz Quest — draft listing created from a LearnCard app preview.',
            icon_url: DEFAULT_APP_ICON_URL,
        });

        expect(restored.tagline).toBe('');
        expect(restored.description).toBe('');
        expect(restored.iconUrl).toBe(DEFAULT_APP_ICON_URL);
    });

    it('restores saved store details', () => {
        const restored = listingToData({
            display_name: 'Quiz Quest',
            tagline: 'Learn by playing',
            full_description: 'Answer questions.',
            age_rating: '12+',
            android_app_store_id: 'app.quizquest',
            hero_background_color: '#123456',
        });

        expect(restored).toMatchObject({
            tagline: 'Learn by playing',
            description: 'Answer questions.',
            ageRating: '12+',
            androidAppStoreId: 'app.quizquest',
            heroColor: '#123456',
        });
    });
});

describe('toSubmissionUpdates', () => {
    it('points the app at its real address with no preview marker', () => {
        const updates = toSubmissionUpdates(data, {
            url: 'https://quizquest.app',
            permissions: ['request_identity'],
            contractUri: 'lc:contract:123',
        });

        expect(updates.launch_type).toBe('EMBEDDED_IFRAME');
        expect(JSON.parse(updates.launch_config_json ?? '')).toEqual({
            url: 'https://quizquest.app',
            permissions: ['request_identity'],
            contractUri: 'lc:contract:123',
        });
        expect(updates.display_name).toBe('Quiz Quest');
    });

    it('leaves out a missing consent contract', () => {
        const updates = toSubmissionUpdates(data, {
            url: 'https://quizquest.app',
            permissions: [],
            contractUri: null,
        });

        expect(JSON.parse(updates.launch_config_json ?? '')).not.toHaveProperty('contractUri');
    });
});
