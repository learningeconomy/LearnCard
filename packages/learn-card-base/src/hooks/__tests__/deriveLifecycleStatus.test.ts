import { describe, expect, it } from 'vitest';
import { deriveLifecycleStatus } from '../deriveLifecycleStatus';

describe('deriveLifecycleStatus', () => {
    it('gives a set revocation bit precedence over suspension', () => {
        expect(
            deriveLifecycleStatus({
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'suspension',
                        isSet: true,
                    },
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: true,
                    },
                ],
            })
        ).toBe('revoked');
    });

    it.each([
        ['revoked', 'revocation'],
        ['suspended', 'suspension'],
    ] as const)('returns %s for a set %s entry', (expected, purpose) => {
        expect(
            deriveLifecycleStatus({
                status: [
                    { entryType: 'BitstringStatusListEntry', statusPurpose: purpose, isSet: true },
                ],
            })
        ).toBe(expected);
    });

    it('fails open for empty checks and unrelated verification errors', () => {
        expect(deriveLifecycleStatus(undefined)).toBe('active');
        expect(deriveLifecycleStatus({ errors: ['proof could not be loaded'] })).toBe('active');
    });

    it.each(['credential is revoked', 'credential is suspended'])(
        'fails open when a verification error says "%s"',
        error => {
            expect(deriveLifecycleStatus({ errors: [error] })).toBe('active');
        }
    );
});
