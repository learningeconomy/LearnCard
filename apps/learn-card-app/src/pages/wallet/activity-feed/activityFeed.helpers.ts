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
    /** Current lifecycle state of the credential. When revoked/suspended it
     *  supersedes the event-based status label/tone/title. */
    lifecycleStatus: 'active' | 'revoked' | 'suspended';
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
    map['ai session'] = CredentialCategoryEnum.aiTopic;
    map['ai sessions'] = CredentialCategoryEnum.aiTopic;
    map['ai-topic'] = CredentialCategoryEnum.aiTopic;
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
    lifecycleStatus: 'active' | 'revoked' | 'suspended';
    label: string;
    article: string;
    recipientName: string;
    actorName: string;
}): { titleLead: string; titleSubject?: string } => {
    const {
        direction,
        isSelf,
        eventType,
        lifecycleStatus,
        label,
        article,
        recipientName,
        actorName,
    } = args;

    // Current lifecycle state supersedes the original event: a revoked/suspended
    // credential reads as such regardless of how it was originally delivered.
    if (lifecycleStatus === 'revoked' || lifecycleStatus === 'suspended') {
        const verb = lifecycleStatus === 'revoked' ? 'revoked' : 'suspended';
        if (direction === 'received' || isSelf) {
            return { titleLead: `Your ${label} was ${verb}` };
        }
        const lead =
            lifecycleStatus === 'revoked' ? `Revoked ${label} for` : `Suspended ${label} for`;
        return { titleLead: lead, titleSubject: recipientName };
    }

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
    /** Current lifecycle status derived server-side from the credential's status
     *  list (revoked/suspension bits). `undefined`/`'active'` means still valid. */
    status?: 'active' | 'revoked' | 'suspended';
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
    const lifecycleStatus: 'active' | 'revoked' | 'suspended' =
        record.status === 'revoked' || record.status === 'suspended' ? record.status : 'active';
    const isInactive = lifecycleStatus !== 'active';
    const { titleLead, titleSubject } = buildTitleParts({
        direction,
        isSelf,
        eventType: record.eventType,
        lifecycleStatus,
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
        // Revoked/suspended is the credential's *current* state, so it supersedes
        // the event-based status label/tone.
        statusLabel: isInactive
            ? lifecycleStatus === 'revoked'
                ? 'Revoked'
                : 'Suspended'
            : activityStatusLabel(record.eventType),
        statusTone: isInactive
            ? lifecycleStatus === 'revoked'
                ? 'critical'
                : 'warning'
            : activityStatusTone(record.eventType),
        lifecycleStatus,
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Relative-time bucket label for a "recently added" style list (Today, Yesterday,
// Earlier This Week, Last Week, month name, or year). Mirrors the wallet's import
// reuse list so chronological credential lists read consistently.
export const relativeTimeBucket = (iso?: string): string => {
    if (!iso) return 'Earlier';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Earlier';

    const now = new Date();
    const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / MS_PER_DAY);

    if (daysAgo <= 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo <= now.getDay()) return 'Earlier This Week';
    if (daysAgo <= now.getDay() + 7) return 'Last Week';
    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        return 'Earlier This Month';
    }
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString(undefined, { month: 'long' });
    }
    return String(date.getFullYear());
};

export type TimeBucketGroup<T> = { label: string; items: T[] };

// Groups an ALREADY newest-first-sorted list into consecutive relative-time
// buckets. Consecutive grouping (vs. map-keyed) keeps paged results stable: a
// newly fetched older page only extends the bottom of the last bucket.
export const groupByRelativeTime = <T>(
    items: T[],
    getIso: (item: T) => string | undefined
): TimeBucketGroup<T>[] => {
    const ordered: TimeBucketGroup<T>[] = [];
    for (const item of items) {
        const label = relativeTimeBucket(getIso(item));
        const last = ordered[ordered.length - 1];
        if (last && last.label === label) last.items.push(item);
        else ordered.push({ label, items: [item] });
    }
    return ordered;
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
