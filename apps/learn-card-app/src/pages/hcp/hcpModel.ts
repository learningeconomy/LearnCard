import type { HcpEntry, HcpEvent, HcpGrant } from 'learn-card-base/hcp/useHcp';
import * as m from '../../paraglide/messages.js';

export const REGISTERED_CATEGORY_IDS = [
    'general_preferences',
    'goals_and_constraints',
    'health_context',
    'education_learner_profile',
    'work_context',
    'purchase_history_preferences',
    'values_and_ethics',
    'location_context',
    'coordination_context',
] as const;
export type RegisteredCategory = (typeof REGISTERED_CATEGORY_IDS)[number];
export const isRegisteredCategory = (id: string): id is RegisteredCategory =>
    REGISTERED_CATEGORY_IDS.some(item => item === id);

/** Matches the server's §4.5 custom-category URI rule closely enough for a friendly link error. */
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Mirrors the brain's custom category rule (hcp/v1/schemas.ts): a canonical
 * http(s) URI with a multi-label DNS host, no userinfo, not the spec namespace.
 * The brain stays authoritative; this only lets a bad link fail before Allow.
 */
export const isCustomCategory = (id: string): boolean => {
    if (id.length > 2048) return false;
    let url: URL;
    try {
        url = new URL(id); // not URL.canParse: older iOS WebViews lack it
    } catch {
        return false;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.href !== id || url.username !== '' || url.password !== '') return false;
    const labels = url.hostname.split('.');
    if (labels.length < 2 || !labels.every(label => DNS_LABEL.test(label))) return false;
    if (/^\d+$/.test(labels.at(-1)!)) return false;
    return url.hostname !== 'hcp.example' && !url.hostname.endsWith('.hcp.example');
};

const decode = (value: string): string => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const prettify = (value: string): string => {
    const words = decode(value)
        .replace(/[-_]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
        .toLowerCase();
    return words ? words[0].toUpperCase() + words.slice(1) : value;
};

const registeredName = (id: RegisteredCategory): string => {
    switch (id) {
        case 'general_preferences':
            return m['hcp.categories.generalPreferences']();
        case 'goals_and_constraints':
            return m['hcp.categories.goalsAndConstraints']();
        case 'health_context':
            return m['hcp.categories.healthContext']();
        case 'education_learner_profile':
            return m['hcp.categories.educationLearnerProfile']();
        case 'work_context':
            return m['hcp.categories.workContext']();
        case 'purchase_history_preferences':
            return m['hcp.categories.purchaseHistoryPreferences']();
        case 'values_and_ethics':
            return m['hcp.categories.valuesAndEthics']();
        case 'location_context':
            return m['hcp.categories.locationContext']();
        case 'coordination_context':
            return m['hcp.categories.coordinationContext']();
        default: {
            const _exhaustive: never = id;
            return _exhaustive;
        }
    }
};

/** A plain category name: registered labels, otherwise the custom URI's prettified last segment. */
export const categoryName = (id: string): string => {
    if (isRegisteredCategory(id)) return registeredName(id);
    try {
        const url = new URL(id);
        const segment = url.pathname.split('/').filter(Boolean).at(-1);
        return prettify(segment ?? url.hostname);
    } catch {
        return prettify(id);
    }
};

export const categoryList = (ids: readonly string[]): string =>
    new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' }).format(
        ids.map(categoryName)
    );

export type EntryGroup = { category: string; name: string; entries: HcpEntry[] };

/** Groups by first category: registered order first, then custom names alphabetically. */
export const groupEntries = (entries: readonly HcpEntry[]): EntryGroup[] => {
    const groups = new Map<string, HcpEntry[]>();
    for (const entry of entries) {
        const category = entry.classification.categories[0] ?? 'general_preferences';
        groups.set(category, [...(groups.get(category) ?? []), entry]);
    }
    return [...groups]
        .map(([category, grouped]) => ({
            category,
            name: categoryName(category),
            entries: grouped,
        }))
        .sort((a, b) => {
            const ai = REGISTERED_CATEGORY_IDS.findIndex(id => id === a.category);
            const bi = REGISTERED_CATEGORY_IDS.findIndex(id => id === b.category);
            if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
            return a.name.localeCompare(b.name);
        });
};

