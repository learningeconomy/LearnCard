import {
    CredentialVerificationMetadataValidator,
    type CredentialVerificationMetadata,
    ModelSafeCredentialProjectionValidator,
    VCValidator,
    type ModelSafeCredentialFact,
    type ModelSafeCredentialProjection,
    type VC,
} from '@learncard/types';
import { fingerprintCredential, getSubjectPayloadShape } from './verification';

// Same code the verifier writes for an expiry-only result (verification.ts).
const CREDENTIAL_EXPIRED_WARNING = 'credential_expired';

type FactKind = ModelSafeCredentialFact['kind'];

const FACT_KIND_BY_KEY: Record<string, FactKind> = {
    achievement: 'achievement',
    achievements: 'achievement',
    badge: 'achievement',
    badges: 'achievement',
    course: 'course',
    courses: 'course',
    coursework: 'course',
    competencies: 'competency',
    competency: 'competency',
    experience: 'experience',
    experiences: 'experience',
    employment: 'experience',
    workexperience: 'experience',
    goal: 'goal',
    goals: 'goal',
    learned: 'summary',
    learningoutcome: 'achievement',
    learningoutcomes: 'achievement',
    professionalsummary: 'summary',
    professionaltitle: 'title',
    sessionsummary: 'summary',
    skill: 'skill',
    skills: 'skill',
    skillname: 'skill',
    skillnames: 'skill',
    summary: 'summary',
    summaryinfo: 'summary',
    assessment: 'assessment',
    assessments: 'assessment',
    result: 'assessment',
    results: 'assessment',
    resultdescription: 'assessment',
    resultdescriptions: 'assessment',
    grade: 'grade',
    grades: 'grade',
    gpa: 'grade',
    credits: 'grade',
    creditsearned: 'grade',
    score: 'assessment',
    awardedat: 'date',
    achievementdate: 'date',
    startdate: 'date',
    enddate: 'date',
    completiondate: 'date',
    term: 'date',
    issuancedate: 'date',
    validfrom: 'date',
    expirationdate: 'date',
    validuntil: 'date',
    alignment: 'alignment',
    alignments: 'alignment',
    criteria: 'criteria',
    pathway: 'pathway',
    learningpathway: 'pathway',
    step: 'pathway',
    steps: 'pathway',
    topic: 'topic',
    topics: 'topic',
};

const ALLOWED_LEAF_KEY_BY_KIND: Record<FactKind, Record<string, true>> = {
    achievement: {
        achievementtype: true,
        description: true,
        name: true,
        title: true,
    },
    course: {
        coursecode: true,
        coursename: true,
        description: true,
        name: true,
        title: true,
    },
    experience: {
        description: true,
        position: true,
        role: true,
        summary: true,
        title: true,
    },
    competency: {
        description: true,
        name: true,
        title: true,
    },
    goal: {
        description: true,
        goal: true,
        title: true,
    },
    skill: {
        name: true,
        title: true,
    },
    title: {
        name: true,
        professionaltitle: true,
        title: true,
    },
    summary: {
        description: true,
        learned: true,
        summary: true,
        title: true,
    },
    assessment: {
        name: true,
        title: true,
        description: true,
        value: true,
        resulttype: true,
        requiredvalue: true,
        valuemin: true,
        valuemax: true,
        status: true,
        levelachieved: true,
        points: true,
        maxpoints: true,
    },
    grade: { name: true, value: true, grade: true, credits: true, gpa: true },
    date: { name: true, value: true },
    alignment: {
        targetname: true,
        targetdescription: true,
        targetframework: true,
        targetcode: true,
        targettype: true,
    },
    criteria: { name: true, description: true, narrative: true },
    pathway: {
        name: true,
        title: true,
        description: true,
        summary: true,
        stepindex: true,
    },
    topic: { name: true, title: true, description: true },
};

const ROOT_CONTAINER_KEY: Record<string, true> = {
    credentialsubject: true,
    datapayload: true,
    learninghistory: true,
    verifiablecredential: true,
};

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    return value as Record<string, unknown>;
};

