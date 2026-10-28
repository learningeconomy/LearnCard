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
        const previous = before.get(scopeKey(scope));
        if (scope.required && (!previous?.required || previous.reason !== scope.reason))
            requiresConsent = true;
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
    QUALIFICATIONS: {
        label: 'Qualifications',
        description: 'Education, training, and professional qualifications.',
    },
    GOALS: { label: 'Goals', description: 'Learning and career goals you want to achieve.' },
    'PROFESSIONAL TITLE': {
        label: 'Professional title',
        description: 'The title that describes your professional role.',
    },
    'ROLE EXPERIENCE': {
        label: 'Role experience',
        description: 'Experience gained in a particular professional role.',
    },
    'WORK EXPERIENCE': {
        label: 'Work experience',
        description: 'Your work activities, responsibilities, and experience.',
    },
    'PAY RATE': { label: 'Pay rate', description: 'Your pay amount and payment period.' },
    'WORK LIFE BALANCE': {
        label: 'Work-life balance',
        description: 'Your preferences for balancing work and personal life.',
    },
    'JOB STABILITY': {
        label: 'Job stability',
        description: 'Your preferences for job security and stability.',
    },
    'SELF-ASSIGNED SKILLS': {
        label: 'Self-assigned skills',
        description: 'Skills you have added to your own profile.',
    },
    'AI-SUMMARY': {
        label: 'AI summaries',
        description: 'Summaries of your AI-assisted learning sessions.',
    },
    'AI-TOPIC': {
        label: 'AI topics',
        description: 'Topics explored in your AI-assisted learning.',
    },
    'AI-ASSESSMENT': {
        label: 'AI assessments',
        description: 'Assessments from your AI-assisted learning.',
    },
    'AI INSIGHT': {
        label: 'AI insights',
        description: 'Insights about your learning progress and skills.',
    },
    'LEARNING-PATHWAY': {
        label: 'Learning pathways',
        description: 'Plans and steps toward your learning goals.',
    },
};

const PERSONAL_SCOPE_COPY: Record<string, { label: string; description: string }> = {
    NAME: { label: 'Name', description: 'Your name.' },
    EMAIL: { label: 'Email', description: 'Your email address.' },
    IMAGE: { label: 'Profile photo', description: 'Your profile photo.' },
    'PROFILE IMAGE': { label: 'Profile photo', description: 'Your profile photo.' },
    'PROFILE PHOTO': { label: 'Profile photo', description: 'Your profile photo.' },
};

const scopeCopy = (
    scope: ConsentFlowContractScope,
    translate?: (key: string, values?: Record<string, unknown>) => string
) => {
    const copy = (scope.type === 'personal' ? PERSONAL_SCOPE_COPY : CANONICAL_SCOPE_COPY)[
        scope.key.toUpperCase()
    ];
    if (!copy) return { label: scope.key, description: '' };
    if (!translate) return copy;
    const messageName = copy.label
        .toLowerCase()
        .replace(/[\s-]+([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const prefix = `consentUpdate.scope.${messageName}`;
    return {
        label: translate(`${prefix}.label`),
        description: translate(`${prefix}.description`),
    };
};

export const buildContractUpdatePreview = ({
    name,
    kind,
    diff,
    status,
    translate,
}: {
    name: string;
    kind: ConsentFlowContractChangeKind;
    diff: ConsentFlowContractDiff;
    status?: string;
    /** Clients localize structured changes; the API retains canonical English copy. */
    translate?: (key: string, values?: Record<string, unknown>) => string;
}): ConsentFlowContractUpdatePreview => {
    const text = (key: string, fallback: string, values?: Record<string, unknown>) =>
        translate?.(`consentUpdate.${key}`, values) ?? fallback;
    const label = (scope: ConsentFlowContractScope) => scopeCopy(scope, translate).label;
    const consentChanges = [...diff.added, ...diff.changed];
    const consentChangeCount = consentChanges.length;
    let headline: string;
    let subhead: string;
    let primaryLabel: string;
    if (status === 'suspended') {
        headline = text('headline.paused', `${name}'s access is paused`, { name });
        subhead = text('subhead.reconnect', 'Approve the update to reconnect.');
        primaryLabel = text('action.reconnect', 'Reconnect');
    } else if (kind === 'requires_consent' && consentChangeCount === 1) {
        const scope = consentChanges[0]!;
        const values = { name, label: label(scope) };
        headline =
            scope.area === 'read'
                ? text('headline.read', `${name} is asking to see your ${values.label}`, values)
                : text(
                      'headline.write',
                      `${name} is asking to add ${values.label} to your account`,
                      values
                  );
        subhead = '';
        primaryLabel = text('action.allow', 'Allow');
    } else if (kind === 'requires_consent' && consentChangeCount > 1) {
        headline = text('headline.multiple', `${name} is asking for more access`, { name });
        subhead = text('subhead.newItems', `${consentChangeCount} new items`, {
            count: consentChangeCount,
        });
        primaryLabel = text('action.allowAccess', 'Allow access');
    } else if (kind === 'requires_consent') {
        headline = text('headline.changed', `${name} changed its request`, { name });
        subhead = text('subhead.review', "Review what's different.");
        primaryLabel = text('action.allow', 'Allow');
    } else if (kind === 'expanded_optional') {
        headline = text('headline.optional', `${name} has a new option`, { name });
        subhead = text(
            'subhead.optional',
            'Turn it on if you want. Nothing changes unless you do.'
        );
        primaryLabel = text('action.continue', 'Continue');
    } else {
        const removed = diff.removed[0];
        headline = removed
            ? text('headline.removed', `${name} now sees less`, { name })
            : text('headline.changed', `${name} changed its request`, { name });
        subhead = removed
            ? text('subhead.removed', `Stopped asking for ${label(removed)}.`, {
                  label: label(removed),
              })
            : text('subhead.changed', 'Its request has changed.');
        primaryLabel = text('action.done', 'Done');
    }
    const row = (scope: ConsentFlowContractScope, change: 'added' | 'removed' | 'changed') => {
        const copy = scopeCopy(scope, translate);
        return { scope, change, label: copy.label, subtitle: scope.reason || copy.description };
    };
    return {
        headline,
        subhead,
        rows: [
            ...diff.added.map(scope => row(scope, 'added')),
            ...diff.removed.map(scope => row(scope, 'removed')),
            ...diff.changed.map(scope => row(scope, 'changed')),
        ],
        primaryLabel,
    };
};
