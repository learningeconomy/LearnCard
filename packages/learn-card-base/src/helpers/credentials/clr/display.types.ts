import type {
    ClrNormalizedModel,
    ClrNormalizedRecord,
    ClrNormalizationWarningCode,
    ClrMappedValue,
} from './types';

/** A directly mapped CLR/OB value with provenance metadata for traceable rendering. */
export type SourceMappedField<T> = Pick<ClrMappedValue<T>, 'value' | 'sourcePath'> &
    Partial<Pick<ClrMappedValue<T>, 'sourceKind'>> & {
        specField: string;
        sourceCredentialId?: string;
        directlyMapped: boolean;
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
    | 'PARTIAL_CLR'
    | ClrNormalizationWarningCode;

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

/** One level of a rubric criterion (`ResultDescription.rubricCriterionLevel[]`). */
export type RubricLevelDisplayModel = {
    id?: string;
    name: string;
    level?: string;
    description?: string;
    points?: string;
};

/** Normalized result value and optional resolved semantics from ResultDescription. */
export type ResultDisplayModel = {
    value?: SourceMappedField<string | number | boolean>;
    achievedLevelId?: SourceMappedField<string>;
    resultType?: SourceMappedField<string>;
    label?: SourceMappedField<string>;
    resultDescriptionId?: SourceMappedField<string>;
    valueMax?: SourceMappedField<string>;
    valueMin?: SourceMappedField<string>;
    allowedValue?: SourceMappedField<string[]>;
    requiredValue?: SourceMappedField<string>;
    requiredLevel?: SourceMappedField<string>;
    /** Independent status claim; never substituted into the source result value. */
    status?: SourceMappedField<string>;
    /** Ordered rubric levels declared on the result description, if it is rubric-based. */
    rubricLevels?: RubricLevelDisplayModel[];
    /** The rubric level the learner achieved, resolved from `Result.achievedLevel` or `Result.value`. */
    achievedLevel?: RubricLevelDisplayModel;
    /** The minimum passing rubric level, resolved from `ResultDescription.requiredLevel`. */
    requiredRubricLevel?: RubricLevelDisplayModel;
    /** Alignments declared by either the Result or its resolved ResultDescription. */
    alignments: AlignmentDisplayModel[];
    /** False only when an explicit Result.resultDescription reference could not be resolved. */
    resultDescriptionResolved: boolean;
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

/**
 * A directly-mapped CLR/OB Alignment: the spec's primary mechanism for tying an
 * achievement (course, degree, competency) to an external competency framework node.
 */
export type AlignmentDisplayModel = {
    targetName?: SourceMappedField<string>;
    targetCode?: SourceMappedField<string>;
    targetFramework?: SourceMappedField<string>;
    targetType?: SourceMappedField<string[] | string>;
    targetUrl?: SourceMappedField<string>;
    targetDescription?: SourceMappedField<string>;
    sourceCredentialId: string;
};

/** Strictly classified course record (`achievementType: Course`). */
export type CourseDisplayModel = {
    name?: SourceMappedField<string>;
    humanCode?: SourceMappedField<string>;
    fieldOfStudy?: SourceMappedField<string>;
    creditsAvailable?: SourceMappedField<number>;
    creditsEarned?: SourceMappedField<number>;
    creditsFromDescription?: SourceMappedField<number>;
    term?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    validUntil?: SourceMappedField<string>;
    achievementType: SourceMappedField<'Course'>;
    sourceCredentialId: string;
    achievementId?: string;
    results: ResultDisplayModel[];
    /** Framework competency links declared on this achievement via `achievement.alignment`. */
    alignments: AlignmentDisplayModel[];
    /** Evidence/attachments scoped to this specific course credential. */
    evidence: EvidenceDisplayModel[];
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
    achievementId?: string;
    /** Framework competency links declared on this achievement via `achievement.alignment`. */
    alignments: AlignmentDisplayModel[];
    /** Evidence/attachments scoped to this specific program/degree credential. */
    evidence: EvidenceDisplayModel[];
};

/** Strictly classified competency record (`achievementType: Competency`). */
export type CompetencyDisplayModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    achievementType: SourceMappedField<'Competency'>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
    achievementId?: string;
    /** Framework competency links declared on this achievement via `achievement.alignment`. */
    alignments: AlignmentDisplayModel[];
    /** Evidence/attachments scoped to this specific competency credential. */
    evidence: EvidenceDisplayModel[];
};

/** Explicitly classified assessment record (assessment-specific signal required). */
export type AssessmentDisplayModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    achievementType: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
    achievementId?: string;
    /** Framework competency links declared on this achievement via `achievement.alignment`. */
    alignments: AlignmentDisplayModel[];
    /** Evidence/attachments scoped to this assessment credential. */
    evidence: EvidenceDisplayModel[];
    /** True when at least one result is rubric-based (`resultType: RubricCriterionLevel`). */
    isRubric: boolean;
};

