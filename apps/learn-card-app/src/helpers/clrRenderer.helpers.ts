/** A directly mapped CLR/OB value with provenance metadata for traceable rendering. */
export type SourceMappedField<T> = {
    value: T;
    sourcePath: string;
    specField: string;
    sourceCredentialId?: string;
    directlyMapped: true;
};

/** Canonical warning codes emitted by strict CLR normalization. */
export type DisplayWarningCode =
    | 'MISSING_LEARNER_IDENTIFIER'
    | 'MISSING_COURSES'
    | 'MISSING_TERMS'
    | 'MISSING_GPA'
    | 'MISSING_CREDITS'
    | 'UNSIGNED_CREDENTIAL'
    | 'NESTED_UNSIGNED_CREDENTIALS'
    | 'AMBIGUOUS_RECORD'
    | 'LARGE_INLINE_EVIDENCE'
    | 'PARTIAL_CLR';

/** Warning entry surfaced to admin/debug views for missing, ambiguous, or risky data conditions. */
export type DisplayWarning = {
    code: DisplayWarningCode;
    message: string;
    severity: 'info' | 'warning' | 'error';
    sourceCredentialId?: string;
    sourcePath?: string;
};

/** High-level signature/proof summary for parent and nested credentials. */
export type VerificationSummary = {
    credentialSigned: boolean;
    credentialVerified: boolean;
    nestedCredentialSignedCount: number;
    nestedCredentialUnsignedCount: number;
    status: 'verified' | 'signed-unverified' | 'unsigned' | 'unknown';
    hasCredentialStatus: boolean;
    credentialStatusType?: string;
};

/** Normalized result value and optional resolved semantics from ResultDescription. */
export type ResultDisplayModel = {
    value: SourceMappedField<string | number | boolean>;
    resultType?: SourceMappedField<string>;
    label?: SourceMappedField<string>;
    resultDescriptionId?: SourceMappedField<string>;
    valueMax?: SourceMappedField<string>;
    valueMin?: SourceMappedField<string>;
    allowedValue?: SourceMappedField<string[]>;
};

/** Normalized evidence metadata with inline payload safety flags. */
export type EvidenceDisplayModel = {
    id?: SourceMappedField<string>;
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    narrative?: SourceMappedField<string>;
    genre?: SourceMappedField<string>;
    audience?: SourceMappedField<string>;
    type?: SourceMappedField<string[] | string>;
    /** MIME type extracted from data URI, or inferred from URL file extension. */
    mimeType?: string;
    isInlineDataUri: boolean;
    isLargeInlineDataUri: boolean;
    sourceCredentialId: string;
};

/** Strictly classified course record (`achievementType: Course`). */
export type CourseDisplayModel = {
    name?: SourceMappedField<string>;
    humanCode?: SourceMappedField<string>;
    fieldOfStudy?: SourceMappedField<string>;
    creditsAvailable?: SourceMappedField<number>;
    creditsEarned?: SourceMappedField<number>;
    term?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    validUntil?: SourceMappedField<string>;
    achievementType: SourceMappedField<'Course'>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
};

/** Strictly classified program/degree record (allowed program achievement types only). */
export type ProgramDisplayModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    validUntil?: SourceMappedField<string>;
    achievementType: SourceMappedField<string>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
};

/** Strictly classified competency record (`achievementType: Competency`). */
export type CompetencyDisplayModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    achievementType: SourceMappedField<'Competency'>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
};

/** Explicitly classified assessment record (assessment-specific signal required). */
export type AssessmentDisplayModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
};

/** Catch-all for transcript-adjacent records that do not meet strict transcript classifications. */
export type OtherAcademicRecordModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    sourceCredentialId: string;
    reason: 'unsupportedAchievementType' | 'ambiguous' | 'missingAchievement' | 'notTranscriptSpecific';
};

