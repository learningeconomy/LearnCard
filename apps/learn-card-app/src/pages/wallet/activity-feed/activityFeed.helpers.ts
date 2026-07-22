import { CredentialCategoryEnum } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { getLocale } from '../../../paraglide/runtime.js';

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
    map['ai session'] = CredentialCategoryEnum.aiTopic;
    map['ai sessions'] = CredentialCategoryEnum.aiTopic;
    map['ai-topic'] = CredentialCategoryEnum.aiTopic;
    return map;
})();

// Enum → translation key. Uses the enum MEMBER NAMES, which is how the existing
// `passport.activity.categories.*` / `.categoriesPlural.*` / `.article.*` keys
// are indexed.
const CATEGORY_KEY: Partial<Record<CredentialCategoryEnum, string>> = {
    [CredentialCategoryEnum.socialBadge]: 'socialBadge',
    [CredentialCategoryEnum.achievement]: 'achievement',
    [CredentialCategoryEnum.learningHistory]: 'learningHistory',
    [CredentialCategoryEnum.accomplishment]: 'accomplishment',
    [CredentialCategoryEnum.accommodation]: 'accommodation',
    [CredentialCategoryEnum.workHistory]: 'workHistory',
    [CredentialCategoryEnum.id]: 'id',
};

// Explicit records of literal message-function references keep the paraglide
// keys statically analyzable (and type-safe) rather than string-built at runtime.
const CAT_LABEL_FN: Record<string, () => string> = {
    socialBadge: m['passport.activity.categories.socialBadge'],
    achievement: m['passport.activity.categories.achievement'],
    learningHistory: m['passport.activity.categories.learningHistory'],
    accomplishment: m['passport.activity.categories.accomplishment'],
    accommodation: m['passport.activity.categories.accommodation'],
    workHistory: m['passport.activity.categories.workHistory'],
    id: m['passport.activity.categories.id'],
    credential: m['passport.activity.categories.credential'],
};

const CAT_ARTICLE_FN: Record<string, () => string> = {
    socialBadge: m['passport.activity.article.socialBadge'],
    achievement: m['passport.activity.article.achievement'],
    learningHistory: m['passport.activity.article.learningHistory'],
    accomplishment: m['passport.activity.article.accomplishment'],
    accommodation: m['passport.activity.article.accommodation'],
    workHistory: m['passport.activity.article.workHistory'],
    id: m['passport.activity.article.id'],
    credential: m['passport.activity.article.credential'],
};

const categoryLabel = (category?: CredentialCategoryEnum): string =>
    (
        CAT_LABEL_FN[(category && CATEGORY_KEY[category]) || 'credential'] ??
        CAT_LABEL_FN.credential
    )();

const categoryArticle = (category?: CredentialCategoryEnum): string =>
    (
        CAT_ARTICLE_FN[(category && CATEGORY_KEY[category]) || 'credential'] ??
        CAT_ARTICLE_FN.credential
    )();

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

// eventType → status sub-namespace key. CREATED/DELIVERED both read as "sent".
const STATUS_KEY: Record<string, string> = {
    CREATED: 'sent',
    DELIVERED: 'sent',
    CLAIMED: 'claimed',
    EXPIRED: 'expired',
    FAILED: 'notDelivered',
};

// Explicit record of literal message-function references for type-safety.
const STATUS_LABEL_FN: Record<string, () => string> = {
    sent: m['passport.activity.status.sent'],
    claimed: m['passport.activity.status.claimed'],
    expired: m['passport.activity.status.expired'],
    notDelivered: m['passport.activity.status.notDelivered'],
};

const STATUS_TONE: Record<string, ActivityStatusTone> = {
    CREATED: 'neutral',
    DELIVERED: 'neutral',
    CLAIMED: 'positive',
    EXPIRED: 'warning',
    FAILED: 'critical',
};

const activityStatusLabel = (eventType?: string): string =>
    (STATUS_LABEL_FN[(eventType && STATUS_KEY[eventType]) || 'sent'] ?? STATUS_LABEL_FN.sent)();

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

    if (isSelf) return { titleLead: m['passport.activity.title.selfAdded']({ article, label }) };
    if (direction === 'received')
        return {
            titleLead: m['passport.activity.title.received']({ actor: actorName, article, label }),
        };

    switch (eventType) {
        case 'CLAIMED':
            return {
                titleLead: m['passport.activity.title.claimedBy']({ label }),
                titleSubject: recipientName,
            };
        case 'EXPIRED':
            return {
                titleLead: m['passport.activity.title.expiredFor']({ label }),
                titleSubject: recipientName,
            };
        case 'FAILED':
            return {
                titleLead: m['passport.activity.title.failedTo']({ label }),
                titleSubject: recipientName,
            };
        default:
            return {
                titleLead: m['passport.activity.title.sentTo']({ article, label }),
                titleSubject: recipientName,
            };
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
    const label = categoryLabel(matchedCategory);
    const article = categoryArticle(matchedCategory);
    const recipientName = record.recipientProfile?.displayName ?? record.recipientIdentifier;
    // STUB: for received items this is a raw profileId, not a display name — the
    // backend follow-up (see investigation note) must resolve actor name + avatar.
    const actorName =
        direction === 'sent'
            ? m['passport.activity.you']()
            : record.actorProfileId ?? m['passport.activity.someone']();
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

// UTC grouping: matches the server's UTC timestamps and keeps month buckets
// timezone-stable (deterministic across the user's locale and in tests). The
// month name itself is rendered in the active locale via Intl.
const monthLabel = (iso: string): string => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(getLocale(), {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    })
        .format(d)
        .toLocaleUpperCase(getLocale());
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
    if (!iso) return m['passport.activity.when.earlier']();
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return m['passport.activity.when.earlier']();

    const now = new Date();
    const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / MS_PER_DAY);

    if (daysAgo <= 0) return m['passport.activity.when.today']();
    if (daysAgo === 1) return m['passport.activity.when.yesterday']();
    if (daysAgo <= now.getDay()) return m['passport.activity.when.thisWeek']();
    if (daysAgo <= now.getDay() + 7) return m['passport.activity.when.lastWeek']();
    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        return m['passport.activity.when.thisMonth']();
    }
    if (date.getFullYear() === now.getFullYear()) {
        return new Intl.DateTimeFormat(getLocale(), { month: 'long' }).format(date);
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
// A function (not a const) so labels re-compute for the active locale on render.
export const getActivityFilters = (): { id: ActivityFilterId; label: string }[] => [
    { id: 'all', label: m['passport.activity.categoriesPlural.all']() },
    {
        id: CredentialCategoryEnum.socialBadge,
        label: m['passport.activity.categoriesPlural.socialBadge'](),
    },
    {
        id: CredentialCategoryEnum.achievement,
        label: m['passport.activity.categoriesPlural.achievement'](),
    },
    {
        id: CredentialCategoryEnum.learningHistory,
        label: m['passport.activity.categoriesPlural.learningHistory'](),
    },
    {
        id: CredentialCategoryEnum.accomplishment,
        label: m['passport.activity.categoriesPlural.accomplishment'](),
    },
    {
        id: CredentialCategoryEnum.accommodation,
        label: m['passport.activity.categoriesPlural.accommodation'](),
    },
    {
        id: CredentialCategoryEnum.workHistory,
        label: m['passport.activity.categoriesPlural.workHistory'](),
    },
    { id: CredentialCategoryEnum.id, label: m['passport.activity.categoriesPlural.id']() },
];
