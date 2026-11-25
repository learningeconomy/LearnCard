import { describe, expect, it } from 'vitest';

import { buildAccountSecureUrl } from './accountSecureLink';

describe('buildAccountSecureUrl', () => {
    it('builds the secure-account path on the tenant app URL', () => {
        expect(buildAccountSecureUrl({ baseUrl: 'https://learncard.app' })).toBe(
            'https://learncard.app/account/secure'
        );
        expect(buildAccountSecureUrl({ baseUrl: 'https://vetpass.app' })).toBe(
            'https://vetpass.app/account/secure'
        );
    });

    it('never doubles the slash when baseUrl has a trailing slash', () => {
        expect(buildAccountSecureUrl({ baseUrl: 'https://learncard.app/' })).toBe(
            'https://learncard.app/account/secure'
        );
    });

    it('carries no query string (no token in the link)', () => {
        expect(new URL(buildAccountSecureUrl({ baseUrl: 'https://learncard.app' })).search).toBe(
            ''
        );
    });
});
