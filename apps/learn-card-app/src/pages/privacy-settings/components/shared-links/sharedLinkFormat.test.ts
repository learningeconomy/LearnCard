import { describe, expect, it } from 'vitest';
import type { ShareLink } from '@learncard/types';

import {
    avatarTint,
    calendarDaysUntil,
    expiryHint,
    getSharedLinkViewStatus,
    initialsFor,
    localDateValue,
    minimumExpiryDateValue,
    selectPreviewShares,
    shareRowMeta,
    viewAllLabel,
    viewHint,
} from './sharedLinkFormat';

const share = (overrides: Partial<ShareLink> = {}): ShareLink =>
    ({
        id: 'AAAAAAAAAAAAAAAAAAAAAA',
        title: 'Career highlights',
        selectedCount: 4,
        version: 1,
        contentVersion: 1,
        status: 'active',
        contentState: 'finalized',
        createdAt: '2026-09-12T14:30:00.000Z',
        updatedAt: '2026-09-12T14:30:00.000Z',
        expiresAt: null,
        stoppedAt: null,
        viewCount: 12,
        lastViewedAt: '2026-09-21T18:15:00.000Z',
        passcodeProtected: true,
        notifyOnView: false,
        ...overrides,
    }) as ShareLink;

const now = new Date(2026, 8, 25, 10, 0, 0); // Sep 25 2026, 10:00 local

describe('status and date inputs', () => {
    it('keeps stopped links stopped even when their expiry is past', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'stopped', expiresAt: '2026-01-01T00:00:00.000Z' },
                now.getTime()
            )
        ).toBe('stopped');
    });

    it('classifies elapsed active links as expired', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'active', expiresAt: '2026-09-01T00:00:00.000Z' },
                now.getTime()
            )
        ).toBe('expired');
    });

    it('keeps future and non-expiring links active', () => {
        expect(getSharedLinkViewStatus({ status: 'active', expiresAt: null }, now.getTime())).toBe(
            'active'
        );
    });

    it('formats date inputs in local time', () => {
        expect(localDateValue(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
        expect(minimumExpiryDateValue(new Date(2026, 11, 31, 12))).toBe('2027-01-01');
    });
});

describe('relative expiry', () => {
    it('counts local calendar days, not 24h blocks', () => {
        expect(calendarDaysUntil(new Date(2026, 8, 25, 23, 59).toISOString(), now)).toBe(0);
        expect(calendarDaysUntil(new Date(2026, 8, 26, 0, 1).toISOString(), now)).toBe(1);
        expect(calendarDaysUntil(new Date(2026, 8, 30, 12).toISOString(), now)).toBe(5);
    });

    it('speaks like a person and flags links about to expire', () => {
        expect(expiryHint(new Date(2026, 8, 25, 23).toISOString(), now)).toEqual({
            label: 'Expires today',
            soon: true,
        });
        expect(expiryHint(new Date(2026, 8, 26, 12).toISOString(), now)).toEqual({
            label: 'Expires tomorrow',
            soon: true,
        });
        expect(expiryHint(new Date(2026, 8, 28, 12).toISOString(), now)).toEqual({
            label: 'Expires in 3 days',
            soon: true,
        });
        expect(expiryHint(new Date(2026, 9, 2, 12).toISOString(), now)).toEqual({
            label: 'Expires in 7 days',
            soon: false,
        });
        expect(expiryHint(new Date(2026, 11, 25, 12).toISOString(), now).label).toMatch(
            /^Expires /
        );
    });
});

describe('open counts', () => {
    it('stays silent when the server omits view data', () => {
        expect(viewHint({ viewCount: undefined, lastViewedAt: null }, now.getTime())).toBeNull();
    });

    it('counts opens with personality', () => {
        expect(viewHint({ viewCount: 0, lastViewedAt: null }, now.getTime())).toEqual({
            label: 'Not opened yet',
            fresh: false,
        });
        expect(
            viewHint({ viewCount: 1, lastViewedAt: '2026-09-01T00:00:00.000Z' }, now.getTime())
        ).toEqual({ label: 'Opened once', fresh: false });
        expect(
            viewHint(
                { viewCount: 3, lastViewedAt: new Date(2026, 8, 25, 8).toISOString() },
                now.getTime()
            )
        ).toEqual({ label: 'Opened 3 times', fresh: true });
    });
});

describe('row meta', () => {
    it('lets a pending change replace every other hint', () => {
        const meta = shareRowMeta(share(), { pending: true, showViewStats: true }, now);
        expect(meta.pending).toBe(true);
        expect(meta.hint).toBeNull();
    });

    it('prefers expiry over views', () => {
        const meta = shareRowMeta(
            share({ expiresAt: new Date(2026, 8, 26, 12).toISOString() }),
            { pending: false, showViewStats: true },
            now
        );
        expect(meta).toMatchObject({
            locked: true,
            credentials: '4 credentials',
            hint: { label: 'Expires tomorrow', tone: 'soon' },
        });
    });

    it('falls back to views only when view stats are allowed', () => {
        expect(
            shareRowMeta(share(), { pending: false, showViewStats: true }, now).hint
        ).toMatchObject({ label: 'Opened 12 times' });
        expect(
            shareRowMeta(share(), { pending: false, showViewStats: false }, now).hint
        ).toBeNull();
    });
});

describe('preview selection', () => {
    it('keeps the newest five active links', () => {
        const records = [
            share({ id: 'stopped', status: 'stopped' }),
            ...Array.from({ length: 7 }, (_, index) =>
                share({ id: `a${index}`, createdAt: new Date(2026, 8, index + 1).toISOString() })
            ),
        ];
        expect(selectPreviewShares(records, now.getTime()).map(record => record.id)).toEqual([
            'a6',
            'a5',
            'a4',
            'a3',
            'a2',
        ]);
    });

    it('labels View all with a plus when more pages exist', () => {
        expect(viewAllLabel(12, false)).toBe('View all 12');
        expect(viewAllLabel(25, true)).toBe('View all 25+');
    });
});

describe('avatars', () => {
    it('builds initials from one or two words', () => {
        expect(initialsFor('Alex Rivera')).toBe('AR');
        expect(initialsFor('acme')).toBe('A');
        expect(initialsFor('  Mary   Jane Watson ')).toBe('MW');
    });

    it('gives the same person the same tint every time', () => {
        expect(avatarTint('Alex Rivera')).toBe(avatarTint('Alex Rivera'));
        expect(avatarTint('Alex Rivera')).toMatch(/^bg-\w+-100 text-\w+-800$/);
    });
});
