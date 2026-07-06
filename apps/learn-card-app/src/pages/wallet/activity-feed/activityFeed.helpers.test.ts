import { describe, it, expect, vi } from 'vitest';
vi.mock('learn-card-base', async () =>
    (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);
import { CredentialCategoryEnum } from 'learn-card-base';
import {
    resolveActivityCategory,
    toActivityFeedVM,
    groupActivitiesByMonth,
} from './activityFeed.helpers';

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
    it('maps a known category string to the enum', () => {
        expect(resolveActivityCategory('socialBadge')).toBe(CredentialCategoryEnum.socialBadge);
        expect(resolveActivityCategory('achievement')).toBe(CredentialCategoryEnum.achievement);
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
        expect(vm.credentialType).toBe('Coding 101');
        expect(vm.timestamp).toBe('2026-06-23T10:00:00Z');
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