export const entryText = (entry: HcpEntry): string =>
    typeof entry.content.value === 'string'
        ? entry.content.value
        : JSON.stringify(entry.content.value);

export const grantCategories = (grant: HcpGrant): string[] => [
    ...new Set(grant.access.flatMap(detail => detail.categories)),
];

export const grantPurposes = (grant: HcpGrant): string[] => [
    ...new Set(grant.access.flatMap(detail => detail.purposes.map(p => p.description))),
];

const issuedClientName = (event: HcpEvent): string | undefined => {
    const client = event.data.client;
    if (typeof client !== 'object' || client === null || !('name' in client)) return undefined;
    return typeof client.name === 'string' ? client.name : undefined;
};

/** grantId to app name, from loaded grants and grant.issued events. */
export const appNames = (grants: readonly HcpGrant[], events: readonly HcpEvent[]) => {
    const names = new Map(grants.map(grant => [grant.grantId, grant.client.name]));
    for (const event of events) {
        const name = issuedClientName(event);
        if (event.grantId && name) names.set(event.grantId, name);
    }
    return names;
};

/**
 * The brain's LearnCard event type for a refused read (hcp/v1/schemas.ts
 * READ_DENIED_EVENT). The switch below fails to compile if the brain renames it.
 */
export const READ_DENIED_EVENT = 'https://learncard.com/hcp/v1/events/read-denied';

/** LC-2423: the person accepted an app's suggestion (hcp/v1/schemas.ts SUGGESTION_ACCEPTED_EVENT). */
export const SUGGESTION_ACCEPTED_EVENT = 'https://learncard.com/hcp/v1/events/suggestion-accepted';

const stringList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** A read: what an app saw, or where it looked and found nothing (Draft 3 §8.1 `context.read`). */
const readSentence = (event: HcpEvent, app: string, byApp: boolean): string => {
    if (!byApp) return m['hcp.activity.youRead']();
    if (event.categories.length > 0)
        return m['hcp.activity.appRead']({ app, categories: categoryList(event.categories) });
    // A client query always searches at least one category its grant reads.
    const searched = stringList(event.data.categoriesSearched);
    return m['hcp.activity.appReadNothing']({ app, categories: categoryList(searched) });
};

/** One plain sentence for an audit event. */
export const activitySentence = (event: HcpEvent, names: ReadonlyMap<string, string>): string => {
    const app = (event.grantId && names.get(event.grantId)) || m['hcp.activity.anApp']();
    const byApp = event.participants.initiator.role === 'context-client';
    const categories = categoryList(event.categories);
    switch (event.eventType) {
        case 'context.created':
            if (byApp && event.data.suggested === true)
                return m['hcp.activity.appSuggested']({ app, categories });
            return byApp
                ? m['hcp.activity.appAdded']({ app, categories })
                : m['hcp.activity.youAdded']({ categories });
        case SUGGESTION_ACCEPTED_EVENT:
            return m['hcp.activity.youAccepted']({ categories });
        case 'context.revised':
            return byApp
                ? m['hcp.activity.appUpdated']({ app, categories })
                : m['hcp.activity.youUpdated']({ categories });
        case 'context.withdrawn':
            return byApp
                ? m['hcp.activity.appRemoved']({ app, categories })
                : m['hcp.activity.youRemoved']({ categories });
        case 'context.expired':
            return m['hcp.activity.expired']({ categories });
        case 'context.read':
            return readSentence(event, app, byApp);
        case READ_DENIED_EVENT:
            // Events before the stranger log carry no reason: they were the grant's own client.
            return event.data.reason === 'not-grant-client'
                ? m['hcp.activity.strangerDenied']({ app })
                : m['hcp.activity.appDenied']({ app });
        case 'context.exported':
            return m['hcp.activity.exported']();
        case 'grant.issued':
            return m['hcp.activity.allowed']({ app, categories });
        case 'grant.revoked':
            // LC-2421: allowing a contract again replaces the earlier grant.
            if (event.data.reason === 'superseded') return m['hcp.activity.replaced']({ app });
            return byApp
                ? m['hcp.activity.appStopped']({ app })
                : m['hcp.activity.youStopped']({ app });
        case 'grant.expired':
            return m['hcp.activity.ended']({ app });
        default: {
            const _exhaustive: never = event.eventType;
            return _exhaustive;
        }
    }
};
