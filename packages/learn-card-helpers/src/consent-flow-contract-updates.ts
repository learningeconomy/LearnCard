import type {
    ConsentFlowContract,
    ConsentFlowContractChangeKind,
    ConsentFlowContractDiff,
    ConsentFlowContractScope,
    ConsentFlowContractUpdatePreview,
} from '@learncard/types';

export type ConsentFlowContractSnapshot = {
    contract: ConsentFlowContract;
    name: string;
    subtitle?: string;
    description?: string;
    reasonForAccessing?: string;
    image?: string;
    needsGuardianConsent?: boolean;
    redirectUrl?: string;
    frontDoorBoostUri?: string;
    expiresAt?: string;
    /** Stable URI/id identity is preferred; URI/id-bearing objects are canonicalized. */
    autoboosts?: unknown[];
    writers?: string[];
};

const scopes = (contract: ConsentFlowContract): ConsentFlowContractScope[] => {
    const result: ConsentFlowContractScope[] = [];
    for (const area of ['read', 'write'] as const) {
        const access = contract[area];
        for (const [key, config] of Object.entries(access.credentials.categories)) {
            result.push({
                area,
                type: 'credential',
                key,
                required: config.required,
                reason: config.reason,
            });
        }
        for (const [key, config] of Object.entries(access.personal)) {
            result.push({
                area,
                type: 'personal',
                key,
                required: config.required,
                reason: config.reason,
            });
        }
    }
    return result.sort((a, b) => scopeKey(a).localeCompare(scopeKey(b)));
};

const scopeKey = ({ area, type, key }: ConsentFlowContractScope): string =>
    `${area}:${type}:${key}`;

const diffScopes = (
    previous: ConsentFlowContractScope[],
    current: ConsentFlowContractScope[]
): ConsentFlowContractDiff => {
    const before = new Map(previous.map(scope => [scopeKey(scope), scope]));
    const after = new Map(current.map(scope => [scopeKey(scope), scope]));
    const added: ConsentFlowContractScope[] = [];
    const removed: ConsentFlowContractScope[] = [];
    const changed: ConsentFlowContractScope[] = [];
    for (const [key, scope] of after) {
        const old = before.get(key);
        if (!old) added.push(scope);
        else if (old.required !== scope.required || old.reason !== scope.reason)
            changed.push(scope);
    }
    for (const [key, scope] of before) if (!after.has(key)) removed.push(scope);
    const sort = (list: ConsentFlowContractScope[]) =>
        list.sort((a, b) => scopeKey(a).localeCompare(scopeKey(b)));
    return { added: sort(added), removed: sort(removed), changed: sort(changed) };
};

export const diffContractChange = (
    prev: ConsentFlowContractSnapshot,
    next: ConsentFlowContractSnapshot
): ConsentFlowContractDiff => diffScopes(scopes(prev.contract), scopes(next.contract));

const expiryIsStricter = (previous?: string, next?: string): boolean => {
    if (!next) return false;
    if (!previous) return true;
    const oldTime = Date.parse(previous);
    const newTime = Date.parse(next);
    return Number.isFinite(oldTime) && Number.isFinite(newTime) && newTime < oldTime;
};

const canonicalIdentity = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (Array.isArray(value)) return `[${value.map(canonicalIdentity).join(',')}]`;
        const record = value as Record<string, unknown>;
        const identity = record.uri ?? record.id ?? record.boostUri;
        if (typeof identity === 'string') return identity;
        return `{${Object.keys(record)
            .sort()
            .map(key => `${JSON.stringify(key)}:${canonicalIdentity(record[key])}`)
            .join(',')}}`;
    }
    return JSON.stringify(value) ?? String(value);
};

const set = (values?: unknown[]) => new Set((values ?? []).map(canonicalIdentity));

