import { describe, it, expect } from 'vitest';
import { deriveLifecycleStatus } from '../deriveLifecycleStatus';

describe('deriveLifecycleStatus', () => {
    it('returns revoked when a revocation entry bit is set', () => {
        expect(
            deriveLifecycleStatus({
                checks: [],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: true,
                    },
                ],
            })
        ).toBe('revoked');
    });

    it('returns suspended when only a suspension entry bit is set', () => {
        expect(
            deriveLifecycleStatus({
                checks: [],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: false,
                    },
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'suspension',
                        isSet: true,
                    },
                ],
            })
        ).toBe('suspended');
    });

    it('returns active when no bits are set', () => {
        expect(
            deriveLifecycleStatus({
                checks: [],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: false,
                    },
                ],
            })
        ).toBe('active');
    });

    it('falls back to errors text when structured status is absent', () => {
        expect(
            deriveLifecycleStatus({ checks: [], warnings: [], errors: ['credential is revoked'] })
        ).toBe('revoked');
        expect(
            deriveLifecycleStatus({ checks: [], warnings: [], errors: ['credential is suspended'] })
        ).toBe('suspended');
    });

    it('returns active for an empty/undefined check (fail-open)', () => {
        expect(deriveLifecycleStatus(undefined)).toBe('active');
        expect(deriveLifecycleStatus({ checks: [], warnings: [], errors: [] })).toBe('active');
    });
});