export const sanitizeModelSafeText = (value: unknown, maxLength = 240): string | undefined => {
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;

    const sanitized = String(value)
        .replace(/did:[^\s"',)]+/gi, '[identifier]')
        .replace(/urn:uuid:[a-f0-9-]+/gi, '[identifier]')
        .replace(
            /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
            '[identifier]'
        )
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
        .replace(/https?:\/\/\S+/gi, '[link]')
        .replace(/\b[A-Za-z0-9_-]{80,}\b/g, '[opaque]')
        .replace(/\p{Cc}/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);

    return sanitized || undefined;
};

const addFact = (
    value: unknown,
    kind: FactKind,
    facts: ModelSafeCredentialFact[],
    seen: Set<string>,
    label?: string
): void => {
    if (facts.length >= 100) return;

    const text = sanitizeModelSafeText(value);
    if (!text || /^\[(identifier|email|link|opaque)\]$/.test(text)) return;

    const key = `${kind}\u0000${label ?? ''}\u0000${text.toLocaleLowerCase()}`;
    if (seen.has(key)) return;

    seen.add(key);
    facts.push({ kind, value: text, ...(label ? { label } : {}) });
};

const collectFactContainer = (
    value: unknown,
    kind: FactKind,
    facts: ModelSafeCredentialFact[],
    seen: Set<string>,
    label?: string
): void => {
    if (facts.length >= 100) return;

    if (Array.isArray(value)) {
        for (const entry of value) {
            collectFactContainer(entry, kind, facts, seen, label);
        }
        return;
    }

    const record = asRecord(value);
    if (!record) {
        addFact(value, kind, facts, seen, label);
        return;
    }

    for (const [key, entry] of Object.entries(record)) {
        const normalizedKey = normalizeKey(key);
        const nestedKind = Object.hasOwn(FACT_KIND_BY_KEY, normalizedKey)
            ? FACT_KIND_BY_KEY[normalizedKey]
            : undefined;

        if (nestedKind) {
            collectFactContainer(entry, nestedKind, facts, seen, normalizedKey);
            continue;
        }

        if (!Object.hasOwn(ALLOWED_LEAF_KEY_BY_KIND[kind], normalizedKey)) continue;

        if (Array.isArray(entry)) {
            for (const item of entry) addFact(item, kind, facts, seen, normalizedKey);
            continue;
        }

        addFact(entry, kind, facts, seen, normalizedKey);
    }
};

const collectRootFacts = (
    value: unknown,
    facts: ModelSafeCredentialFact[],
    seen: Set<string>
): void => {
    if (facts.length >= 100) return;

    if (Array.isArray(value)) {
        for (const entry of value) collectRootFacts(entry, facts, seen);
        return;
    }

    const record = asRecord(value);
    if (!record) return;

    for (const [key, entry] of Object.entries(record)) {
        const normalizedKey = normalizeKey(key);
        const kind = Object.hasOwn(FACT_KIND_BY_KEY, normalizedKey)
            ? FACT_KIND_BY_KEY[normalizedKey]
            : undefined;

        if (kind) {
            collectFactContainer(entry, kind, facts, seen, normalizedKey);
            continue;
        }

        if (Object.hasOwn(ROOT_CONTAINER_KEY, normalizedKey)) {
            collectRootFacts(entry, facts, seen);
        }
    }
};

const getVerifiedCredentialPayload = (credential: VC): VC => {
    if (!('boostCredential' in credential) || !credential.boostCredential) {
        return credential;
    }

    const payload = getSubjectPayloadShape(credential.boostCredential);
    if (!payload) throw new Error('Verified credential payload is not an object');
    return payload;
};

// `type` may be one string, an array, or (on an inner boost) absent.
const toTypeList = (type: unknown): string[] =>
    (Array.isArray(type) ? type : [type]).filter(
        (entry): entry is string => typeof entry === 'string' && entry.length > 0
    );

const getCredentialTypes = (credential: VC): string[] =>
    [...new Set(toTypeList(credential.type))]
        .filter(type => type !== 'VerifiableCredential' && type !== 'CertifiedBoostCredential')
        .map(type => sanitizeModelSafeText(type, 120))
        .filter((type): type is string => Boolean(type))
        .slice(0, 20);

const parseExpiry = (value: unknown): Date | undefined => {
    if (typeof value !== 'string') return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

// The earliest expiry the signed payload declares (outer or boost credential).
const getCredentialExpiry = (credential: VC): Date | undefined => {
    const payloads = [credential, getVerifiedCredentialPayload(credential)];
    const dates = payloads.flatMap(payload => {
        const record = payload as Record<string, unknown>;
        return [parseExpiry(record.expirationDate), parseExpiry(record.validUntil)];
    });
    return dates
        .filter((date): date is Date => Boolean(date))
        .sort((left, right) => left.getTime() - right.getTime())[0];
};

// An expired credential stays usable as context but is always marked, both
// when it is projected and again when it is read into a prompt (it may have
// expired since it was projected).
const markExpiry = (
    projection: ModelSafeCredentialProjection,
    credential: VC | undefined,
    verification: CredentialVerificationMetadata,
    now: Date
): ModelSafeCredentialProjection => {
    const expiry = credential ? getCredentialExpiry(credential) : undefined;
    const expired =
        projection.expired === true ||
        verification.warnings.includes(CREDENTIAL_EXPIRED_WARNING) ||
        (expiry !== undefined && expiry.getTime() <= now.getTime());
    if (!expired) return projection;
    return {
        ...projection,
        expired: true,
        ...(expiry
            ? { expirationDate: expiry.toISOString() }
            : projection.expirationDate
              ? { expirationDate: projection.expirationDate }
              : {}),
    };
};

export const projectCredential = (
    credential: VC,
    category: string,
    verification: CredentialVerificationMetadata,
    now: Date = new Date()
): ModelSafeCredentialProjection => {
    assertVerifiedCredential(verification, credential);
    const payload = getVerifiedCredentialPayload(credential);
    const facts: ModelSafeCredentialFact[] = [];

    collectRootFacts(payload, facts, new Set());
    facts.sort(
        (left, right) =>
            left.kind.localeCompare(right.kind) ||
            left.value.localeCompare(right.value) ||
            (left.label ?? '').localeCompare(right.label ?? '')
    );

    return ModelSafeCredentialProjectionValidator.parse(
        markExpiry(
            {
                schemaVersion: '1',
                category: sanitizeModelSafeText(category, 120) ?? 'Uncategorized Credential',
                credentialTypes: getCredentialTypes(payload),
                facts,
            },
            credential,
            verification,
            now
        )
    );
};

const assertVerifiedCredential = (
    value: unknown,
    credential?: unknown,
    uri?: string
): CredentialVerificationMetadata => {
    const parsed = CredentialVerificationMetadataValidator.safeParse(value);
    if (
        !parsed.success ||
        parsed.data.status !== 'valid' ||
        parsed.data.errors.length ||
        !parsed.data.checks.includes('proof') ||
        (uri !== undefined && parsed.data.credentialUri !== uri) ||
        (credential !== undefined &&
            parsed.data.contentHash !== fingerprintCredential(credential as VC))
    ) {
        throw new Error('Verified credential provenance is required');
    }
    return parsed.data;
};

type ProjectableCredential = {
    category: string;
    uri?: string;
    credential?: unknown;
    projection?: unknown;
    verification?: unknown;
};

// The stored projection, unchanged. Embedding inputs and cache keys use this so
// they do not shift when a credential crosses its expiry.
export const getCredentialProjection = ({
    uri,
    credential,
    projection,
    verification,
}: ProjectableCredential): ModelSafeCredentialProjection => {
    assertVerifiedCredential(verification, credential, uri);
    const parsedProjection = ModelSafeCredentialProjectionValidator.safeParse(projection);
    if (!parsedProjection.success) throw new Error('Verified credential projection is required');
    return parsedProjection.data;
};

// The projection as a prompt should show it: also marked expired when the
// credential has expired since it was projected.
export const getPromptCredentialProjection = (
    record: ProjectableCredential,
    now: Date = new Date()
): ModelSafeCredentialProjection => {
    const projection = getCredentialProjection(record);
    const parsedCredential = VCValidator.safeParse(record.credential);
    return markExpiry(
        projection,
        parsedCredential.success ? (record.credential as VC) : undefined,
        CredentialVerificationMetadataValidator.parse(record.verification),
        now
    );
};

export const serializeModelSafeCredentialProjection = (
    projection: ModelSafeCredentialProjection
): string => JSON.stringify(ModelSafeCredentialProjectionValidator.parse(projection));

export const serializeModelSafeCredentialRecords = (credentials: ProjectableCredential[]): string =>
    JSON.stringify(credentials.map(credential => getPromptCredentialProjection(credential)));
