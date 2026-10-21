import { beforeEach, describe, expect, it } from 'vitest';

import { forgetDeletedApp } from './forgetDeletedApp';

describe('forgetDeletedApp', () => {
    beforeEach(() => localStorage.clear());

    it('removes partner-preview entries pointing at the deleted listing', () => {
        localStorage.setItem(
            'partner-preview:https://quiz.app',
            JSON.stringify({ integrationId: 'other-integration', listingId: 'l1' })
        );
        localStorage.setItem('keep-me', 'unrelated');

        forgetDeletedApp('l1', 'i1');

        expect(localStorage.getItem('partner-preview:https://quiz.app')).toBeNull();
        expect(localStorage.getItem('keep-me')).toBe('unrelated');
    });

    it('removes partner-preview entries pointing at the deleted project', () => {
        localStorage.setItem(
            'partner-preview:https://quiz.app#key',
            JSON.stringify({ integrationId: 'i1', listingId: 'some-other-listing' })
        );

        forgetDeletedApp('l1', 'i1');

        expect(localStorage.getItem('partner-preview:https://quiz.app#key')).toBeNull();
    });

    it('leaves partner-preview entries for unrelated apps alone', () => {
        localStorage.setItem(
            'partner-preview:https://other.app',
            JSON.stringify({ integrationId: 'other-integration', listingId: 'other-listing' })
        );

        forgetDeletedApp('l1', 'i1');

        expect(localStorage.getItem('partner-preview:https://other.app')).not.toBeNull();
    });

    it('ignores malformed partner-preview entries', () => {
        localStorage.setItem('partner-preview:https://broken.app', 'not json');

        expect(() => forgetDeletedApp('l1', 'i1')).not.toThrow();
        expect(localStorage.getItem('partner-preview:https://broken.app')).toBe('not json');
    });

    it('removes the saved test address for the listing', () => {
        localStorage.setItem('lc-test-address:l1', JSON.stringify({ address: 'x', enabled: true }));

        forgetDeletedApp('l1');

        expect(localStorage.getItem('lc-test-address:l1')).toBeNull();
    });

    it('works without an integration id', () => {
        localStorage.setItem(
            'partner-preview:https://quiz.app',
            JSON.stringify({ integrationId: 'i1', listingId: 'l1' })
        );

        expect(() => forgetDeletedApp('l1')).not.toThrow();
        expect(localStorage.getItem('partner-preview:https://quiz.app')).toBeNull();
    });
});
