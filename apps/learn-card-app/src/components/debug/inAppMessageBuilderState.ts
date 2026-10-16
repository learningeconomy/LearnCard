import { inAppMessagePredicateValidator, type InAppMessage } from '@learncard/types';

export type BuilderActionType =
    'internalLink' | 'externalLink' | 'appStore' | 'capgoUpdate' | 'dismiss';

export interface BuilderAction {
    label: string;
    style: 'primary' | 'secondary' | 'positive' | 'dismiss';
    type: BuilderActionType;
    path: string;
    url: string;
}

export type BuilderConditionKind = 'platform' | 'role' | 'version' | 'credential' | 'raw';

export interface BuilderCondition {
    negate: boolean;
    kind: BuilderConditionKind;
    platforms: string;
    roles: string;
    source: 'native' | 'web' | 'capgo';
    op: 'lt' | 'lte' | 'eq' | 'gte' | 'gt';
    value: string;
    issuers: string;
    nestedIssuers: string;
    vcTypes: string;
    categories: string;
    achievementTypes: string;
    issuedWithinDays: string;
    minCount: string;
}

export interface BuilderState {
    id: string;
    title: string;
    body: string;
    presentation: 'modal' | 'banner' | 'toast';
    frequency: 'once' | 'session' | 'always' | 'everyDays';
    everyDays: string;
    priority: string;
    dismissible: boolean;
    bypassFatigue: boolean;
    mediaType: '' | 'youtube' | 'image' | 'gif';
    mediaUrl: string;
    emoji: string;
    combinator: 'all' | 'any';
    conditions: BuilderCondition[];
    actions: BuilderAction[];
    triggerEvent: '' | 'credential.claimed' | 'app.opened';
    triggerIssuers: string;
    triggerVcTypes: string;
    triggerNestedIssuers: string;
    triggerCategories: string;
    triggerAchievementTypes: string;
    triggerIssuedWithinDays: string;
    triggerWindowMinutes: string;
}

export const emptyCondition = (): BuilderCondition => ({
    negate: false,
    kind: 'platform',
    platforms: 'ios, android',
    roles: 'learner',
    source: 'native',
    op: 'lt',
    value: '1.0.0',
    issuers: 'did:example:issuer',
    nestedIssuers: '',
    vcTypes: 'ClrCredential',
    categories: '',
    achievementTypes: '',
    issuedWithinDays: '',
    minCount: '1',
});

export const emptyAction = (): BuilderAction => ({
    label: 'OK',
    style: 'primary',
    type: 'dismiss',
    path: '/',
    url: 'https://',
});

export const initialState: BuilderState = {
    id: `message-${new Date().toISOString().slice(0, 10)}`,
    title: '',
    body: '',
    presentation: 'modal',
    frequency: 'once',
    everyDays: '3',
    priority: '0',
    dismissible: true,
    bypassFatigue: false,
    mediaType: '',
    mediaUrl: '',
    emoji: '',
    combinator: 'all',
    conditions: [],
    actions: [emptyAction()],
    triggerEvent: '',
    triggerIssuers: '',
    triggerVcTypes: '',
    triggerNestedIssuers: '',
    triggerCategories: '',
    triggerAchievementTypes: '',
    triggerIssuedWithinDays: '',
    triggerWindowMinutes: '10',
};

const csvToList = (csv: string): string[] =>
    csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

const conditionToPredicate = (c: BuilderCondition): Record<string, unknown> | null => {
    if (c.kind === 'raw') {
        try {
            return inAppMessagePredicateValidator.parse(JSON.parse(c.value));
        } catch {
            return { invalid: 'Invalid targeting JSON' };
        }
    }
    if (c.kind === 'platform') {
        const platforms = csvToList(c.platforms);

        return platforms.length > 0 ? { platform: platforms } : null;
    }

    if (c.kind === 'role') {
        const roles = csvToList(c.roles);

        return roles.length > 0 ? { role: roles } : null;
    }

    if (c.kind === 'credential') {
        const credential = {
            ...(csvToList(c.issuers).length > 0 ? { issuers: csvToList(c.issuers) } : {}),
            ...(csvToList(c.nestedIssuers).length > 0
                ? { nestedIssuers: csvToList(c.nestedIssuers) }
                : {}),
            ...(csvToList(c.vcTypes).length > 0 ? { vcTypes: csvToList(c.vcTypes) } : {}),
            ...(csvToList(c.categories).length > 0 ? { categories: csvToList(c.categories) } : {}),
            ...(csvToList(c.achievementTypes).length > 0
                ? { achievementTypes: csvToList(c.achievementTypes) }
                : {}),
            ...(c.issuedWithinDays ? { issuedWithinDays: Number(c.issuedWithinDays) } : {}),
            minCount: Number(c.minCount),
        };

        return { credential };
    }

    return { version: { source: c.source, op: c.op, value: c.value.trim() } };
};

