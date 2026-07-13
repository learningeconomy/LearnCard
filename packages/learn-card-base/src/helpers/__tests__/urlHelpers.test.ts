// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { appendQueryParams } from '../urlHelpers';

describe('appendQueryParams', () => {
    it('adds a param to a URL with no existing query string', () => {
        expect(
            appendQueryParams('https://foo.com/jobs', {
                lc_host_override: 'https://learncard.app',
            })
        ).toBe('https://foo.com/jobs?lc_host_override=https%3A%2F%2Flearncard.app');
    });

    it('merges with an existing query string instead of producing a double-?', () => {
        const result = appendQueryParams('https://foo.com/jobs?embed=partner-connect', {
            lc_host_override: 'https://learncard.app',
        });

        expect(result).not.toContain('?embed=partner-connect?');

        const params = new URL(result).searchParams;
        expect(params.get('embed')).toBe('partner-connect');
        expect(params.get('lc_host_override')).toBe('https://learncard.app');
    });

    it('overwrites an existing value for the same key', () => {
        const result = appendQueryParams('https://foo.com?lc_host_override=https://old.app', {
            lc_host_override: 'https://new.app',
        });

        expect(new URL(result).searchParams.get('lc_host_override')).toBe('https://new.app');
    });

    it('preserves the URL fragment', () => {
        const result = appendQueryParams('https://foo.com/jobs#section', { a: 'b' });

        expect(result).toContain('#section');
        expect(new URL(result).searchParams.get('a')).toBe('b');
    });

    it('sets multiple params at once', () => {
        const params = new URL(appendQueryParams('https://foo.com', { a: '1', b: '2' }))
            .searchParams;

        expect(params.get('a')).toBe('1');
        expect(params.get('b')).toBe('2');
    });

    it('throws on an invalid absolute URL', () => {
        expect(() => appendQueryParams('/relative/path', { a: 'b' })).toThrow();
    });
});
