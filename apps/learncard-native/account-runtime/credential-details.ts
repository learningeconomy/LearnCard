import { z } from 'zod';

const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
const items = (value: unknown): unknown[] =>
    value == null ? [] : Array.isArray(value) ? value : [value];
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const scalar = (value: unknown): string =>
    typeof value === 'number' && Number.isFinite(value) ? String(value) : text(value);
const webURL = (value: unknown): string | undefined => {
    const source = text(value);
    try {
        const url = new URL(source);
        return ['https:', 'http:'].includes(url.protocol) &&
            url.hostname &&
            !url.username &&
            !url.password
            ? source
            : undefined;
    } catch {
        return undefined;
    }
};
const date = (value: unknown): string | undefined => {
    const source = text(value);
    if (!z.string().datetime({ offset: true }).safeParse(source).success) return undefined;
    return new Date(source).toISOString();
};

interface Narrative {
    name: string;
    text: string;
    url?: string;
}
const narrative = (value: unknown, name = ''): Narrative | undefined => {
    const entry = object(value);
    const body =
        text(entry.narrative) ||
        text(entry.description) ||
        (typeof value === 'string' && !webURL(value) ? text(value) : '');
    const result = {
        name: text(entry.name) || name,
        text: body,
        url: webURL(entry.id) || webURL(entry.url) || webURL(value),
    };
    return result.text || result.url || text(entry.name) ? result : undefined;
};

/** Read-only display projection. Original credentials and proofs must never be rewritten for display. */
export const credentialDetailsForDisplay = (input: unknown) => {
    const source = object(input);
    const raw =
        items(source.type).includes('CertifiedBoostCredential') && source.boostCredential
            ? object(source.boostCredential)
            : source;
    const subjects = items(raw.credentialSubject).map(object);
    const achievements = subjects.flatMap(subject => items(subject.achievement).map(object));
    const legacy = object(object(raw.legacyAssertion).badge);
    const criteria = achievements.flatMap(achievement => {
        const entry = narrative(
            achievement.criteria,
            achievements.length > 1 ? text(achievement.name) : ''
        );
        return entry ? [entry] : [];
    });
    if (!criteria.length && legacy.narrative)
        criteria.push({ name: '', text: text(legacy.narrative) });
    const alignments = [
        ...achievements.flatMap(achievement => items(achievement.alignment)),
        ...items(legacy.alignment),
    ].flatMap(value => {
        const entry = object(value);
        const alignment = {
            name: text(entry.targetName),
            text: text(entry.targetDescription),
            framework: text(entry.targetFramework),
            code: text(entry.targetCode),
            url: webURL(entry.targetUrl),
        };
        return alignment.name ||
            alignment.text ||
            alignment.framework ||
            alignment.code ||
            alignment.url
            ? [alignment]
            : [];
    });
    const evidence = [
        ...items(raw.evidence),
        ...items(raw.attachments),
        ...subjects.flatMap(subject => items(subject.evidence)),
    ].flatMap(value => {
        const entry = narrative(value);
        return entry ? [entry] : [];
    });
    const fields = [
        ...achievements.map(entry => ({ kind: 'fieldOfStudy', value: text(entry.fieldOfStudy) })),
        ...subjects.flatMap(entry =>
            ['role', 'term', 'creditsEarned'].map(kind => ({ kind, value: scalar(entry[kind]) }))
        ),
    ].filter(entry => entry.value);
    const results = subjects.flatMap(subject => {
        const descriptions = items(subject.achievement)
            .flatMap(achievement => items(object(achievement).resultDescription))
            .map(object);
        return items(subject.result).flatMap(value => {
            const entry = object(value),
                inline = object(entry.resultDescription);
            const reference = text(entry.resultDescription) || text(inline.id);
            const description =
                descriptions.find(item => reference && item.id === reference) ?? inline;
            const result = {
                name: text(description.name) || text(entry.name),
                value: scalar(entry.value ?? entry.resultValue),
                text: text(description.description),
                type: text(description.resultType),
            };
            return result.name || result.value || result.text ? [result] : [];
        });
    });
    return {
        criteria,
        alignments,
        evidence,
        fields,
        results,
        activityStartDate: subjects.map(subject => date(subject.activityStartDate)).find(Boolean),
        activityEndDate: subjects.map(subject => date(subject.activityEndDate)).find(Boolean),
        validUntil: date(raw.validUntil) || date(raw.expirationDate),
    };
};

export type NativeSignatureState = 'verified' | 'notVerified' | 'unavailable';
/** Errors may include resolution/network failures, so they never imply revoked, suspended or invalid. */
export const signatureStateForDisplay = (result: unknown): NativeSignatureState => {
    const value = object(result);
    if (!Array.isArray(value.errors)) return 'unavailable';
    return value.errors.length ? 'notVerified' : 'verified';
};