/** Award record (achievementType: Award, Certificate, License, etc.). */
export type AwardDisplayModel = {
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    achievementType: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    validUntil?: SourceMappedField<string>;
    sourceCredentialId: string;
    results: ResultDisplayModel[];
    achievementId?: string;
    /** Framework competency links declared on this achievement via `achievement.alignment`. */
    alignments: AlignmentDisplayModel[];
    /** Evidence/attachments scoped to this award credential. */
    evidence: EvidenceDisplayModel[];
    /** Criteria narrative describing how the award was earned. */
    criteria?: SourceMappedField<string>;
};

/** Catch-all for transcript-adjacent records that do not meet strict transcript classifications. */
export type OtherAcademicRecordModel = {
    results: ResultDisplayModel[];
    alignments: AlignmentDisplayModel[];
    evidence: EvidenceDisplayModel[];
    name?: SourceMappedField<string>;
    description?: SourceMappedField<string>;
    earnedAt?: SourceMappedField<string>;
    sourceCredentialId: string;
    achievementId?: string;
    reason:
        'unsupportedAchievementType' | 'ambiguous' | 'missingAchievement' | 'notTranscriptSpecific';
};

/** A single resolved association between two records in this CLR. */
export type AssociationDisplayModel = {
    associationType: string;
    sourceId: string;
    targetId: string;
    /** Canonical nested credential IDs after resolving credential and Achievement ID aliases. */
    sourceRecordId?: string;
    targetRecordId?: string;
    sourceResolution?: import('./types').ClrAssociationResolution;
    targetResolution?: import('./types').ClrAssociationResolution;
    sourceName?: string;
    targetName?: string;
    source: SourceMappedField<string>;
};

export type RelationshipKind =
    | 'parent'
    | 'child'
    | 'prerequisite'
    | 'unlock'
    | 'peer'
    | 'equivalent'
    | 'supersededBy'
    | 'replacement'
    | 'related';

/** A directional, human-readable relationship from one record to another. */
export type RelationshipDisplayModel = {
    kind: RelationshipKind;
    recordId: string;
    relatedRecordId: string;
    relatedRecordName: string;
    label: string;
    navigable: boolean;
    source: SourceMappedField<string>;
};

export type RelationshipGraph = Record<string, RelationshipDisplayModel[]>;

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
    /** Source-preserving CLR normalization shared with other LearnCard surfaces. */
    canonical: ClrNormalizedModel;
    /** Convenience alias for canonical.records during the legacy view migration. */
    records: ClrNormalizedRecord[];
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
        issuerImage?: SourceMappedField<string>;
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
        assessmentCount: number;
        awardCount: number;
        totalCreditsAvailable?: number;
        explicitCompetencyCount: number;
        evidenceCount: number;
    };
    courses: CourseDisplayModel[];
    programs: ProgramDisplayModel[];
    competencies: CompetencyDisplayModel[];
    assessments: AssessmentDisplayModel[];
    awards: AwardDisplayModel[];
    otherRecords: OtherAcademicRecordModel[];
    evidence: EvidenceDisplayModel[];
    associations: AssociationDisplayModel[];
    relationships: RelationshipGraph;
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

export type TermGroup = { label: string; courses: CourseDisplayModel[] };
export type AssessmentSummary = {
    headline: string;
    detail: string;
    progress?: { levels: RubricLevelDisplayModel[]; achieved?: RubricLevelDisplayModel };
};

export type ClrNavigableRecord =
    | { kind: 'course'; record: CourseDisplayModel }
    | { kind: 'program'; record: ProgramDisplayModel }
    | { kind: 'assessment'; record: AssessmentDisplayModel }
    | { kind: 'competency'; record: CompetencyDisplayModel };

export type ClrRecordNavigator = {
    selectRecord: (recordId: string) => void;
    openRecord: (selected: ClrNavigableRecord) => void;
};

export type InferredClrKind = 'transcript' | 'course' | 'degree' | 'unknown';

export type ClrTranscriptIssuerInfo = {
    issuerName?: string;
    logoSrc?: string;
};
