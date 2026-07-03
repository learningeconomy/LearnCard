import { describe, it, expect } from 'vitest';

import { pickUserOwnedSigningAuthority } from './signingAuthority.helpers';

const makeRsa = (name: string, isPrimary = false) => ({
    signingAuthority: { endpoint: 'http://localhost:5100/api' },
    relationship: { name, isPrimary, did: 'did:key:z6MkTest' },
});

describe('pickUserOwnedSigningAuthority', () => {
    it('returns undefined when there are no signing authorities', () => {
        expect(pickUserOwnedSigningAuthority(undefined)).toBeUndefined();
        expect(pickUserOwnedSigningAuthority(null)).toBeUndefined();
        expect(pickUserOwnedSigningAuthority([])).toBeUndefined();
    });

    it('skips app-owned signing authorities (app- prefix)', () => {
        const appSa = makeRsa('app-test3', true);
        const userSa = makeRsa('lca-sa');

        expect(pickUserOwnedSigningAuthority([appSa, userSa])).toBe(userSa);
    });

    it('returns undefined when only app-owned signing authorities exist', () => {
        expect(
            pickUserOwnedSigningAuthority([makeRsa('app-test3', true), makeRsa('app-zombeez')])
        ).toBeUndefined();
    });

    it('prefers the primary user-owned signing authority', () => {
        const first = makeRsa('mysa');
        const primary = makeRsa('lca-sa', true);

        expect(pickUserOwnedSigningAuthority([first, primary])).toBe(primary);
    });

    it('falls back to the first user-owned signing authority when none is primary', () => {
        const first = makeRsa('mysa');
        const second = makeRsa('lca-sa');

        expect(pickUserOwnedSigningAuthority([first, second])).toBe(first);
    });
});