/** A single resolved association between two credentials in this CLR. */
export type AssociationDisplayModel = {
    associationType: string;
    sourceId: string;
    targetId: string;
    /** Resolved name of the source credential (from its name or achievement.name). */
    sourceName?: string;
    /** Resolved name of the target credential (from its name or achievement.name). */
    targetName?: string;
};

/** Normalized issuer address for display, with provenance. */
export type IssuerAddressDisplayModel = {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
    sourcePath: string;
};

/** Complete normalized display model consumed by transcript renderer surfaces and views. */
export type ClrTranscriptDisplayModel = {
    meta: {
        /** True if the publisher intentionally omitted some assertions from this CLR. */
        partial: boolean;
        /** credentialStatus.type if present, used to indicate revocation-check capability. */
        credentialStatusType?: string;
    };
    header: {
        id: SourceMappedField<string>;
        type: SourceMappedField<string[] | string>;
        title: SourceMappedField<string>;
        description?: SourceMappedField<string>;
        image?: SourceMappedField<string>;
        issuerName?: SourceMappedField<string>;
        issuerId?: SourceMappedField<string>;
        issuerAddress?: IssuerAddressDisplayModel;
        issuedAt?: SourceMappedField<string>;
        awardedDate?: SourceMappedField<string>;
        validUntil?: SourceMappedField<string>;
        learnerName?: SourceMappedField<string>;
        learnerIdentifiers: SourceMappedField<Array<Record<string, unknown>>>;
    };
    summary: {
        gpa?: SourceMappedField<string | number | boolean>;
        courseCount: number;
        totalCreditsAvailable?: number;
        explicitCompetencyCount: number;
        evidenceCount: number;
    };
    courses: CourseDisplayModel[];
    programs: ProgramDisplayModel[];
    competencies: CompetencyDisplayModel[];
    assessments: AssessmentDisplayModel[];
    otherRecords: OtherAcademicRecordModel[];
    evidence: EvidenceDisplayModel[];
    associations: AssociationDisplayModel[];
    warnings: DisplayWarning[];
    quality: {
        level: 'rich' | 'usable' | 'sparse' | 'poor';
        reasons: string[];
    };
    verification: VerificationSummary;
};

/** Audience role used to select rendering behavior. */
export type ClrTranscriptViewer = 'student' | 'employer' | 'admin' | 'registrar';

/** UI surface size/context used for compact vs detailed rendering choices. */
export enum ClrTranscriptSurface {
    Card = 'card',
    Full = 'full',
    Embed = 'embed',
}

/** Rendering context options used by view selection. */
export type ViewOptions = {
    viewer: ClrTranscriptViewer;
    surface: ClrTranscriptSurface;
};

const PROGRAM_TYPES = new Set([
    'AssociateDegree',
    'BachelorDegree',
    'Degree',
    'DoctoralDegree',
    'MasterDegree',
    'LearningProgram',
]);

const LARGE_INLINE_EVIDENCE_THRESHOLD = 100_000;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

/** Formats an ISO-8601 date string to a human-readable form (e.g. "Jan 15, 2025"). Passes non-date strings through unchanged. */
export const formatClrDate = (value: string): string => {
    if (!ISO_DATE_RE.test(value)) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Creates a fully traced value so UI and debug views can link rendered data back to source fields.
const asMapped = <T>(
    value: T,
    sourcePath: string,
    specField: string,
    sourceCredentialId?: string
): SourceMappedField<T> => ({ value, sourcePath, specField, sourceCredentialId, directlyMapped: true });

const asArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
};

// Extracts the raw string value from either IdentityObject (identityHash) or IdentifierEntry (identifier).
const extractIdentifierValue = (id: Record<string, unknown>): string | undefined => {
    if (typeof id.identityHash === 'string') return id.identityHash;
    if (typeof id.identifier === 'string') return id.identifier;
    return undefined;
};

