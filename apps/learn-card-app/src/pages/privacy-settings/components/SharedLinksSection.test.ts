// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getSharedLinkViewStatus } from './SharedLinksSection';

describe('shared link filters', () => {
    const now = new Date('2026-09-22T12:00:00.000Z').getTime();

    it('keeps stopped links in Stopped even when their expiry is past', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'stopped', expiresAt: '2026-09-20T00:00:00.000Z' },
                now
            )
        ).toBe('stopped');
    });

    it('classifies elapsed active links as Expired', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'active', expiresAt: '2026-09-22T11:59:59.000Z' },
                now
            )
        ).toBe('expired');
    });

    it('keeps future and non-expiring links Active', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'active', expiresAt: '2026-09-23T00:00:00.000Z' },
                now
            )
        ).toBe('active');
        expect(getSharedLinkViewStatus({ status: 'active', expiresAt: null }, now)).toBe('active');
    });
});
