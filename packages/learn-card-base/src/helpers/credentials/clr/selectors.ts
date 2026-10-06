import type {
    ClrAssociationResolution,
    ClrIdentifierModel,
    ClrJsonObject,
    ClrMappedValue,
    ClrNormalizedModel,
    ClrNormalizedRecord,
    ClrProfileModel,
} from './types';

/** A sole subject can be represented as an object or a one-element array. */
export const getSingleClrSubject = (credential: ClrJsonObject): ClrJsonObject | undefined => {
    const value = credential.credentialSubject;
    const subject = Array.isArray(value) ? (value.length === 1 ? value[0] : undefined) : value;
    return subject && typeof subject === 'object' && !Array.isArray(subject) ? subject : undefined;
};

/** Exact source path, including the array index when the sole subject uses array encoding. */
export const getClrSubjectPath = (credential: ClrJsonObject, prefix = ''): string =>
    `${prefix ? `${prefix}.` : ''}credentialSubject${Array.isArray(credential.credentialSubject) && credential.credentialSubject.length === 1 ? '[0]' : ''}`;

/** Detects the existing standalone Course presentation without title-based inference. */
export const isStandaloneCourseCredential = (credential: ClrJsonObject): boolean => {
    const types = Array.isArray(credential.type) ? credential.type : [credential.type];
    if (types.includes('ClrCredential')) return false;
    const subject = getSingleClrSubject(credential);
    if (!subject) return false;
    const children = subject.verifiableCredential;
    if (Array.isArray(children) ? children.length > 0 : children != null) return false;
    const achievement = subject.achievement as ClrJsonObject | undefined;
    const issuer = credential.issuer as ClrJsonObject | undefined;
    return (
        !Array.isArray(achievement) &&
        achievement?.achievementType === 'Course' &&
        typeof achievement.name === 'string' &&
        achievement.name.trim().length > 0 &&
        typeof issuer?.name === 'string' &&
        issuer.name.trim().length > 0
    );
};

/** Resolves every alias conservatively; shared Achievement IDs never select the first assertion. */
export const resolveClrRecord = (
    model: ClrNormalizedModel,
    id: string
): { resolution: ClrAssociationResolution; record?: ClrNormalizedRecord } => {
    const records = model.records.filter(record => record.aliases.includes(id));
    if (records.length === 1) return { resolution: 'resolved', record: records[0] };
    return { resolution: records.length > 1 ? 'ambiguous' : 'unresolved' };
};

/** Reads an issuer image without changing its source path or treating the publisher as a child issuer. */
export const getClrProfileImage = (
    profile?: ClrProfileModel
): ClrMappedValue<string> | undefined => {
    const image = profile?.image;
    const value = typeof image === 'string' ? image : image?.id;
    if (!profile || typeof value !== 'string') return undefined;
    return {
        value,
        sourcePath: `${profile.sourcePath}.image${typeof image === 'string' ? '' : '.id'}`,
        sourceKind: profile.id?.sourceKind ?? profile.name?.sourceKind ?? 'collectionCredential',
    };
};

/** Prefers a declared name, then email, another identifier, and finally the subject ID. */
export const getClrLearnerName = (
    identifiers: ClrIdentifierModel[],
    subjectId?: ClrMappedValue<string>
): ClrMappedValue<string> | undefined => {
    const valueOf = (identifier: ClrIdentifierModel) =>
        identifier.identityHash ?? identifier.identifier;
    for (const kind of ['name', 'emailAddress', 'email']) {
        const identifier = identifiers.find(
            item => item.identityType?.value === kind || item.identifierType?.value === kind
        );
        const value = identifier && valueOf(identifier);
        if (value?.value) return value;
    }
    return identifiers.map(valueOf).find(value => Boolean(value?.value)) ?? subjectId;
};
