import type { CredentialMatch } from '@learncard/types';

export interface CredentialSummary {
    uri: string;
    /** Undefined only for summaries persisted before name extraction was introduced. */
    name?: string | null;
    category: string | null;
    types: string[];
    issuer: string | null;
    nestedIssuers: string[];
    achievementTypes: string[];
    issuedAt: string | null;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord | null => (isRecord(value) ? value : null);

const asRecords = (value: unknown): UnknownRecord[] => {
    if (Array.isArray(value)) return value.filter(isRecord);

    const record = asRecord(value);

    return record ? [record] : [];
};

const asStrings = (value: unknown): string[] => {
    if (typeof value === 'string') return value ? [value] : [];
    if (!Array.isArray(value)) return [];

    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
};

const unique = (values: string[]): string[] => [...new Set(values)];

const firstString = (...values: unknown[]): string | null => {
    const value = values.find(candidate => typeof candidate === 'string' && candidate.length > 0);

    return typeof value === 'string' ? value : null;
};

const issuerId = (value: unknown): string | null => {
    if (typeof value === 'string') return value || null;

    const record = asRecord(value);

    return typeof record?.id === 'string' && record.id ? record.id : null;
};

const unwrapBoost = (value: unknown): UnknownRecord | null => {
    const credential = asRecord(value);

    if (!credential) return null;

    const isBoost = asStrings(credential.type).includes('CertifiedBoostCredential');
    const inner = asRecord(credential.boostCredential);

    return isBoost && inner ? inner : credential;
};

const nestedCredentials = (credential: UnknownRecord): UnknownRecord[] =>
    asRecords(credential.credentialSubject).flatMap(subject =>
        asRecords(subject.verifiableCredential)
    );

const collectNestedCredentials = (credential: UnknownRecord): UnknownRecord[] => {
    const collected: UnknownRecord[] = [];
    const pending = nestedCredentials(credential);
    const seen = new Set<UnknownRecord>();

    while (pending.length > 0) {
        const next = pending.shift();

        if (!next || seen.has(next)) continue;

        seen.add(next);
        collected.push(next);
        pending.push(...nestedCredentials(next));
    }

    return collected;
};

const collectAchievementTypes = (credential: UnknownRecord): string[] => {
    const fromCredential = (value: UnknownRecord): string[] =>
        asRecords(value.credentialSubject).flatMap(subject =>
            asRecords(subject.achievement).flatMap(achievement =>
                asStrings(achievement.achievementType)
            )
        );

    return unique([
        ...fromCredential(credential),
        ...collectNestedCredentials(credential).flatMap(fromCredential),
    ]);
};

const credentialName = (credential: UnknownRecord, nested: UnknownRecord[]): string | null => {
    const candidates = [credential, ...nested];

    for (const candidate of candidates) {
        const subjects = asRecords(candidate.credentialSubject);
        const name = firstString(
            candidate.name,
            ...subjects.map(subject => subject.name),
            ...subjects.flatMap(subject =>
                asRecords(subject.achievement).map(achievement => achievement.name)
            )
        );

        if (name) return name;
    }

    return null;
};

export const summarizeCredential = (
    uri: string,
    vc: unknown,
    category?: string | null
): CredentialSummary => {
    try {
        // Certified Boost credentials wrap the credential we actually want to target.
        // Normalize that shape before extracting any facts.
        const credential = unwrapBoost(vc);

        if (!credential) {
            // Preserve the index metadata even when the stored value is malformed or unavailable.
            return {
                uri,
                name: null,
                category: category ?? null,
                types: [],
                issuer: null,
                nestedIssuers: [],
                achievementTypes: [],
                issuedAt: null,
            };
        }

        // CLR credentials may embed other credentials in
        // credentialSubject.verifiableCredential. Their issuers and achievement
        // types are kept separately from the top-level credential's values.
        const nested = collectNestedCredentials(credential);

        // VC Data Model 2.0 uses validFrom, while older credentials commonly use
        // issuanceDate. Matching validates the chosen value before using it.
        let issuedAt: string | null = null;

        if (typeof credential.validFrom === 'string') {
            issuedAt = credential.validFrom;
        } else if (typeof credential.issuanceDate === 'string') {
            issuedAt = credential.issuanceDate;
        }

        return {
            uri,
            name: credentialName(credential, nested),
            category: category ?? null,
            types: unique(asStrings(credential.type)),
            issuer: issuerId(credential.issuer),
            nestedIssuers: unique(
                nested.map(item => issuerId(item.issuer)).filter((id): id is string => Boolean(id))
            ),
            achievementTypes: collectAchievementTypes(credential),
            issuedAt,
        };
    } catch {
        // Targeting must fail closed: never let an unexpected credential shape
        // interrupt loading or accidentally produce a positive match.
        return {
            uri,
            name: null,
            category: category ?? null,
            types: [],
            issuer: null,
            nestedIssuers: [],
            achievementTypes: [],
            issuedAt: null,
        };
    }
};

/**
 * Summarize only credentials whose core VC fields can be interpreted safely.
 * A truthy but malformed decrypted value must remain incomplete; otherwise an
 * empty summary could make a negated credential predicate treat unknown data
 * as confirmed absence.
 */
export const trySummarizeCredential = (
    uri: string,
    vc: unknown,
    category?: string | null
): CredentialSummary | null => {
    const summary = summarizeCredential(uri, vc, category);

    return summary.types.length > 0 && summary.issuer !== null ? summary : null;
};

const overlaps = (actual: string[], expected: string[] | undefined): boolean =>
    !expected || expected.some(value => actual.includes(value));

export const credentialMatches = (
    summary: CredentialSummary,
    match: CredentialMatch,
    now: number = Date.now()
): boolean => {
    if (match.issuers && (!summary.issuer || !match.issuers.includes(summary.issuer))) return false;
    if (!overlaps(summary.nestedIssuers, match.nestedIssuers)) return false;
    if (!overlaps(summary.types, match.vcTypes)) return false;
    if (!overlaps(summary.category ? [summary.category] : [], match.categories)) return false;
    if (!overlaps(summary.achievementTypes, match.achievementTypes)) return false;

    if (match.issuedWithinDays !== undefined) {
        if (!summary.issuedAt) return false;

        const issuedAt = new Date(summary.issuedAt).getTime();

        if (Number.isNaN(issuedAt)) return false;
        if (issuedAt > now) return false;
        if (issuedAt < now - match.issuedWithinDays * 24 * 60 * 60 * 1000) return false;
    }

    return true;
};

export const countMatchingCredentials = (
    summaries: CredentialSummary[],
    match: CredentialMatch,
    now: number = Date.now()
): number => summaries.filter(summary => credentialMatches(summary, match, now)).length;