export const classifyContractChange = (
    prev: ConsentFlowContractSnapshot,
    next: ConsentFlowContractSnapshot
): ConsentFlowContractChangeKind => {
    const previousScopes = scopes(prev.contract);
    const diff = diffScopes(previousScopes, scopes(next.contract));
    const before = new Map(previousScopes.map(scope => [scopeKey(scope), scope]));
    let requiresConsent =
        next.name !== prev.name ||
        next.reasonForAccessing !== prev.reasonForAccessing ||
        (!prev.needsGuardianConsent && !!next.needsGuardianConsent) ||
        expiryIsStricter(prev.expiresAt, next.expiresAt) ||
        next.writers?.some(writer => !prev.writers?.includes(writer)) === true;
    let expandedOptional = false;
    for (const scope of diff.added) {
        if (scope.required) requiresConsent = true;
        else expandedOptional = true;
    }
    for (const scope of diff.changed) {
        if (scope.required && !before.get(scopeKey(scope))?.required) requiresConsent = true;
    }
    const oldBoosts = set(prev.autoboosts);
    if ([...set(next.autoboosts)].some(boost => !oldBoosts.has(boost))) requiresConsent = true;
    if (requiresConsent) return 'requires_consent';
    if (expandedOptional) return 'expanded_optional';
    return 'relaxed';
};
const CANONICAL_SCOPE_COPY: Record<string, { label: string; description: string }> = {
    TRANSCRIPT: { label: 'Transcripts', description: 'Records of completed courses and learning.' },
    TRANSCRIPTS: {
        label: 'Transcripts',
        description: 'Records of completed courses and learning.',
    },
    CERTIFICATE: {
        label: 'Certificates',
        description: 'Credentials recognizing qualifications or completed learning.',
    },
    CERTIFICATES: {
        label: 'Certificates',
        description: 'Credentials recognizing qualifications or completed learning.',
    },
    ACHIEVEMENT: {
        label: 'Achievements',
        description: 'Milestones earned through effort, skill, or perseverance.',
    },
    ACHIEVEMENTS: {
        label: 'Achievements',
        description: 'Milestones earned through effort, skill, or perseverance.',
    },
    SKILL: {
        label: 'Skills',
        description: 'Abilities developed through training, practice, or experience.',
    },
    SKILLS: {
        label: 'Skills',
        description: 'Abilities developed through training, practice, or experience.',
    },
    'WORK HISTORY': {
        label: 'Work History',
        description: 'Professional roles and activities over time.',
    },
    'LEARNING HISTORY': {
        label: 'Learning History',
        description: 'Structured programs of learning.',
    },
    ID: { label: 'IDs', description: 'Credentials used to verify identity.' },
    'SOCIAL BADGE': {
        label: 'Social Badges',
        description: 'Digital labels recognizing participation or group membership.',
    },
    'SOCIAL BADGES': {
        label: 'Social Badges',
        description: 'Digital labels recognizing participation or group membership.',
    },
    MEMBERSHIP: { label: 'Memberships', description: 'Records of memberships.' },
    MEMBERSHIPS: { label: 'Memberships', description: 'Records of memberships.' },
    ACCOMPLISHMENT: {
        label: 'Accomplishments',
        description: 'Collections of work that showcase skills and experience.',
    },
    ACCOMPLISHMENTS: {
        label: 'Accomplishments',
        description: 'Collections of work that showcase skills and experience.',
    },
    EXPERIENCES: {
        label: 'Experiences',
        description: 'Knowledge and skills gained through professional roles and activities.',
    },
    ACCOMMODATION: {
        label: 'Accommodations',
        description: 'Adjustments made to support accessibility.',
    },
    ACCOMMODATIONS: {
        label: 'Accommodations',
        description: 'Adjustments made to support accessibility.',
    },
    FAMILY: {
        label: 'Family',
        description: 'Family profiles connected through shared learning journeys.',
    },
};

const PERSONAL_SCOPE_COPY: Record<string, { label: string; description: string }> = {
    NAME: { label: 'Name', description: 'Your name.' },
    EMAIL: { label: 'Email', description: 'Your email address.' },
    IMAGE: { label: 'Profile photo', description: 'Your profile photo.' },
    'PROFILE IMAGE': { label: 'Profile photo', description: 'Your profile photo.' },
    'PROFILE PHOTO': { label: 'Profile photo', description: 'Your profile photo.' },
};

const scopeCopy = (scope: ConsentFlowContractScope) =>
    (scope.type === 'personal' ? PERSONAL_SCOPE_COPY : CANONICAL_SCOPE_COPY)[
        scope.key.toUpperCase()
    ] ?? { label: scope.key, description: '' };

export const buildContractUpdatePreview = ({
    name,
    kind,
    diff,
    status,
}: {
    name: string;
    kind: ConsentFlowContractChangeKind;
    diff: ConsentFlowContractDiff;
    status?: string;
}): ConsentFlowContractUpdatePreview => {
    const label = (scope: ConsentFlowContractScope) => scopeCopy(scope).label;
    const consentChanges = [...diff.added, ...diff.changed];
    const consentChangeCount = consentChanges.length;
    let headline: string;
    let subhead: string;
    let primaryLabel: string;
    if (status === 'suspended') {
        headline = `${name}'s access is paused`;
        subhead = 'Approve the update to reconnect.';
        primaryLabel = 'Reconnect';
    } else if (kind === 'requires_consent' && consentChangeCount === 1) {
        const scope = consentChanges[0]!;
        headline =
            scope.area === 'read'
                ? `${name} is asking to see your ${label(scope)}`
                : `${name} is asking to add ${label(scope)} to your account`;
        subhead = '';
        primaryLabel = 'Allow';
    } else if (kind === 'requires_consent' && consentChangeCount > 1) {
        headline = `${name} is asking for more access`;
        subhead = `${consentChangeCount} new items`;
        primaryLabel = 'Allow access';
    } else if (kind === 'requires_consent') {
        headline = `${name} changed its request`;
        subhead = "Review what's different.";
        primaryLabel = 'Allow';
    } else if (kind === 'expanded_optional') {
        headline = `${name} has a new option`;
        subhead = 'Turn it on if you want. Nothing changes unless you do.';
        primaryLabel = 'Continue';
    } else {
        const removed = diff.removed[0];
        headline = `${name} now sees less`;
        subhead = removed ? `Stopped asking for ${label(removed)}.` : 'Its request has changed.';
        primaryLabel = 'Done';
    }
    const row = (scope: ConsentFlowContractScope, change: 'added' | 'removed' | 'changed') => {
        const copy = scopeCopy(scope);
        return { scope, change, label: copy.label, subtitle: scope.reason || copy.description };
    };
    const rows = [
        ...diff.added.map(scope => row(scope, 'added')),
        ...diff.removed.map(scope => row(scope, 'removed')),
        ...diff.changed.map(scope => row(scope, 'changed')),
    ];
    return { headline, subhead, rows, primaryLabel };
};
