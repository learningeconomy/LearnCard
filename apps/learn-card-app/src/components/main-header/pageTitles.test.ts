import { describe, it, expect } from 'vitest';
import { getPageTitle } from './pageTitles';

describe('getPageTitle (LC-1921 scroll title)', () => {
    it('maps known routes to their page titles', () => {
        expect(getPageTitle('/passport')).toBe('My Passport');
        expect(getPageTitle('/dashboard')).toBe('Dashboard');
        expect(getPageTitle('/launchpad')).toBe('My Apps');
        expect(getPageTitle('/contacts')).toBe('My Contacts');
        expect(getPageTitle('/notifications')).toBe('My Alerts');
    });

    it('matches by route prefix so detail routes keep the section title', () => {
        expect(getPageTitle('/passport/some-credential-id')).toBe('My Passport');
    });

    it('does not match sibling routes that merely share a prefix', () => {
        // `/wallet-worker` must not match the `/wallet` entry.
        expect(getPageTitle('/wallet-worker')).toBeNull();
    });

    it('returns null for unmapped routes (caller falls back to brand)', () => {
        expect(getPageTitle('/totally-unknown')).toBeNull();
    });
});