export const buildDraftJson = (s: BuilderState): Record<string, unknown> => {
    const predicates = s.conditions
        .map(condition => {
            const predicate = conditionToPredicate(condition);
            return predicate && condition.negate ? { not: predicate } : predicate;
        })
        .filter((p): p is Record<string, unknown> => p !== null);

    const targeting =
        predicates.length === 0
            ? undefined
            : predicates.length === 1
              ? predicates[0]
              : { [s.combinator]: predicates };

    const actions = s.actions.map(a => ({
        label: a.label,
        style: a.style,
        action:
            a.type === 'internalLink'
                ? { type: a.type, path: a.path }
                : a.type === 'externalLink'
                  ? { type: a.type, url: a.url }
                  : { type: a.type },
    }));
    const triggerWhere = {
        ...(csvToList(s.triggerNestedIssuers).length
            ? { nestedIssuers: csvToList(s.triggerNestedIssuers) }
            : {}),
        ...(csvToList(s.triggerCategories).length
            ? { categories: csvToList(s.triggerCategories) }
            : {}),
        ...(csvToList(s.triggerAchievementTypes).length
            ? { achievementTypes: csvToList(s.triggerAchievementTypes) }
            : {}),
        ...(s.triggerIssuedWithinDays
            ? { issuedWithinDays: Number(s.triggerIssuedWithinDays) }
            : {}),
        ...(csvToList(s.triggerIssuers).length > 0 ? { issuers: csvToList(s.triggerIssuers) } : {}),
        ...(csvToList(s.triggerVcTypes).length > 0 ? { vcTypes: csvToList(s.triggerVcTypes) } : {}),
    };

    return {
        id: s.id,
        title: s.title,
        ...(s.body ? { body: s.body } : {}),
        presentation: s.presentation,
        frequency: s.frequency === 'everyDays' ? { everyDays: Number(s.everyDays) } : s.frequency,
        priority: Number(s.priority),
        dismissible: s.dismissible,
        bypassFatigue: s.bypassFatigue,
        ...(s.mediaType && s.mediaUrl ? { media: { type: s.mediaType, url: s.mediaUrl } } : {}),
        ...(s.emoji.trim() ? { emoji: s.emoji.trim() } : {}),
        actions,
        ...(targeting ? { targeting } : {}),
        ...(s.triggerEvent
            ? {
                  trigger: {
                      event: s.triggerEvent,
                      ...(s.triggerEvent === 'credential.claimed' &&
                      Object.keys(triggerWhere).length > 0
                          ? { where: triggerWhere }
                          : {}),
                      windowMinutes: Number(s.triggerWindowMinutes),
                  },
              }
            : {}),
    };
};

export const messageToBuilderState = (m: InAppMessage): BuilderState => {
    const targeting = m.targeting as Record<string, unknown> | undefined;

    const rawPredicates: Record<string, unknown>[] = !targeting
        ? []
        : 'all' in targeting
          ? (targeting.all as Record<string, unknown>[])
          : 'any' in targeting
            ? (targeting.any as Record<string, unknown>[])
            : [targeting];

    const conditions = rawPredicates.flatMap((raw): BuilderCondition[] => {
        const negate = 'not' in raw;
        const p = negate ? (raw.not as Record<string, unknown>) : raw;
        if ('platform' in p) {
            return [
                {
                    ...emptyCondition(),
                    negate,
                    kind: 'platform' as const,
                    platforms: (p.platform as string[]).join(', '),
                },
            ];
        }

        if ('role' in p) {
            return [
                {
                    ...emptyCondition(),
                    negate,
                    kind: 'role' as const,
                    roles: (p.role as string[]).join(', '),
                },
            ];
        }

        if ('version' in p) {
            const v = p.version as {
                source: BuilderCondition['source'];
                op: BuilderCondition['op'];
                value: string;
            };

            return [
                {
                    ...emptyCondition(),
                    negate,
                    kind: 'version' as const,
                    source: v.source,
                    op: v.op,
                    value: v.value,
                },
            ];
        }

        if ('credential' in p) {
            const credential = p.credential as {
                issuers?: string[];
                nestedIssuers?: string[];
                vcTypes?: string[];
                categories?: string[];
                achievementTypes?: string[];
                issuedWithinDays?: number;
                minCount?: number;
            };

            return [
                {
                    ...emptyCondition(),
                    negate,
                    kind: 'credential' as const,
                    issuers: credential.issuers?.join(', ') ?? '',
                    nestedIssuers: credential.nestedIssuers?.join(', ') ?? '',
                    vcTypes: credential.vcTypes?.join(', ') ?? '',
                    categories: credential.categories?.join(', ') ?? '',
                    achievementTypes: credential.achievementTypes?.join(', ') ?? '',
                    issuedWithinDays: credential.issuedWithinDays?.toString() ?? '',
                    minCount: credential.minCount?.toString() ?? '1',
                },
            ];
        }

        return [{ ...emptyCondition(), kind: 'raw', value: JSON.stringify(raw) }];
    });

    return {
        id: m.id,
        title: m.title,
        body: m.body ?? '',
        presentation: m.presentation,
        frequency: typeof m.frequency === 'object' ? 'everyDays' : m.frequency,
        everyDays: typeof m.frequency === 'object' ? String(m.frequency.everyDays) : '3',
        priority: String(m.priority),
        dismissible: m.dismissible,
        bypassFatigue: m.bypassFatigue,
        mediaType: m.media?.type ?? '',
        mediaUrl: m.media?.url ?? '',
        emoji: m.emoji ?? '',
        combinator: targeting && 'any' in targeting ? 'any' : 'all',
        conditions,
        actions: m.actions.map(a => ({
            label: a.label,
            style: a.style,
            type: a.action.type,
            path: 'path' in a.action ? String(a.action.path) : '/',
            url: 'url' in a.action ? String(a.action.url) : 'https://',
        })),
        triggerEvent: m.trigger?.event ?? '',
        triggerIssuers: m.trigger?.where?.issuers?.join(', ') ?? '',
        triggerVcTypes: m.trigger?.where?.vcTypes?.join(', ') ?? '',
        triggerNestedIssuers: m.trigger?.where?.nestedIssuers?.join(', ') ?? '',
        triggerCategories: m.trigger?.where?.categories?.join(', ') ?? '',
        triggerAchievementTypes: m.trigger?.where?.achievementTypes?.join(', ') ?? '',
        triggerIssuedWithinDays: m.trigger?.where?.issuedWithinDays?.toString() ?? '',
        triggerWindowMinutes: String(m.trigger?.windowMinutes ?? 10),
    };
};
