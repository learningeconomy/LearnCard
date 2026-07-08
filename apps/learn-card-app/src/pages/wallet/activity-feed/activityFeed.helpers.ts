import { CredentialCategoryEnum } from 'learn-card-base';

export type ActivityDirection = 'sent' | 'received';

export type ActivityAvatar = {
    displayName?: string;
    profileId?: string;
    image?: string;
};

export type ActivityFeedItemVM = {
    id: string;
    direction: ActivityDirection;
    actorName: string;
    counterpartyName: string;
    category: CredentialCategoryEnum;
    categoryLabel: string;
    /** True when the boost carried no recognizable category, so the row should
     *  show a neutral credential glyph rather than the (misleading) badge icon. */
    isGenericCredential: boolean;
    isSelf: boolean;
    statusLabel: string;
    statusTone: ActivityStatusTone;
    /** Full, flat title used for the aria-label and free-text search. */
    title: string;
    /** Emphasized action phrase, e.g. "You sent a Badge to". */
    titleLead: string;
    /** De-emphasized trailing recipient (name/email), rendered lighter. */
    titleSubject?: string;
    credentialType?: string;
    timestamp: string;
    unread: boolean;
    /** Whose avatar leads the row: the recipient for sent items, the sender for
     *  received items (mirrors the Figma "person → credential" row). */
    avatar: ActivityAvatar;
};

export type ActivityStatusTone = 'neutral' | 'positive' | 'warning' | 'critical';

export type ActivityMonthGroup = { label: string; items: ActivityFeedItemVM[] };

// Boosts persist `category` as the enum's display value ("Social Badge"), while
// legacy callers and tests use the enum key ("socialBadge"). Index both forms,
// case-insensitively, so a row resolves to its real category icon rather than
// always missing the lookup and falling back to the badge icon.
const CATEGORY_LOOKUP: Record<string, CredentialCategoryEnum> = (() => {
    const map: Record<string, CredentialCategoryEnum> = {};
    for (const [key, value] of Object.entries(CredentialCategoryEnum)) {
        map[value.toLowerCase()] = value as CredentialCategoryEnum;
        map[key.toLowerCase()] = value as CredentialCategoryEnum;
    }
    return map;
})();

const CATEGORY_LABEL: Partial<Record<CredentialCategoryEnum, string>> = {
    [CredentialCategoryEnum.socialBadge]: 'Badge',
    [CredentialCategoryEnum.achievement]: 'Achievement',
    [CredentialCategoryEnum.learningHistory]: 'Course',
    [CredentialCategoryEnum.accomplishment]: 'Portfolio item',
    [CredentialCategoryEnum.accommodation]: 'Assistance',
    [CredentialCategoryEnum.workHistory]: 'Experience',
    [CredentialCategoryEnum.id]: 'ID',
};

export const matchActivityCategory = (category?: string): CredentialCategoryEnum | undefined =>
    category ? CATEGORY_LOOKUP[category.toLowerCase()] : undefined;

export const resolveActivityCategory = (category?: string): CredentialCategoryEnum =>
    matchActivityCategory(category) ?? CredentialCategoryEnum.socialBadge;

// Internal/system credentials the user never explicitly "sent" — profile data,
// AI artifacts, and self-assigned skills. They pollute the activity feed, so we
// hide them from the timeline entirely.
export const HIDDEN_ACTIVITY_CATEGORIES: ReadonlySet<CredentialCategoryEnum> = new Set([
    CredentialCategoryEnum.selfAssignedSkills,
    CredentialCategoryEnum.verifiableData,
    CredentialCategoryEnum.goals,
    CredentialCategoryEnum.professionalTitle,
    CredentialCategoryEnum.roleExperience,
    CredentialCategoryEnum.workExperience,
    CredentialCategoryEnum.payRate,
    CredentialCategoryEnum.workLifeBalance,
    CredentialCategoryEnum.jobStability,
    CredentialCategoryEnum.aiSummary,
    CredentialCategoryEnum.aiTopic,
    CredentialCategoryEnum.aiPathway,
    CredentialCategoryEnum.aiInsight,
    CredentialCategoryEnum.aiAssessment,
]);

export const isHiddenActivity = (category?: string): boolean => {
    const matched = matchActivityCategory(category);
    return matched !== undefined && HIDDEN_ACTIVITY_CATEGORIES.has(matched);
};

const STATUS_LABEL: Record<string, string> = {
    CREATED: 'Sent',
    DELIVERED: 'Sent',
    CLAIMED: 'Claimed',
    EXPIRED: 'Expired',
    FAILED: 'Not delivered',
};

const STATUS_TONE: Record<string, ActivityStatusTone> = {
    CREATED: 'neutral',
    DELIVERED: 'neutral',
    CLAIMED: 'positive',
    EXPIRED: 'warning',
    FAILED: 'critical',
};

