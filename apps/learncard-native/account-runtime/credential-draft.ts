import { z } from 'zod';
import { resolveNativeAuthoring } from './credential-authoring';

export interface NativeCredentialDraft {
    requestID: string;
    title: string;
    summary: string;
    kind: string;
    category?: string;
    displayType?: string;
    achievementType: string;
    criteria: string;
    artworkURL?: string;
    recipient?: string;
    details?: NativeDraftDetails;
}

export interface NativeDraftDetails {
    criteriaURL?: string;
    fieldOfStudy?: string;
    role?: string;
    term?: string;
    activityStartDate?: string;
    activityEndDate?: string;
    validUntil?: string;
    evidence?: { url: string; name?: string; summary?: string }[];
}

const text = (value: string | undefined, limit: number): string => {
    if (value === undefined) return '';
    if (typeof value !== 'string' || value.length > limit)
        throw new Error('Invalid optional detail');
    return value.trim();
};
const webURL = (value: string): string => {
    const url = new URL(value);
    if (
        !['https:', 'http:'].includes(url.protocol) ||
        !url.hostname ||
        url.username ||
        url.password
    )
        throw new Error('Invalid detail link');
    return value;
};
const date = (value: string | undefined): string | undefined => {
    if (value === undefined || value === '') return undefined;
    if (!z.string().datetime({ offset: true }).safeParse(value).success)
        throw new Error('Invalid detail date');
    return value;
};

/** Blank optional rows are omitted; evidence is top-level, dates/activity fields follow the web OBv3 serializer. */
const optionalDetails = (details: NativeDraftDetails = {}) => {
    if (!details || typeof details !== 'object' || Array.isArray(details))
        throw new Error('Invalid details');
    const criteriaURL = text(details.criteriaURL, 2000);
    const fieldOfStudy = text(details.fieldOfStudy, 200),
        role = text(details.role, 200),
        term = text(details.term, 200);
    const activityStartDate = date(details.activityStartDate),
        activityEndDate = date(details.activityEndDate),
        validUntil = date(details.validUntil);
    if (
        activityStartDate &&
        activityEndDate &&
        Date.parse(activityEndDate) < Date.parse(activityStartDate)
    )
        throw new Error('Activity dates out of order');
    if (details.evidence && (!Array.isArray(details.evidence) || details.evidence.length > 5))
        throw new Error('Invalid evidence');
    const evidence = (details.evidence ?? []).flatMap(item => {
        if (!item || typeof item !== 'object') throw new Error('Invalid evidence');
        const url = text(item.url, 2000),
            name = text(item.name, 120),
            description = text(item.summary, 1000);
        if (!url && !name && !description) return [];
        return [
            {
                id: webURL(url),
                type: ['Evidence'],
                ...(name ? { name } : {}),
                ...(description ? { description } : {}),
            },
        ];
    });
    return {
        criteria: criteriaURL ? { id: webURL(criteriaURL) } : {},
        achievement: { ...(fieldOfStudy ? { fieldOfStudy } : {}) },
        subject: {
            ...(role ? { role } : {}),
            ...(term ? { term } : {}),
            ...(activityStartDate ? { activityStartDate } : {}),
            ...(activityEndDate ? { activityEndDate } : {}),
        },
        credential: {
            ...(validUntil ? { validUntil } : {}),
            ...(evidence.length ? { evidence } : {}),
        },
    };
};

/** Foundation/WebKit dictionary enumeration can reorder nested keys between identical retries. */
export const fingerprintNativeDraft = (input: NativeCredentialDraft): string => {
    const canonical = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(canonical);
        if (value && typeof value === 'object')
            return Object.fromEntries(
                Object.entries(value)
                    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                    .map(([key, item]) => [key, canonical(item)])
            );
        return value;
    };
    return JSON.stringify(canonical(input));
};

/** Current web builder contexts and fields; SDK send fills the recipient and issue date. */
export const buildNativeTemplate = (
    input: NativeCredentialDraft,
    issuerDid: string,
    issuerName: string
) => {
    if (
        !input.requestID ||
        input.requestID.length > 100 ||
        !input.title.trim() ||
        !input.summary.trim() ||
        input.title.length > 100 ||
        input.summary.length > 1000 ||
        input.criteria.length > 2000
    ) {
        throw new Error('Invalid credential details');
    }
    if (input.artworkURL) {
        const url = new URL(input.artworkURL);
        if (
            url.protocol !== 'https:' ||
            url.host !== 'cdn.filestackcontent.com' ||
            url.username ||
            url.password
        )
            throw new Error('Unsupported artwork');
    }
    const details = optionalDetails(input.details);
    const authoring = resolveNativeAuthoring(input);
    return {
        ...details.credential,
        ...(authoring.displayType === 'media' && input.artworkURL
            ? {
                  evidence: [
                      {
                          id: input.artworkURL,
                          type: ['Evidence', 'EvidenceFile'],
                          name: input.title.trim(),
                          genre: 'photo',
                          fileType: 'image/jpeg',
                      },
                      ...(details.credential.evidence ?? []),
                  ],
              }
            : {}),
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
            ...(authoring.category === 'ID'
                ? ['https://ctx.learncard.com/boostIDs/1.0.0.json']
                : []),
        ],
        type: [
            'VerifiableCredential',
            'OpenBadgeCredential',
            'BoostCredential',
            ...(authoring.category === 'ID' ? ['BoostID'] : []),
        ],
        display: {
            displayType: authoring.displayType,
            backgroundColor: authoring.backgroundColor,
            previewType: 'default',
        },
        name: input.title.trim(),
        issuer: { id: issuerDid, name: issuerName },
        credentialSubject: {
            type: ['AchievementSubject'],
            ...details.subject,
            achievement: {
                id: `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                name: input.title.trim(),
                description: input.summary.trim(),
                achievementType: authoring.achievementType,
                tag: [`lc:category:${authoring.category}`],
                ...details.achievement,
                criteria: {
                    ...details.criteria,
                    narrative: input.criteria.trim() || input.summary.trim(),
                },
                ...(input.artworkURL ? { image: { id: input.artworkURL, type: 'Image' } } : {}),
            },
        },
    };
};
