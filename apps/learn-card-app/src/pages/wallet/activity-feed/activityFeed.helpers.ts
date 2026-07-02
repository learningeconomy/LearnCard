import { CredentialCategoryEnum } from 'learn-card-base';

export type ActivityDirection = 'sent' | 'received';

export type ActivityFeedItemVM = {
    id: string;
    direction: ActivityDirection;
    actorName: string;
    counterpartyName: string;
    category: CredentialCategoryEnum;
    title: string;
    credentialType?: string;
    timestamp: string;
    unread: boolean;
};

export type ActivityMonthGroup = { label: string; items: ActivityFeedItemVM[] };

// STUB SEAM: real boost `category` values at runtime may not exactly match these
// keys (accepted limitation documented in LC-1919 spec). Anything unmatched falls
// back to socialBadge via resolveActivityCategory.
const CATEGORY_BY_STRING: Record<string, CredentialCategoryEnum> = {
    socialBadge: CredentialCategoryEnum.socialBadge,
    achievement: CredentialCategoryEnum.achievement,
    learningHistory: CredentialCategoryEnum.learningHistory,
    accomplishment: CredentialCategoryEnum.accomplishment,
    accommodation: CredentialCategoryEnum.accommodation,
    workHistory: CredentialCategoryEnum.workHistory,
    id: CredentialCategoryEnum.id,
};

const CATEGORY_LABEL: Partial<Record<CredentialCategoryEnum, string>> = {
    [CredentialCategoryEnum.socialBadge]: 'Badge',
    [CredentialCategoryEnum.achievement]: 'Achievement',
    [CredentialCategoryEnum.learningHistory]: 'Course',
    [CredentialCategoryEnum.accomplishment]: 'Portfolio item',
    [CredentialCategoryEnum.accommodation]: 'Assistance',
    [CredentialCategoryEnum.workHistory]: 'Experience',
    [CredentialCategoryEnum.id]: 'ID',
};

export const resolveActivityCategory = (category?: string): CredentialCategoryEnum =>
    (category && CATEGORY_BY_STRING[category]) || CredentialCategoryEnum.socialBadge;

type RawActivity = {
    id: string;
    eventType: string;
    timestamp: string;
    actorProfileId?: string;
    recipientIdentifier: string;
    boost?: { id: string; name?: string; category?: string };
    recipientProfile?: { profileId: string; displayName?: string };
};

export const toActivityFeedVM = (record: RawActivity, myProfileId?: string): ActivityFeedItemVM => {
    const direction: ActivityDirection =
        !myProfileId || record.actorProfileId === myProfileId ? 'sent' : 'received';
    const category = resolveActivityCategory(record.boost?.category);
    // Only label the title from the category when the boost actually carried a
    // category; when boost data is missing, fall back to the generic "Credential"
    // even though `category` still defaults to socialBadge for display purposes.
    const label = (record.boost?.category && CATEGORY_LABEL[category]) || 'Credential';
    const article = /^[AEIOU]/.test(label) ? 'an' : 'a';
    const recipientName = record.recipientProfile?.displayName ?? record.recipientIdentifier;
    // STUB: for received items this is a raw profileId, not a display name — the
    // backend follow-up (see investigation note) must resolve actor name + avatar.
    const actorName = direction === 'sent' ? 'You' : record.actorProfileId ?? 'Someone';
    const title =
        direction === 'sent'
            ? `You sent ${article} ${label} to ${recipientName}`
            : `${actorName} sent you ${article} ${label}`;
    return {
        id: record.id,
        direction,
        actorName,
        counterpartyName: recipientName,
        category,
        title,
        credentialType: record.boost?.name,
        timestamp: record.timestamp,
        // STUB: the activity feed is actor-scoped today, so direction resolves to
        // 'sent' for the current user, and `unread` has no backing read-state yet.
        unread: false,
    };
};

const MONTHS = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
];
// UTC grouping: matches the server's UTC timestamps and keeps month buckets
// timezone-stable (deterministic across the user's locale and in tests).
const monthLabel = (iso: string): string => {
    const d = new Date(iso);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const groupActivitiesByMonth = (items: ActivityFeedItemVM[]): ActivityMonthGroup[] => {
    const groups: ActivityMonthGroup[] = [];
    for (const item of items) {
        const label = monthLabel(item.timestamp);
        const last = groups[groups.length - 1];
        if (last && last.label === label) last.items.push(item);
        else groups.push({ label, items: [item] });
    }
    return groups;
};

export type ActivityFilterId = 'all' | CredentialCategoryEnum;

// STUB: category filtering is applied client-side over the actor-scoped feed.
export const ACTIVITY_FILTERS: { id: ActivityFilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: CredentialCategoryEnum.socialBadge, label: 'Badges' },
    { id: CredentialCategoryEnum.achievement, label: 'Achievements' },
    { id: CredentialCategoryEnum.learningHistory, label: 'Courses' },
    { id: CredentialCategoryEnum.accomplishment, label: 'Portfolio' },
    { id: CredentialCategoryEnum.accommodation, label: 'Assistance' },
    { id: CredentialCategoryEnum.workHistory, label: 'Experiences' },
    { id: CredentialCategoryEnum.id, label: 'IDs' },
];
