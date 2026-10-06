export type ClrJsonObject = Readonly<Record<string, unknown>>;

export type ClrSourceKind = 'collectionCredential' | 'embeddedCredential' | 'topLevelAchievement';

export type ClrSourceReference = {
    kind: ClrSourceKind;
    path: string;
    credential?: ClrJsonObject;
    subject?: ClrJsonObject;
    achievement?: ClrJsonObject;
};

export type ClrMappedValue<T> = {
    value: T;
    sourcePath: string;
    sourceKind: ClrSourceKind;
};

export type ClrNormalizationWarningCode =
    | 'AMBIGUOUS_ASSOCIATION_ENDPOINT'
    | 'CONFLICTING_ACHIEVEMENT_DEFINITION'
    | 'DUPLICATE_CREDENTIAL_ID'
    | 'MISSING_ACHIEVEMENT'
    | 'UNRESOLVED_ASSOCIATION_ENDPOINT'
    | 'UNRESOLVED_RESULT_DESCRIPTION';

export type ClrNormalizationWarning = {
    code: ClrNormalizationWarningCode;
    message: string;
    sourcePath: string;
    recordId?: string;
};

export type ClrProfileModel = {
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    name?: ClrMappedValue<string>;
    description?: ClrMappedValue<string>;
    url?: ClrMappedValue<string>;
    email?: ClrMappedValue<string>;
    phone?: ClrMappedValue<string>;
    image?: ClrJsonObject | string;
    address?: ClrJsonObject;
    source: ClrJsonObject | string;
    sourcePath: string;
};