// Finds the first identifier matching any of the given type values across both CLR identity formats.
const findIdentifierByType = (
    identifiers: Array<Record<string, unknown>>,
    types: string[]
): string | undefined => {
    for (const type of types) {
        const match = identifiers.find(id => id.identityType === type || id.identifierType === type);
        if (match) {
            const value = extractIdentifierValue(match);
            if (value) return value;
        }
    }
    return undefined;
};

// Resolves the best available learner display string:
// name > email > any other extractable identifier value > subject DID.
const getLearnerName = (
    identifiers: Array<Record<string, unknown>>,
    subjectId?: string
): string | undefined => {
    const name = findIdentifierByType(identifiers, ['name']);
    if (name) return name;

    const email = findIdentifierByType(identifiers, ['emailAddress', 'email']);
    if (email) return email;

    for (const id of identifiers) {
        const value = extractIdentifierValue(id);
        if (value) return value;
    }

    return subjectId;
};

const collectEvidence = (
    rawEvidence: unknown,
    sourceCredentialId: string,
    basePath: string,
    warnings: DisplayWarning[]
): EvidenceDisplayModel[] => {
    // Evidence may be URL-based or inline data URIs. Inline payloads are tracked for safe rendering decisions.
    return asArray<Record<string, unknown>>(rawEvidence as Record<string, unknown>[]).map((ev, index) => {
        const id = typeof ev.id === 'string' ? ev.id : undefined;
        const isInlineDataUri = typeof id === 'string' && id.startsWith('data:');
        const isLargeInlineDataUri = isInlineDataUri && id.length > LARGE_INLINE_EVIDENCE_THRESHOLD;
        const mimeType = isInlineDataUri
            ? id!.slice(5, id!.indexOf(';'))
            : typeof id === 'string'
              ? (/\.pdf$/i.test(id) ? 'application/pdf'
                : /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(id) ? `image/${id.match(/\.(\w+)$/)?.[1]?.toLowerCase()}`
                : undefined)
              : undefined;

        if (isLargeInlineDataUri) {
            warnings.push({
                code: 'LARGE_INLINE_EVIDENCE',
                message: 'Large inline evidence should not be eagerly rendered in compact views.',
                severity: 'warning',
                sourceCredentialId,
                sourcePath: `${basePath}[${index}].id`,
            });
        }

        return {
            id: id
                ? asMapped(id, `${basePath}[${index}].id`, 'evidence.id', sourceCredentialId)
                : undefined,
            name:
                typeof ev.name === 'string'
                    ? asMapped(ev.name, `${basePath}[${index}].name`, 'evidence.name', sourceCredentialId)
                    : undefined,
            description:
                typeof ev.description === 'string'
                    ? asMapped(
                          ev.description,
                          `${basePath}[${index}].description`,
                          'evidence.description',
                          sourceCredentialId
                      )
                    : undefined,
            narrative:
                typeof ev.narrative === 'string'
                    ? asMapped(
                          ev.narrative,
                          `${basePath}[${index}].narrative`,
                          'evidence.narrative',
                          sourceCredentialId
                      )
                    : undefined,
            genre:
                typeof ev.genre === 'string'
                    ? asMapped(ev.genre, `${basePath}[${index}].genre`, 'evidence.genre', sourceCredentialId)
                    : undefined,
            audience:
                typeof ev.audience === 'string'
                    ? asMapped(
                          ev.audience,
                          `${basePath}[${index}].audience`,
                          'evidence.audience',
                          sourceCredentialId
                      )
                    : undefined,
            type: ev.type
                ? asMapped(ev.type as string[] | string, `${basePath}[${index}].type`, 'evidence.type', sourceCredentialId)
                : undefined,
            mimeType,
            isInlineDataUri,
            isLargeInlineDataUri,
            sourceCredentialId,
        };
    });
};