const activityStatusLabel = (eventType?: string): string =>
    (eventType && STATUS_LABEL[eventType]) || 'Sent';

const activityStatusTone = (eventType?: string): ActivityStatusTone =>
    (eventType && STATUS_TONE[eventType]) || 'neutral';

// Status-aware phrasing. The feed is scoped to the current user (the issuer), so
// the recipient stays the trailing, de-emphasized subject while the lead verb
// reflects the credential's latest lifecycle state.
const buildTitleParts = (args: {
    direction: ActivityDirection;
    isSelf: boolean;
    eventType?: string;
    label: string;
    article: string;
    recipientName: string;
    actorName: string;
}): { titleLead: string; titleSubject?: string } => {
    const { direction, isSelf, eventType, label, article, recipientName, actorName } = args;

    if (isSelf) return { titleLead: `You added ${article} ${label} to your passport` };
    if (direction === 'received') return { titleLead: `${actorName} sent you ${article} ${label}` };

    switch (eventType) {
        case 'CLAIMED':
            return { titleLead: `${label} claimed by`, titleSubject: recipientName };
        case 'EXPIRED':
            return { titleLead: `Expired ${label} for`, titleSubject: recipientName };
        case 'FAILED':
            return { titleLead: `Couldn't deliver ${label} to`, titleSubject: recipientName };
        default:
            return { titleLead: `You sent ${article} ${label} to`, titleSubject: recipientName };
    }
};

type RawActivity = {
    id: string;
    eventType: string;
    timestamp: string;
    actorProfileId?: string;
    recipientIdentifier: string;
    boost?: { id: string; name?: string; category?: string };
    recipientProfile?: { profileId: string; displayName?: string; image?: string };
};

export const toActivityFeedVM = (record: RawActivity, myProfileId?: string): ActivityFeedItemVM => {
    const direction: ActivityDirection =
        !myProfileId || record.actorProfileId === myProfileId ? 'sent' : 'received';
    const matchedCategory = matchActivityCategory(record.boost?.category);
    const category = matchedCategory ?? CredentialCategoryEnum.socialBadge;
    const isGenericCredential = matchedCategory === undefined;
    const label = (matchedCategory && CATEGORY_LABEL[matchedCategory]) || 'Credential';
    const article = /^[AEIOU]/.test(label) ? 'an' : 'a';
    const recipientName = record.recipientProfile?.displayName ?? record.recipientIdentifier;
    // STUB: for received items this is a raw profileId, not a display name — the
    // backend follow-up (see investigation note) must resolve actor name + avatar.
    const actorName = direction === 'sent' ? 'You' : record.actorProfileId ?? 'Someone';
    const isSelf =
        direction === 'sent' &&
        Boolean(myProfileId) &&
        (record.recipientProfile?.profileId === myProfileId ||
            record.recipientIdentifier === myProfileId);
    const { titleLead, titleSubject } = buildTitleParts({
        direction,
        isSelf,
        eventType: record.eventType,
        label,
        article,
        recipientName,
        actorName,
    });
    const title = [titleLead, titleSubject].filter(Boolean).join(' ');
    // Row avatar = the *other* party: recipient for sent, sender for received.
    const avatar: ActivityAvatar =
        direction === 'sent'
            ? {
                  displayName: recipientName,
                  profileId: record.recipientProfile?.profileId,
                  image: record.recipientProfile?.image,
              }
            : { displayName: actorName, profileId: record.actorProfileId };
    return {
        id: record.id,
        direction,
        actorName,
        counterpartyName: recipientName,
        category,
        categoryLabel: label,
        isGenericCredential,
        isSelf,
        statusLabel: activityStatusLabel(record.eventType),
        statusTone: activityStatusTone(record.eventType),
        title,
        titleLead,
        titleSubject,
        credentialType: record.boost?.name,
        timestamp: record.timestamp,
        // STUB: the activity feed is actor-scoped today, so direction resolves to
        // 'sent' for the current user, and `unread` has no backing read-state yet.
        unread: false,
        avatar,
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

/**
 * Groups VMs into month buckets. Map-keyed by label so items from the same month
 * always land in one group even if they arrive non-consecutively (e.g. out of
 * strict timestamp order across paged results). Group order follows first-seen
 * month, which for the caller's newest-first records is newest month first.
 */
export const groupActivitiesByMonth = (items: ActivityFeedItemVM[]): ActivityMonthGroup[] => {
    const byLabel = new Map<string, ActivityFeedItemVM[]>();
    for (const item of items) {
        const label = monthLabel(item.timestamp);
        const bucket = byLabel.get(label);
        if (bucket) bucket.push(item);
        else byLabel.set(label, [item]);
    }
    return Array.from(byLabel, ([label, groupItems]) => ({ label, items: groupItems }));
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
