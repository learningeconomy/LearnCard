import { describe, expect, it } from 'vitest';
import { recipientOf, templateUriOf } from './revoke';

describe('revoke targeting', () => {
    it('reads the template URI from the credential boostId', () => {
        expect(templateUriOf({ boostId: 'lc:network:x/trpc:boost:1' }, {})).toBe(
            'lc:network:x/trpc:boost:1'
        );
    });

    it('prefers an explicit --template-uri', () => {
        expect(templateUriOf({ boostId: 'lc:boost:a' }, { templateUri: 'lc:boost:b' })).toBe(
            'lc:boost:b'
        );
    });

    it('explains when a credential did not come from a template', () => {
        expect(() => templateUriOf({ id: 'urn:uuid:1' }, {})).toThrow(/not issued from a template/);
    });

    it('finds the recipient holding the exact credential URI', () => {
        const records = [
            { to: { profileId: 'alice' }, uri: 'lc:network:x/trpc:credential:1' },
            { to: { profileId: 'bob' }, uri: 'lc:network:x/trpc:credential:2' },
        ];
        expect(recipientOf(records, 'lc:network:x/trpc:credential:2')).toBe('bob');
        expect(recipientOf(records, 'lc:network:x/trpc:credential:9')).toBeUndefined();
    });
});