const mapResults = (
    result: unknown,
    resultDescriptionById: Map<string, Record<string, unknown>>,
    sourceCredentialId: string,
    basePath: string
): ResultDisplayModel[] => {
    // ResultDescription drives semantic meaning (for example GPA), so we resolve by explicit IDs only.
    return asArray<Record<string, unknown>>(result as Record<string, unknown>[]).flatMap((entry, index) => {
        if (entry.value === undefined) return [];

        const resultDescriptionId =
            typeof entry.resultDescription === 'string' ? entry.resultDescription : undefined;

        const resultDescription = resultDescriptionId
            ? resultDescriptionById.get(resultDescriptionId)
            : undefined;

        const mapped: ResultDisplayModel = {
            value: asMapped(
                entry.value as string | number | boolean,
                `${basePath}[${index}].value`,
                'result.value',
                sourceCredentialId
            ),
            resultDescriptionId: resultDescriptionId
                ? asMapped(
                      resultDescriptionId,
                      `${basePath}[${index}].resultDescription`,
                      'result.resultDescription',
                      sourceCredentialId
                  )
                : undefined,
            resultType:
                typeof resultDescription?.resultType === 'string'
                    ? asMapped(
                          resultDescription.resultType,
                          `achievement.resultDescription[${index}].resultType`,
                          'resultDescription.resultType',
                          sourceCredentialId
                      )
                    : undefined,
            label:
                typeof resultDescription?.name === 'string'
                    ? asMapped(
                          resultDescription.name,
                          `achievement.resultDescription[${index}].name`,
                          'resultDescription.name',
                          sourceCredentialId
                      )
                    : undefined,
            valueMax:
                typeof resultDescription?.valueMax === 'string'
                    ? asMapped(
                          resultDescription.valueMax,
                          `achievement.resultDescription[${index}].valueMax`,
                          'resultDescription.valueMax',
                          sourceCredentialId
                      )
                    : undefined,
            valueMin:
                typeof resultDescription?.valueMin === 'string'
                    ? asMapped(
                          resultDescription.valueMin,
                          `achievement.resultDescription[${index}].valueMin`,
                          'resultDescription.valueMin',
                          sourceCredentialId
                      )
                    : undefined,
            allowedValue:
                Array.isArray(resultDescription?.allowedValue) &&
                (resultDescription.allowedValue as unknown[]).every(v => typeof v === 'string')
                    ? asMapped(
                          resultDescription.allowedValue as string[],
                          `achievement.resultDescription[${index}].allowedValue`,
                          'resultDescription.allowedValue',
                          sourceCredentialId
                      )
                    : undefined,
        };

        return [mapped];
    });
};

