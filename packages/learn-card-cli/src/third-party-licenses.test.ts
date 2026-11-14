import { describe, expect, it } from 'vitest';

import {
    disallowedPackages,
    isLicenseAllowed,
    manifestLicense,
    UNKNOWN_LICENSE,
} from '../scripts/third-party-licenses';

describe('manifestLicense', () => {
    it('reads the SPDX string form', () => {
        expect(manifestLicense({ license: 'MIT' })).toBe('MIT');
    });

    it('reads the legacy object and array forms', () => {
        expect(manifestLicense({ license: { type: 'ISC' } })).toBe('ISC');
        expect(manifestLicense({ licenses: [{ type: 'MIT', url: 'x' }] })).toBe('MIT');
        expect(manifestLicense({ licenses: [{ type: 'MIT' }, { type: 'GPL-3.0' }] })).toBe(
            '(MIT OR GPL-3.0)'
        );
    });

    it('reports a missing licence as unknown', () => {
        expect(manifestLicense({})).toBe(UNKNOWN_LICENSE);
    });
});

describe('isLicenseAllowed', () => {
    it('allows permissive licences', () => {
        for (const license of ['MIT', 'Apache-2.0', 'BSD-3-Clause', '0BSD', 'ISC']) {
            expect(isLicenseAllowed(license)).toBe(true);
        }
    });

    it('rejects copyleft and unknown licences', () => {
        for (const license of [
            'GPL-3.0-or-later',
            'AGPL-3.0',
            UNKNOWN_LICENSE,
            'SEE LICENSE IN x',
        ]) {
            expect(isLicenseAllowed(license)).toBe(false);
        }
    });

    it('needs one allowed alternative for OR and every operand for AND', () => {
        expect(isLicenseAllowed('(MIT OR GPL-3.0-or-later)')).toBe(true);
        expect(isLicenseAllowed('Apache-2.0 OR MIT')).toBe(true);
        expect(isLicenseAllowed('(MIT AND Zlib)')).toBe(true);
        expect(isLicenseAllowed('(MIT AND GPL-3.0-or-later)')).toBe(false);
        expect(isLicenseAllowed('(GPL-2.0 OR GPL-3.0)')).toBe(false);
        expect(isLicenseAllowed('MIT AND (GPL-3.0 OR ISC)')).toBe(true);
    });
});

describe('disallowedPackages', () => {
    it('reports packages outside the allowlist unless they are a listed exception', () => {
        const result = disallowedPackages([
            { name: 'fine', version: '1.0.0', license: 'MIT' },
            { name: 'copyleft', version: '1.0.0', license: 'GPL-3.0-or-later' },
            { name: 'unlicensed', version: '1.0.0', license: UNKNOWN_LICENSE },
            { name: '@uniswap/default-token-list', version: '4.1.0', license: 'GPL-3.0-or-later' },
        ]);

        expect(result.map(({ name }) => name)).toEqual(['copyleft', 'unlicensed']);
    });
});
