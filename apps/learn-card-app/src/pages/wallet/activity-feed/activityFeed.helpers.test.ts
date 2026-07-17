import { describe, it, expect, vi } from 'vitest';
vi.mock('learn-card-base', async () =>
    (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);
import { CredentialCategoryEnum } from 'learn-card-base';
import {
    resolveActivityCategory,
    toActivityFeedVM,
    groupActivitiesByMonth,
    isHiddenActivity,
    relativeTimeBucket,
    groupByRelativeTime,
} from './activityFeed.helpers';

const isoDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

const record = (over: Partial<any> = {}) => ({
    id: 'a1',
    activityId: 'x1',
    eventType: 'CREATED',
    timestamp: '2026-06-23T10:00:00Z',
    actorProfileId: 'me',
    recipientType: 'profile',
    recipientIdentifier: 'justin',
    source: 'sendBoost',
    boost: { id: 'b1', name: 'Coding 101', category: 'socialBadge' },
    recipientProfile: { profileId: 'justin', displayName: 'Justin Smith' },
    ...over,
});

describe('resolveActivityCategory', () => {
    it('maps an enum key string to the enum', () => {
        expect(resolveActivityCategory('socialBadge')).toBe(CredentialCategoryEnum.socialBadge);
        expect(resolveActivityCategory('achievement')).toBe(CredentialCategoryEnum.achievement);
    });
    it('maps the enum display value (how boosts persist category) to the enum', () => {
        expect(resolveActivityCategory('Social Badge')).toBe(CredentialCategoryEnum.socialBadge);
        expect(resolveActivityCategory('Achievement')).toBe(CredentialCategoryEnum.achievement);
        expect(resolveActivityCategory('ID')).toBe(CredentialCategoryEnum.id);
        expect(resolveActivityCategory('Work History')).toBe(CredentialCategoryEnum.workHistory);
    });
    it('falls back to socialBadge for unknown/missing', () => {
        expect(resolveActivityCategory(undefined)).toBe(CredentialCategoryEnum.socialBadge);
        expect(resolveActivityCategory('nonsense')).toBe(CredentialCategoryEnum.socialBadge);
    });
});

describe('toActivityFeedVM', () => {
    it('builds a "sent" VM with recipient + boost details', () => {
        const vm = toActivityFeedVM(record(), 'me');
        expect(vm.direction).toBe('sent');
        expect(vm.title).toBe('You sent a Badge to Justin Smith');
        expect(vm.category).toBe(CredentialCategoryEnum.socialBadge);
        expect(vm.categoryLabel).toBe('Badge');
        expect(vm.credentialType).toBe('Coding 101');
        expect(vm.timestamp).toBe('2026-06-23T10:00:00Z');
    });
    it('resolves the real category icon from a display-value category', () => {
        const vm = toActivityFeedVM(
            record({ boost: { id: 'b1', name: 'Diploma', category: 'Achievement' } }),
            'me'
        );
        expect(vm.category).toBe(CredentialCategoryEnum.achievement);
    });
    it('carries the recipient profile image into the avatar', () => {
        const vm = toActivityFeedVM(
            record({
                recipientProfile: {
                    profileId: 'justin',
                    displayName: 'Justin Smith',
                    image: 'https://example.com/justin.png',
                },
            }),
            'me'
        );
        expect(vm.avatar.image).toBe('https://example.com/justin.png');
    });
    it('builds a "received" VM when the actor is not me', () => {
        const vm = toActivityFeedVM(record({ actorProfileId: 'vanderbilt' }), 'me');
        expect(vm.direction).toBe('received');
        expect(vm.title).toContain('sent you a Badge');
    });
    it('degrades gracefully when recipient/boost details are missing', () => {
        const vm = toActivityFeedVM(
            record({ boost: undefined, recipientProfile: undefined }),
            'me'
        );
        expect(vm.title).toBe('You sent a Credential to justin');
        expect(vm.category).toBe(CredentialCategoryEnum.socialBadge);
    });
    it('marks an unknown category as a generic credential (neutral icon)', () => {
        const known = toActivityFeedVM(record(), 'me');
        expect(known.isGenericCredential).toBe(false);
        const generic = toActivityFeedVM(record({ boost: undefined }), 'me');
        expect(generic.isGenericCredential).toBe(true);
        const unmatched = toActivityFeedVM(
            record({ boost: { id: 'b', name: 'X', category: 'not-a-real-category' } }),
            'me'
        );
        expect(unmatched.isGenericCredential).toBe(true);
    });
    it('phrases a self-issued credential as "added to your passport"', () => {
        const vm = toActivityFeedVM(
            record({ recipientProfile: { profileId: 'me', displayName: 'Me' } }),
            'me'
        );
        expect(vm.isSelf).toBe(true);
        expect(vm.title).toBe('You added a Badge to your passport');
    });
    it('does not treat a send to someone else as self', () => {
        const vm = toActivityFeedVM(record(), 'me');
        expect(vm.isSelf).toBe(false);
    });
    it('maps eventType to a friendly status label', () => {
        expect(toActivityFeedVM(record({ eventType: 'CLAIMED' }), 'me').statusLabel).toBe(
            'Claimed'
        );
        expect(toActivityFeedVM(record({ eventType: 'DELIVERED' }), 'me').statusLabel).toBe('Sent');
        expect(toActivityFeedVM(record({ eventType: 'EXPIRED' }), 'me').statusLabel).toBe(
            'Expired'
        );
        expect(toActivityFeedVM(record({ eventType: 'FAILED' }), 'me').statusLabel).toBe(
            'Not delivered'
        );
    });
    it('maps eventType to a status tone for emphasis', () => {
        expect(toActivityFeedVM(record({ eventType: 'CLAIMED' }), 'me').statusTone).toBe(
            'positive'
        );
        expect(toActivityFeedVM(record({ eventType: 'DELIVERED' }), 'me').statusTone).toBe(
            'neutral'
        );
        expect(toActivityFeedVM(record({ eventType: 'EXPIRED' }), 'me').statusTone).toBe('warning');
        expect(toActivityFeedVM(record({ eventType: 'FAILED' }), 'me').statusTone).toBe('critical');
    });
    it('splits the title into an emphasized lead and a de-emphasized recipient', () => {
        const vm = toActivityFeedVM(
            record({ recipientIdentifier: 'custard7@gmail.com', recipientProfile: undefined }),
            'me'
        );
        expect(vm.titleLead).toBe('You sent a Badge to');
        expect(vm.titleSubject).toBe('custard7@gmail.com');
    });
    it('varies the verb by latest lifecycle status', () => {
        const claimed = toActivityFeedVM(record({ eventType: 'CLAIMED' }), 'me');
        expect(claimed.titleLead).toBe('Badge claimed by');
        expect(claimed.title).toBe('Badge claimed by Justin Smith');

        const expired = toActivityFeedVM(record({ eventType: 'EXPIRED' }), 'me');
        expect(expired.titleLead).toBe('Expired Badge for');

        const failed = toActivityFeedVM(record({ eventType: 'FAILED' }), 'me');
        expect(failed.titleLead).toBe("Couldn't deliver Badge to");
    });
    it('keeps a self-issued credential as a single (no-recipient) title', () => {
        const vm = toActivityFeedVM(
            record({ recipientProfile: { profileId: 'me', displayName: 'Me' } }),
            'me'
        );
        expect(vm.titleLead).toBe('You added a Badge to your passport');
        expect(vm.titleSubject).toBeUndefined();
    });
});

describe('relativeTimeBucket', () => {
    it('labels today and yesterday', () => {
        expect(relativeTimeBucket(isoDaysAgo(0))).toBe('Today');
        expect(relativeTimeBucket(isoDaysAgo(1))).toBe('Yesterday');
    });
    it('labels a prior year by its year and missing dates as Earlier', () => {
        expect(relativeTimeBucket('2020-03-04T00:00:00Z')).toBe('2020');
        expect(relativeTimeBucket(undefined)).toBe('Earlier');
        expect(relativeTimeBucket('not-a-date')).toBe('Earlier');
    });
});

describe('groupByRelativeTime', () => {
    it('groups consecutive same-bucket items and preserves order', () => {
        const items = [
            { uri: 'a', date: isoDaysAgo(0) },
            { uri: 'b', date: isoDaysAgo(0) },
            { uri: 'c', date: '2019-06-15T12:00:00Z' },
        ];
        const groups = groupByRelativeTime(items, i => i.date);
        expect(groups.map(g => g.label)).toEqual(['Today', '2019']);
        expect(groups[0].items.map(i => i.uri)).toEqual(['a', 'b']);
        expect(groups[1].items.map(i => i.uri)).toEqual(['c']);
    });
});

describe('isHiddenActivity', () => {
    it('hides internal/system categories', () => {
        expect(isHiddenActivity('Self-Assigned Skills')).toBe(true);
        expect(isHiddenActivity('VerifiableData')).toBe(true);
        expect(isHiddenActivity('AI Summary')).toBe(true);
        expect(isHiddenActivity('AI Topic')).toBe(true);
        expect(isHiddenActivity('AI Sessions')).toBe(true);
        expect(isHiddenActivity('ai-topic')).toBe(true);
        expect(isHiddenActivity('Pay Rate')).toBe(true);
    });
    it('shows normal and unknown categories', () => {
        expect(isHiddenActivity('Social Badge')).toBe(false);
        expect(isHiddenActivity('Achievement')).toBe(false);
        expect(isHiddenActivity(undefined)).toBe(false);
        expect(isHiddenActivity('not-a-real-category')).toBe(false);
    });
});

describe('groupActivitiesByMonth', () => {
    it('groups VMs into month buckets, newest first, preserving order within', () => {
        const vms = [
            toActivityFeedVM(record({ id: 'a', timestamp: '2026-06-23T00:00:00Z' }), 'me'),
            toActivityFeedVM(record({ id: 'b', timestamp: '2026-06-01T00:00:00Z' }), 'me'),
            toActivityFeedVM(record({ id: 'c', timestamp: '2026-05-30T00:00:00Z' }), 'me'),
        ];
        const groups = groupActivitiesByMonth(vms);
        expect(groups.map(g => g.label)).toEqual(['JUNE 2026', 'MAY 2026']);
        expect(groups[0].items.map(i => i.id)).toEqual(['a', 'b']);
        expect(groups[1].items.map(i => i.id)).toEqual(['c']);
    });

    it('keeps one bucket per month even when same-month items are not consecutive', () => {
        // 'a' (Jun) then 'b' (May) then 'c' (Jun) — the old linear grouping would
        // have opened a second "JUNE 2026" bucket for 'c'.
        const vms = [
            toActivityFeedVM(record({ id: 'a', timestamp: '2026-06-23T00:00:00Z' }), 'me'),
            toActivityFeedVM(record({ id: 'b', timestamp: '2026-05-30T00:00:00Z' }), 'me'),
            toActivityFeedVM(record({ id: 'c', timestamp: '2026-06-01T00:00:00Z' }), 'me'),
        ];
        const groups = groupActivitiesByMonth(vms);
        expect(groups.map(g => g.label)).toEqual(['JUNE 2026', 'MAY 2026']);
        expect(groups[0].items.map(i => i.id)).toEqual(['a', 'c']);
        expect(groups[1].items.map(i => i.id)).toEqual(['b']);
    });
});