const classifyRecord = (
    nestedCredential: Record<string, unknown>,
    warnings: DisplayWarning[]
): {
    course?: CourseDisplayModel;
    program?: ProgramDisplayModel;
    competency?: CompetencyDisplayModel;
    assessment?: AssessmentDisplayModel;
    other?: OtherAcademicRecordModel;
    gpa?: SourceMappedField<string | number | boolean>;
    evidence: EvidenceDisplayModel[];
} => {
    // Strict no-guessing path: classification is based only on explicit CLR/OB fields.
    const nestedId = typeof nestedCredential.id === 'string' ? nestedCredential.id : 'nested-unknown';
    const nestedSubject = (nestedCredential.credentialSubject ?? {}) as Record<string, unknown>;
    const achievement = (nestedSubject.achievement ?? {}) as Record<string, unknown>;
    const achievementType =
        typeof achievement.achievementType === 'string' ? achievement.achievementType : undefined;

    const resultDescriptions = asArray<Record<string, unknown>>(
        achievement.resultDescription as Record<string, unknown>[]
    );

    const resultDescriptionById = new Map(
        resultDescriptions
            .map(rd => [rd.id, rd] as const)
            .filter(([id]) => typeof id === 'string') as Array<[string, Record<string, unknown>]>
    );

    const results = mapResults(nestedSubject.result, resultDescriptionById, nestedId, 'credentialSubject.result');
    const evidence = [
        ...collectEvidence(nestedCredential.evidence, nestedId, 'evidence', warnings),
        ...collectEvidence(nestedSubject.evidence, nestedId, 'credentialSubject.evidence', warnings),
    ];

    const hasGpaResult = results.find(result => result.resultType?.value === 'GradePointAverage');

    // Shared achievement-level fields present on all record types.
    const achievementName =
        typeof achievement.name === 'string'
            ? asMapped(achievement.name, 'achievement.name', 'achievement.name', nestedId)
            : undefined;
    const achievementDescription =
        typeof achievement.description === 'string'
            ? asMapped(achievement.description, 'achievement.description', 'achievement.description', nestedId)
            : undefined;
    const humanCode =
        typeof achievement.humanCode === 'string'
            ? asMapped(achievement.humanCode, 'achievement.humanCode', 'achievement.humanCode', nestedId)
            : undefined;
    const fieldOfStudy =
        typeof achievement.fieldOfStudy === 'string'
            ? asMapped(achievement.fieldOfStudy, 'achievement.fieldOfStudy', 'achievement.fieldOfStudy', nestedId)
            : undefined;
    const creditsAvailable =
        typeof achievement.creditsAvailable === 'number'
            ? asMapped(achievement.creditsAvailable, 'achievement.creditsAvailable', 'achievement.creditsAvailable', nestedId)
            : undefined;
    const creditsEarned =
        typeof nestedSubject.creditsEarned === 'number'
            ? asMapped(nestedSubject.creditsEarned, 'credentialSubject.creditsEarned', 'credentialSubject.creditsEarned', nestedId)
            : undefined;
    const term =
        typeof nestedSubject.term === 'string'
            ? asMapped(nestedSubject.term, 'credentialSubject.term', 'credentialSubject.term', nestedId)
            : undefined;

    // earnedAt and validUntil come from the nested VC envelope, not the achievement.
    const earnedAt =
        typeof nestedCredential.validFrom === 'string'
            ? asMapped(nestedCredential.validFrom, 'validFrom', 'credential.validFrom', nestedId)
            : undefined;
    const validUntil =
        typeof nestedCredential.validUntil === 'string'
            ? asMapped(nestedCredential.validUntil, 'validUntil', 'credential.validUntil', nestedId)
            : undefined;

    if (achievementType === 'Course') {
        return {
            course: {
                name: achievementName,
                humanCode,
                fieldOfStudy,
                creditsAvailable,
                creditsEarned,
                term,
                description: achievementDescription,
                earnedAt,
                validUntil,
                achievementType: asMapped('Course', 'achievement.achievementType', 'achievement.achievementType', nestedId),
                sourceCredentialId: nestedId,
                results,
            },
            gpa: hasGpaResult?.value,
            evidence,
        };
    }

    if (achievementType === 'Competency') {
        return {
            competency: {
                name: achievementName,
                description: achievementDescription,
                earnedAt,
                achievementType: asMapped(
                    'Competency',
                    'achievement.achievementType',
                    'achievement.achievementType',
                    nestedId
                ),
                sourceCredentialId: nestedId,
                results,
            },
            gpa: hasGpaResult?.value,
            evidence,
        };
    }

    if (achievementType && PROGRAM_TYPES.has(achievementType)) {
        return {
            program: {
                name: achievementName,
                description: achievementDescription,
                earnedAt,
                validUntil,
                achievementType: asMapped(
                    achievementType,
                    'achievement.achievementType',
                    'achievement.achievementType',
                    nestedId
                ),
                sourceCredentialId: nestedId,
                results,
            },
            gpa: hasGpaResult?.value,
            evidence,
        };
    }

    const explicitAssessment =
        achievementType === 'Assessment' || achievement.fieldOfStudy === 'Assessment';

    if (explicitAssessment) {
        return {
            assessment: {
                name: achievementName,
                description: achievementDescription,
                earnedAt,
                sourceCredentialId: nestedId,
                results,
            },
            gpa: hasGpaResult?.value,
            evidence,
        };
    }

    warnings.push({
        code: 'AMBIGUOUS_RECORD',
        message: 'Record could not be strictly classified from CLR/OB fields.',
        severity: 'info',
        sourceCredentialId: nestedId,
        sourcePath: 'credentialSubject.achievement.achievementType',
    });

    return {
        other: {
            name: achievementName,
            description: achievementDescription,
            earnedAt,
            sourceCredentialId: nestedId,
            reason: achievementType ? 'unsupportedAchievementType' : 'missingAchievement',
        },
        gpa: hasGpaResult?.value,
        evidence,
    };
};

