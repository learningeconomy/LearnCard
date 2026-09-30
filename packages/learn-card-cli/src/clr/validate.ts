import { ClrCredentialValidator, UnsignedClrCredentialValidator } from '@learncard/types';

/**
 * Issuer-facing lint profile. `provisional` transcripts are expected to change again
 * before finalization; `official` transcripts are the final, certified record.
 */
export type ClrValidationProfile = 'provisional' | 'official';

export interface ClrValidationOptions {
    profile?: ClrValidationProfile;
}

export interface ClrValidationSummary {
    name?: string;
    id?: string;
    partial?: boolean;
    achievementCount: number;
    resultStatuses: Record<string, number>;
}

export interface ClrValidationResult {
    errors: string[];
    warnings: string[];
    summary: ClrValidationSummary;
}

const CLR_V2_CONTEXT_URL = 'https://purl.imsglobal.org/spec/clr/v2p0/context.json';
const CLR_V2_CONTEXT_PATTERN = /purl\.imsglobal\.org\/spec\/clr\/v2p0\/context/;
const CLR_V2_LEGACY_CONTEXT_PATTERN = /context-2\.0\.1\.json/;
const PII_KEY_PATTERN = /ssn|socialsecurity|dateofbirth|dob|birthdate/i;
const IN_PROGRESS_STATUSES = new Set(['InProgress', 'Provisional']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const toArray = (value: unknown): unknown[] => {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
};

/** `@context` must include the CLR v2 context; the 2.0.1 URL fails to sign (remote-load only). */
const lintContext = (doc: Record<string, unknown>, errors: string[]): void => {
    const contexts = toArray(doc['@context']).filter(
        (entry): entry is string => typeof entry === 'string'
    );
    const clrEntry = contexts.find(entry => CLR_V2_CONTEXT_PATTERN.test(entry));
    if (!clrEntry) {
        errors.push(`@context: must include the CLR v2 context (${CLR_V2_CONTEXT_URL}).`);
        return;
    }
    if (CLR_V2_LEGACY_CONTEXT_PATTERN.test(clrEntry)) {
        errors.push(
            `Use ${CLR_V2_CONTEXT_URL} (the 2.0.1 URL requires remote context loading and will fail to sign)`
        );
    }
};

/** A missing id is an error; a non-`urn:uuid:` id is a warning (ids must be stable across versions). */
const lintId = (doc: Record<string, unknown>, errors: string[], warnings: string[]): void => {
    const id = doc.id;
    if (typeof id !== 'string' || !id) {
        errors.push('id: missing — every CLR transcript needs a stable id.');
        return;
    }
    if (!id.startsWith('urn:uuid:')) {
        warnings.push('id: use a stable urn:uuid per transcript, never per version');
    }
};

/** Recursively flag keys that look like they hold PII, wherever they appear in the document. */
const collectPii = (value: unknown, path: string, warnings: string[]): void => {
    if (Array.isArray(value)) {
        value.forEach((item, index) => collectPii(item, `${path}[${index}]`, warnings));
        return;
    }
    if (!isRecord(value)) return;
    for (const [key, nested] of Object.entries(value)) {
        const nextPath = path ? `${path}.${key}` : key;
        if (PII_KEY_PATTERN.test(key)) {
            warnings.push(
                `${nextPath}: possible PII field ("${key}") — avoid embedding sensitive personal data in a transcript.`
            );
        }
        collectPii(nested, nextPath, warnings);
    }
};

interface ClrResultNode {
    path: string;
    status?: string;
    resultDescription?: string;
}

interface ClrWalkData {
    achievementCount: number;
    resultDescriptionTypes: Map<string, string>;
    results: ClrResultNode[];
}

const addAchievement = (achievement: unknown, data: ClrWalkData): void => {
    if (!isRecord(achievement)) return;
    data.achievementCount += 1;
    for (const resultDescription of toArray(achievement.resultDescription)) {
        if (
            isRecord(resultDescription) &&
            typeof resultDescription.id === 'string' &&
            typeof resultDescription.resultType === 'string'
        ) {
            data.resultDescriptionTypes.set(resultDescription.id, resultDescription.resultType);
        }
    }
};

/**
 * Walks the CLR document collecting every achievement (top-level and nested, so
 * `resultDescription`s from both can satisfy a result's reference), and every result
 * carried by a nested `AchievementCredential` (CLR subjects have no `result` field of
 * their own — only nested verifiableCredentials do).
 */
const walkClr = (doc: Record<string, unknown>): ClrWalkData => {
    const data: ClrWalkData = {
        achievementCount: 0,
        resultDescriptionTypes: new Map(),
        results: [],
    };

    toArray(doc.credentialSubject).forEach((subject, subjectIndex) => {
        if (!isRecord(subject)) return;

        for (const achievement of toArray(subject.achievement)) addAchievement(achievement, data);

        toArray(subject.verifiableCredential).forEach((nested, nestedIndex) => {
            if (!isRecord(nested)) return;

            toArray(nested.credentialSubject).forEach((nestedSubject, nestedSubjectIndex) => {
                if (!isRecord(nestedSubject)) return;

                for (const achievement of toArray(nestedSubject.achievement)) {
                    addAchievement(achievement, data);
                }

                for (const result of toArray(nestedSubject.result)) {
                    if (!isRecord(result)) continue;
                    data.results.push({
                        path: `credentialSubject[${subjectIndex}].verifiableCredential[${nestedIndex}].credentialSubject[${nestedSubjectIndex}].result`,
                        status: typeof result.status === 'string' ? result.status : undefined,
                        resultDescription:
                            typeof result.resultDescription === 'string'
                                ? result.resultDescription
                                : undefined,
                    });
                }
            });
        });
    });

    return data;
};

/**
 * Lints a CLR 2.0 transcript (signed or unsigned) against schema and issuer-profile rules.
 * Pure: performs no I/O and never throws on malformed input — problems are reported in
 * `errors`/`warnings` instead.
 */
export const validateClr = (
    json: unknown,
    opts: ClrValidationOptions = {}
): ClrValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const hasProof = isRecord(json) && json.proof !== undefined;
    const parsed = hasProof
        ? ClrCredentialValidator.safeParse(json)
        : UnsignedClrCredentialValidator.safeParse(json);

    if (!parsed.success) {
        for (const issue of parsed.error.issues) {
            const path = issue.path.length ? issue.path.join('.') : '(root)';
            errors.push(`${path}: ${issue.message}`);
        }
    }

    const doc = isRecord(json) ? json : {};

    lintContext(doc, errors);
    lintId(doc, errors, warnings);
    collectPii(doc, '', warnings);

    const walked = walkClr(doc);

    const resultStatuses: Record<string, number> = {};
    for (const result of walked.results) {
        if (!result.status) continue;
        resultStatuses[result.status] = (resultStatuses[result.status] ?? 0) + 1;
    }

    const partial = typeof doc.partial === 'boolean' ? doc.partial : undefined;

    if (opts.profile === 'provisional') {
        if (partial !== true) {
            errors.push('partial: must be true for a provisional transcript (set partial: true).');
        }
        for (const result of walked.results) {
            if (!result.status || !IN_PROGRESS_STATUSES.has(result.status)) continue;
            const resultType = result.resultDescription
                ? walked.resultDescriptionTypes.get(result.resultDescription)
                : undefined;
            if (resultType !== 'Status') {
                errors.push(
                    `${result.path}: status "${result.status}" must reference a ResultDescription with resultType "Status" (found ${resultType ? `"${resultType}"` : 'none'}).`
                );
            }
        }
        if (typeof doc.validUntil !== 'string' || !doc.validUntil) {
            warnings.push(
                'validUntil: missing — provisional transcripts should set an expected finalization date.'
            );
        }
    } else if (opts.profile === 'official') {
        if (partial === true) {
            errors.push('partial: must not be true for an official transcript.');
        }
        for (const result of walked.results) {
            if (result.status && IN_PROGRESS_STATUSES.has(result.status)) {
                errors.push(
                    `${result.path}: status "${result.status}" is not allowed in an official transcript.`
                );
            }
        }
    }

    const summary: ClrValidationSummary = {
        name: typeof doc.name === 'string' ? doc.name : undefined,
        id: typeof doc.id === 'string' ? doc.id : undefined,
        partial,
        achievementCount: walked.achievementCount,
        resultStatuses,
    };

    return { errors, warnings, summary };
};
