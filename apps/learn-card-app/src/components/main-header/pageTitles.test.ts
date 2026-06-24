import { describe, it, expect } from 'vitest';
import { getPageTitle } from './pageTitles';

describe('getPageTitle (LC-1921 scroll title)', () => {
    it('maps known routes to their page titles', () => {
        expect(getPageTitle('/passport')).toBe('Passport');
        expect(getPageTitle('/dashboard')).toBe('Dashboard');
        expect(getPageTitle('/launchpad')).toBe('Apps');
        expect(getPageTitle('/contacts')).toBe('Contacts');
        expect(getPageTitle('/notifications')).toBe('Alerts');
    });

    it('matches by route prefix so detail routes keep the section title', () => {
        expect(getPageTitle('/passport/some-credential-id')).toBe('Passport');
    });

    it('returns null for unmapped routes (caller falls back to brand)', () => {
        expect(getPageTitle('/totally-unknown')).toBeNull();
    });
});