export const normalizeClrTranscriptDisplayModel = (
    rawCredential: Record<string, unknown>
): ClrTranscriptDisplayModel => {
    // Normalization is the single source of truth for render decisions across all surfaces/views.
    const warnings: DisplayWarning[] = [];

    const credentialSubject = (rawCredential.credentialSubject ?? {}) as Record<string, unknown>;
    const nestedCredentials = asArray<Record<string, unknown>>(
        credentialSubject.verifiableCredential as Record<string, unknown>[]
    );

    const credentialId = typeof rawCredential.id === 'string' ? rawCredential.id : 'unknown-credential-id';
    const issuer = (rawCredential.issuer ?? {}) as Record<string, unknown>;
    const subjectId = typeof credentialSubject.id === 'string' ? credentialSubject.id : undefined;
    const learnerIdentifiers = asArray<Record<string, unknown>>(
        credentialSubject.identifier as Array<Record<string, unknown>>
    );

    const courses: CourseDisplayModel[] = [];
    const programs: ProgramDisplayModel[] = [];
    const competencies: CompetencyDisplayModel[] = [];
    const assessments: AssessmentDisplayModel[] = [];
    const otherRecords: OtherAcademicRecordModel[] = [];
    const evidence: EvidenceDisplayModel[] = [];

    let explicitGpa: SourceMappedField<string | number | boolean> | undefined;

    // Build id → display name map for association resolution.
    const credentialNameById = new Map<string, string>();
    for (const nc of nestedCredentials) {
        const ncId = typeof nc.id === 'string' ? nc.id : undefined;
        if (!ncId) continue;
        const ncSubject = (nc.credentialSubject ?? {}) as Record<string, unknown>;
        const ncAchievement = (ncSubject.achievement ?? {}) as Record<string, unknown>;
        const name =
            (typeof nc.name === 'string' ? nc.name : undefined) ??
            (typeof ncAchievement.name === 'string' ? ncAchievement.name : undefined) ??
            ncId;
        credentialNameById.set(ncId, name);
    }

    for (const nestedCredential of nestedCredentials) {
        const normalized = classifyRecord(nestedCredential, warnings);
        if (normalized.course) courses.push(normalized.course);
        if (normalized.program) programs.push(normalized.program);
        if (normalized.competency) competencies.push(normalized.competency);
        if (normalized.assessment) assessments.push(normalized.assessment);
        if (normalized.other) otherRecords.push(normalized.other);
        if (!explicitGpa && normalized.gpa) explicitGpa = normalized.gpa;
        evidence.push(...normalized.evidence);
    }

    const associations: AssociationDisplayModel[] = asArray<Record<string, unknown>>(
        credentialSubject.association as Record<string, unknown>[]
    ).flatMap(assoc => {
        const associationType = typeof assoc.associationType === 'string' ? assoc.associationType : undefined;
        const targetId = typeof assoc.targetId === 'string' ? assoc.targetId : undefined;
        if (!associationType || !targetId) return [];
        const sourceId = typeof assoc.sourceId === 'string' ? assoc.sourceId : '';
        return [{
            associationType,
            sourceId,
            targetId,
            sourceName: credentialNameById.get(sourceId),
            targetName: credentialNameById.get(targetId),
        }];
    });

    const partial = rawCredential.partial === true;
    if (partial) {
        warnings.push({
            code: 'PARTIAL_CLR',
            message: 'This CLR is explicitly marked partial and may not contain all known assertions.',
            severity: 'warning',
            sourcePath: 'partial',
        });
    }

    if (learnerIdentifiers.length === 0) {
        warnings.push({
            code: 'MISSING_LEARNER_IDENTIFIER',
            message: 'No learner identifier present.',
            severity: 'warning',
            sourcePath: 'credentialSubject.identifier',
        });
    }

    if (courses.length === 0) {
        warnings.push({
            code: 'MISSING_COURSES',
            message: 'No explicitly typed course records found.',
            severity: 'info',
            sourcePath: 'credentialSubject.verifiableCredential[].credentialSubject.achievement.achievementType',
        });
    }

    if (!explicitGpa) {
        warnings.push({
            code: 'MISSING_GPA',
            message: 'No explicit GPA result was found via resultDescription.resultType.',
            severity: 'info',
        });
    }

    const parentHasProof = rawCredential.proof !== undefined;
    const nestedSignedCount = nestedCredentials.filter(nc => nc.proof !== undefined).length;
    const nestedUnsignedCount = Math.max(0, nestedCredentials.length - nestedSignedCount);

    if (!parentHasProof) {
        warnings.push({
            code: 'UNSIGNED_CREDENTIAL',
            message: 'Credential is unsigned or proof was not provided.',
            severity: 'warning',
            sourcePath: 'proof',
        });
    }

    if (nestedUnsignedCount > 0) {
        warnings.push({
            code: 'NESTED_UNSIGNED_CREDENTIALS',
            message: 'One or more nested credentials are unsigned or missing proof.',
            severity: 'info',
            sourcePath: 'credentialSubject.verifiableCredential[].proof',
        });
    }

    const credentialStatus = rawCredential.credentialStatus as Record<string, unknown> | undefined;
    const credentialStatusType =
        credentialStatus && typeof credentialStatus.type === 'string'
            ? credentialStatus.type
            : undefined;

    const totalCreditsAvailable = courses.reduce<number | undefined>((sum, course) => {
        if (course.creditsAvailable === undefined) return sum;
        return (sum ?? 0) + course.creditsAvailable.value;
    }, undefined);

    // Quality is based on explicit structured signal, not text heuristics.
    let qualityLevel: ClrTranscriptDisplayModel['quality']['level'] = 'poor';
    if (courses.length > 0) {
        qualityLevel = 'rich';
    } else if (programs.length > 0) {
        qualityLevel = 'usable';
    } else if (evidence.length > 0 || assessments.length > 0 || otherRecords.length > 0) {
        qualityLevel = 'sparse';
    }

    return {
        meta: {
            partial,
            credentialStatusType,
        },
        header: {
            id: asMapped(credentialId, 'id', 'credential.id', credentialId),
            type: asMapped(
                (rawCredential.type as string[] | string | undefined) ?? 'VerifiableCredential',
                'type',
                'credential.type',
                credentialId
            ),
            title: asMapped(
                (rawCredential.name as string | undefined) ?? 'Academic Record',
                'name',
                'credential.name',
                credentialId
            ),
            description:
                typeof rawCredential.description === 'string'
                    ? asMapped(rawCredential.description, 'description', 'credential.description', credentialId)
                    : undefined,
            image: (() => {
                const img = rawCredential.image as Record<string, unknown> | string | undefined;
                if (typeof img === 'string') return asMapped(img, 'image', 'credential.image', credentialId);
                if (img && typeof img.id === 'string') return asMapped(img.id, 'image.id', 'credential.image.id', credentialId);
                return undefined;
            })(),
            issuerName:
                typeof issuer.name === 'string'
                    ? asMapped(issuer.name, 'issuer.name', 'credential.issuer.name', credentialId)
                    : undefined,
            issuerId:
                typeof issuer.id === 'string'
                    ? asMapped(issuer.id, 'issuer.id', 'credential.issuer.id', credentialId)
                    : undefined,
            issuerAddress: (() => {
                const addr = issuer.address as Record<string, unknown> | undefined;
                if (!addr || typeof addr !== 'object') return undefined;
                const streetAddress = typeof addr.streetAddress === 'string' ? addr.streetAddress : undefined;
                const addressLocality = typeof addr.addressLocality === 'string' ? addr.addressLocality : undefined;
                const addressRegion = typeof addr.addressRegion === 'string' ? addr.addressRegion : undefined;
                const postalCode = typeof addr.postalCode === 'string' ? addr.postalCode : undefined;
                const addressCountry = typeof addr.addressCountry === 'string' ? addr.addressCountry : undefined;
                if (!streetAddress && !addressLocality && !addressRegion && !postalCode && !addressCountry) return undefined;
                return { streetAddress, addressLocality, addressRegion, postalCode, addressCountry, sourcePath: 'issuer.address' };
            })(),
            issuedAt:
                typeof rawCredential.validFrom === 'string'
                    ? asMapped(rawCredential.validFrom, 'validFrom', 'credential.validFrom', credentialId)
                    : undefined,
            awardedDate:
                typeof rawCredential.awardedDate === 'string'
                    ? asMapped(rawCredential.awardedDate, 'awardedDate', 'credential.awardedDate', credentialId)
                    : undefined,
            validUntil:
                typeof rawCredential.validUntil === 'string'
                    ? asMapped(rawCredential.validUntil, 'validUntil', 'credential.validUntil', credentialId)
                    : undefined,
            learnerName: (() => {
                const resolved = getLearnerName(learnerIdentifiers, subjectId);
                if (!resolved) return undefined;
                const isSubjectIdFallback = resolved === subjectId && learnerIdentifiers.length === 0;
                return asMapped(
                    resolved,
                    isSubjectIdFallback ? 'credentialSubject.id' : 'credentialSubject.identifier',
                    isSubjectIdFallback ? 'credentialSubject.id' : 'credentialSubject.identifier',
                    credentialId
                );
            })(),
            learnerIdentifiers: asMapped(
                learnerIdentifiers,
                'credentialSubject.identifier',
                'credentialSubject.identifier',
                credentialId
            ),
        },
        summary: {
            gpa: explicitGpa,
            courseCount: courses.length,
            totalCreditsAvailable,
            explicitCompetencyCount: competencies.length,
            evidenceCount: evidence.length,
        },
        courses,
        programs,
        competencies,
        assessments,
        otherRecords,
        evidence,
        associations,
        warnings,
        quality: {
            level: qualityLevel,
            reasons: [
                `courses=${courses.length}`,
                `programs=${programs.length}`,
                `assessments=${assessments.length}`,
                `evidence=${evidence.length}`,
                ...(partial ? ['partial=true'] : []),
            ],
        },
        verification: {
            credentialSigned: parentHasProof,
            credentialVerified: false,
            nestedCredentialSignedCount: nestedSignedCount,
            nestedCredentialUnsignedCount: nestedUnsignedCount,
            status: parentHasProof ? 'signed-unverified' : 'unsigned',
            hasCredentialStatus: credentialStatus !== undefined,
            credentialStatusType,
        },
    };
};

export const selectClrTranscriptView = (
    model: ClrTranscriptDisplayModel,
    options: ViewOptions
): 'VerifierInspectionView' | 'StructuredTranscriptView' | 'SparseAcademicRecordView' | 'CredentialSummaryView' => {
    // Admin/registrar always get inspection-first routing.
    if (options.viewer === 'admin' || options.viewer === 'registrar') {
        return 'VerifierInspectionView';
    }

    if (model.courses.length > 0) {
        return 'StructuredTranscriptView';
    }

    if (model.programs.length > 0) {
        return 'SparseAcademicRecordView';
    }

    if (model.evidence.length > 0 || model.assessments.length > 0 || model.otherRecords.length > 0) {
        return 'SparseAcademicRecordView';
    }

    return 'CredentialSummaryView';
};