export type ClrIdentifierModel = {
    type?: ClrMappedValue<string>;
    identityType?: ClrMappedValue<string>;
    identityHash?: ClrMappedValue<string>;
    hashed?: ClrMappedValue<boolean>;
    salt?: ClrMappedValue<string>;
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrCriteriaModel = {
    id?: ClrMappedValue<string>;
    narrative?: ClrMappedValue<string>;
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrAlignmentScope = 'achievement' | 'resultDescription' | 'result' | 'rubricLevel';

export type ClrAlignmentModel = {
    scope: ClrAlignmentScope;
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    targetName?: ClrMappedValue<string>;
    targetCode?: ClrMappedValue<string>;
    targetFramework?: ClrMappedValue<string>;
    targetType?: ClrMappedValue<string>;
    targetUrl?: ClrMappedValue<string>;
    targetDescription?: ClrMappedValue<string>;
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrRubricLevelModel = {
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    name?: ClrMappedValue<string>;
    level?: ClrMappedValue<string>;
    description?: ClrMappedValue<string>;
    points?: ClrMappedValue<string | number>;
    alignments: ClrAlignmentModel[];
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrResultDescriptionModel = {
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    name?: ClrMappedValue<string>;
    resultType?: ClrMappedValue<string>;
    allowedValue: ClrMappedValue<string>[];
    requiredValue?: ClrMappedValue<string | number | boolean>;
    requiredLevel?: ClrMappedValue<string>;
    valueMin?: ClrMappedValue<string | number>;
    valueMax?: ClrMappedValue<string | number>;
    rubricLevels: ClrRubricLevelModel[];
    alignments: ClrAlignmentModel[];
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrResultModel = {
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    value?: ClrMappedValue<string | number | boolean>;
    status?: ClrMappedValue<string>;
    achievedLevelId?: ClrMappedValue<string>;
    resultDescriptionId?: ClrMappedValue<string>;
    resultDescription?: ClrResultDescriptionModel;
    resultDescriptionResolved: boolean;
    achievedLevel?: ClrRubricLevelModel;
    requiredLevel?: ClrRubricLevelModel;
    alignments: ClrAlignmentModel[];
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrEvidenceModel = {
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    name?: ClrMappedValue<string>;
    description?: ClrMappedValue<string>;
    narrative?: ClrMappedValue<string>;
    genre?: ClrMappedValue<string>;
    audience?: ClrMappedValue<string>;
    isInlineDataUri: boolean;
    isLargeInlineDataUri: boolean;
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrRecordDatesModel = {
    activityStart?: ClrMappedValue<string>;
    activityEnd?: ClrMappedValue<string>;
    awarded?: ClrMappedValue<string>;
    validFrom?: ClrMappedValue<string>;
    validUntil?: ClrMappedValue<string>;
};

export type ClrRecordOrigin = ClrSourceReference & {
    definitionOnly: boolean;
};

export type ClrPresentationHint =
    | 'activity'
    | 'assessment'
    | 'award'
    | 'competency'
    | 'course'
    | 'membership'
    | 'program'
    | 'qualification'
    | 'generic';

export type ClrNormalizedRecord = {
    id: string;
    aliases: string[];
    origins: ClrRecordOrigin[];
    sourceCredential?: ClrJsonObject;
    sourceSubject?: ClrJsonObject;
    sourceAchievement?: ClrJsonObject;
    credentialId?: ClrMappedValue<string>;
    credentialTypes: ClrMappedValue<string>[];
    credentialName?: ClrMappedValue<string>;
    credentialDescription?: ClrMappedValue<string>;
    achievementId?: ClrMappedValue<string>;
    achievementTypes: ClrMappedValue<string>[];
    name?: ClrMappedValue<string>;
    description?: ClrMappedValue<string>;
    humanCode?: ClrMappedValue<string>;
    fieldOfStudy?: ClrMappedValue<string>;
    specialization?: ClrMappedValue<string>;
    language?: ClrMappedValue<string>;
    version?: ClrMappedValue<string>;
    tags: ClrMappedValue<string>[];
    creditsAvailable?: ClrMappedValue<number>;
    creditsEarned?: ClrMappedValue<number>;
    term?: ClrMappedValue<string>;
    subjectId?: ClrMappedValue<string>;
    subjectIdentifiers: ClrIdentifierModel[];
    achievementIdentifiers: ClrIdentifierModel[];
    criteria?: ClrCriteriaModel;
    provenance: {
        issuer?: ClrProfileModel;
        assessor?: ClrProfileModel;
        creator?: ClrProfileModel;
    };
    dates: ClrRecordDatesModel;
    role?: ClrMappedValue<string>;
    narrative?: ClrMappedValue<string>;
    licenseNumber?: ClrMappedValue<string>;
    resultDescriptions: ClrResultDescriptionModel[];
    results: ClrResultModel[];
    evidence: ClrEvidenceModel[];
    alignments: ClrAlignmentModel[];
    presentationHints: ClrPresentationHint[];
};

export type ClrAssociationResolution = 'resolved' | 'ambiguous' | 'unresolved' | 'missing';

export type ClrAssociationModel = {
    types: ClrMappedValue<string>[];
    associationType?: ClrMappedValue<string>;
    sourceId?: ClrMappedValue<string>;
    targetId?: ClrMappedValue<string>;
    sourceRecordId?: string;
    targetRecordId?: string;
    sourceResolution: ClrAssociationResolution;
    targetResolution: ClrAssociationResolution;
    source: ClrJsonObject;
    sourcePath: string;
};

export type ClrCollectionModel = {
    sourceCredential: ClrJsonObject;
    id?: ClrMappedValue<string>;
    types: ClrMappedValue<string>[];
    name?: ClrMappedValue<string>;
    description?: ClrMappedValue<string>;
    publisher?: ClrProfileModel;
    subjectId?: ClrMappedValue<string>;
    subjectIdentifiers: ClrIdentifierModel[];
    validFrom?: ClrMappedValue<string>;
    awarded?: ClrMappedValue<string>;
    validUntil?: ClrMappedValue<string>;
    partial: boolean;
    evidence: ClrEvidenceModel[];
};

export type ClrNormalizedModel = {
    collection: ClrCollectionModel;
    records: ClrNormalizedRecord[];
    associations: ClrAssociationModel[];
    warnings: ClrNormalizationWarning[];
};
