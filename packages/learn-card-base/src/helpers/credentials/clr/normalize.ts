import type {
    ClrAlignmentModel,
    ClrAlignmentScope,
    ClrAssociationModel,
    ClrAssociationResolution,
    ClrCriteriaModel,
    ClrEvidenceModel,
    ClrIdentifierModel,
    ClrJsonObject,
    ClrMappedValue,
    ClrNormalizationWarning,
    ClrNormalizedModel,
    ClrNormalizedRecord,
    ClrPresentationHint,
    ClrProfileModel,
    ClrResultDescriptionModel,
    ClrResultModel,
    ClrRubricLevelModel,
    ClrSourceKind,
} from './types';
import { getSingleClrSubject, getClrSubjectPath, isStandaloneCourseCredential } from './selectors';

const LARGE_INLINE_EVIDENCE_THRESHOLD = 100_000;

type DefinitionSource = {
    achievement: ClrJsonObject;
    path: string;
    kind: 'embeddedCredential' | 'topLevelAchievement';
};

const isObject = (value: unknown): value is ClrJsonObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const asObjects = (value: unknown): ClrJsonObject[] =>
    Array.isArray(value) ? value.filter(isObject) : isObject(value) ? [value] : [];

const asStrings = (value: unknown): string[] =>
    Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === 'string')
        : typeof value === 'string'
          ? [value]
          : [];

const propertyPath = (sourcePath: string, key: string): string =>
    sourcePath ? `${sourcePath}.${key}` : key;

const itemPath = (value: unknown, path: string, index: number): string =>
    Array.isArray(value) ? `${path}[${index}]` : path;

const sourceValue = <T>(
    value: T | undefined,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrMappedValue<T> | undefined =>
    value === undefined ? undefined : { value, sourcePath, sourceKind };

const stringValue = (
    source: ClrJsonObject,
    key: string,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrMappedValue<string> | undefined =>
    typeof source[key] === 'string'
        ? sourceValue(source[key] as string, propertyPath(sourcePath, key), sourceKind)
        : undefined;

const primitiveValue = (
    source: ClrJsonObject,
    key: string,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrMappedValue<string | number | boolean> | undefined => {
    const value = source[key];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? sourceValue(value, propertyPath(sourcePath, key), sourceKind)
        : undefined;
};

const stringValues = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrMappedValue<string>[] =>
    asStrings(value).map((entry, index) => ({
        value: entry,
        sourcePath: Array.isArray(value) ? `${sourcePath}[${index}]` : sourcePath,
        sourceKind,
    }));

const stableJson = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
    if (isObject(value)) {
        return `{${Object.keys(value)
            .sort()
            .map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
};

const mapProfile = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrProfileModel | undefined => {
    if (typeof value === 'string') {
        return {
            id: sourceValue(value, sourcePath, sourceKind),
            types: [],
            source: value,
            sourcePath,
        };
    }
    if (!isObject(value)) return undefined;

    return {
        id: stringValue(value, 'id', sourcePath, sourceKind),
        types: stringValues(value.type, `${sourcePath}.type`, sourceKind),
        name: stringValue(value, 'name', sourcePath, sourceKind),
        description: stringValue(value, 'description', sourcePath, sourceKind),
        url: stringValue(value, 'url', sourcePath, sourceKind),
        email: stringValue(value, 'email', sourcePath, sourceKind),
        phone: stringValue(value, 'phone', sourcePath, sourceKind),
        image: typeof value.image === 'string' || isObject(value.image) ? value.image : undefined,
        address: isObject(value.address) ? value.address : undefined,
        source: value,
        sourcePath,
    };
};

const mapIdentifiers = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrIdentifierModel[] =>
    asObjects(value).map((identifier, index) => {
        const path = itemPath(value, sourcePath, index);
        return {
            type: stringValue(identifier, 'type', path, sourceKind),
            identityType: stringValue(identifier, 'identityType', path, sourceKind),
            identityHash: stringValue(identifier, 'identityHash', path, sourceKind),
            identifierType: stringValue(identifier, 'identifierType', path, sourceKind),
            identifier: stringValue(identifier, 'identifier', path, sourceKind),
            hashed:
                typeof identifier.hashed === 'boolean'
                    ? sourceValue(identifier.hashed, `${path}.hashed`, sourceKind)
                    : undefined,
            salt: stringValue(identifier, 'salt', path, sourceKind),
            source: identifier,
            sourcePath: path,
        };
    });

const mapCriteria = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrCriteriaModel | undefined => {
    if (!isObject(value)) return undefined;
    return {
        id: stringValue(value, 'id', sourcePath, sourceKind),
        narrative: stringValue(value, 'narrative', sourcePath, sourceKind),
        source: value,
        sourcePath,
    };
};

const mapAlignment = (
    alignment: ClrJsonObject,
    sourcePath: string,
    sourceKind: ClrSourceKind,
    scope: ClrAlignmentScope
): ClrAlignmentModel => ({
    scope,
    id: stringValue(alignment, 'id', sourcePath, sourceKind),
    types: stringValues(alignment.type, `${sourcePath}.type`, sourceKind),
    targetName: stringValue(alignment, 'targetName', sourcePath, sourceKind),
    targetCode: stringValue(alignment, 'targetCode', sourcePath, sourceKind),
    targetFramework: stringValue(alignment, 'targetFramework', sourcePath, sourceKind),
    targetType: stringValue(alignment, 'targetType', sourcePath, sourceKind),
    targetUrl: stringValue(alignment, 'targetUrl', sourcePath, sourceKind),
    targetDescription: stringValue(alignment, 'targetDescription', sourcePath, sourceKind),
    source: alignment,
    sourcePath,
});

const mapAlignments = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind,
    scope: ClrAlignmentScope
): ClrAlignmentModel[] =>
    asObjects(value).map((alignment, index) =>
        mapAlignment(alignment, itemPath(value, sourcePath, index), sourceKind, scope)
    );

const mapRubricLevels = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrRubricLevelModel[] =>
    asObjects(value).map((level, index) => {
        const path = itemPath(value, sourcePath, index);
        const points = level.points;
        return {
            id: stringValue(level, 'id', path, sourceKind),
            types: stringValues(level.type, `${path}.type`, sourceKind),
            name: stringValue(level, 'name', path, sourceKind),
            level: stringValue(level, 'level', path, sourceKind),
            description: stringValue(level, 'description', path, sourceKind),
            points:
                typeof points === 'string' || typeof points === 'number'
                    ? sourceValue(points, `${path}.points`, sourceKind)
                    : undefined,
            alignments: mapAlignments(
                level.alignment,
                `${path}.alignment`,
                sourceKind,
                'rubricLevel'
            ),
            source: level,
            sourcePath: path,
        };
    });

const mapResultDescription = (
    description: ClrJsonObject,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrResultDescriptionModel => ({
    id: stringValue(description, 'id', sourcePath, sourceKind),
    types: stringValues(description.type, `${sourcePath}.type`, sourceKind),
    name: stringValue(description, 'name', sourcePath, sourceKind),
    resultType: stringValue(description, 'resultType', sourcePath, sourceKind),
    allowedValue: stringValues(description.allowedValue, `${sourcePath}.allowedValue`, sourceKind),
    requiredValue: primitiveValue(description, 'requiredValue', sourcePath, sourceKind),
    requiredLevel: stringValue(description, 'requiredLevel', sourcePath, sourceKind),
    valueMin: primitiveValue(description, 'valueMin', sourcePath, sourceKind) as
        ClrMappedValue<string | number> | undefined,
    valueMax: primitiveValue(description, 'valueMax', sourcePath, sourceKind) as
        ClrMappedValue<string | number> | undefined,
    rubricLevels: mapRubricLevels(
        description.rubricCriterionLevel,
        `${sourcePath}.rubricCriterionLevel`,
        sourceKind
    ),
    alignments: mapAlignments(
        description.alignment,
        `${sourcePath}.alignment`,
        sourceKind,
        'resultDescription'
    ),
    source: description,
    sourcePath,
});

const mapEvidence = (
    value: unknown,
    sourcePath: string,
    sourceKind: ClrSourceKind
): ClrEvidenceModel[] =>
    asObjects(value).map((evidence, index) => {
        const path = itemPath(value, sourcePath, index);
        const id = stringValue(evidence, 'id', path, sourceKind);
        const isInlineDataUri = id?.value.startsWith('data:') ?? false;
        return {
            id,
            types: stringValues(evidence.type, `${path}.type`, sourceKind),
            name: stringValue(evidence, 'name', path, sourceKind),
            description: stringValue(evidence, 'description', path, sourceKind),
            narrative: stringValue(evidence, 'narrative', path, sourceKind),
            genre: stringValue(evidence, 'genre', path, sourceKind),
            audience: stringValue(evidence, 'audience', path, sourceKind),
            isInlineDataUri,
            isLargeInlineDataUri:
                isInlineDataUri && (id?.value.length ?? 0) > LARGE_INLINE_EVIDENCE_THRESHOLD,
            source: evidence,
            sourcePath: path,
        };
    });

const definitionScalar = <T>(
    definitions: DefinitionSource[],
    key: string,
    isValue: (value: unknown) => value is T,
    recordId: string,
    warnings: ClrNormalizationWarning[]
): ClrMappedValue<T> | undefined => {
    const candidates = definitions.flatMap(definition => {
        const value = definition.achievement[key];
        return isValue(value)
            ? [
                  {
                      value,
                      sourcePath: `${definition.path}.${key}`,
                      sourceKind: definition.kind,
                  } satisfies ClrMappedValue<T>,
              ]
            : [];
    });
    const selected = candidates[0];
    if (!selected) return undefined;

    if (candidates.some(candidate => stableJson(candidate.value) !== stableJson(selected.value))) {
        warnings.push({
            code: 'CONFLICTING_ACHIEVEMENT_DEFINITION',
            message: `Achievement definitions disagree on ${key}; ${selected.sourceKind === 'embeddedCredential' ? 'the assertion-local value' : 'the first supplied top-level value'} wins.`,
            sourcePath: selected.sourcePath,
            recordId,
        });
    }

    return selected;
};

const definitionStrings = (
    definitions: DefinitionSource[],
    key: string
): ClrMappedValue<string>[] => {
    const seen = new Set<string>();
    return definitions.flatMap(definition =>
        stringValues(
            definition.achievement[key],
            `${definition.path}.${key}`,
            definition.kind
        ).filter(value => {
            if (seen.has(value.value)) return false;
            seen.add(value.value);
            return true;
        })
    );
};

const mapDefinitionItems = <T>(
    definitions: DefinitionSource[],
    key: string,
    mapper: (item: ClrJsonObject, sourcePath: string, sourceKind: DefinitionSource['kind']) => T,
    warnings: ClrNormalizationWarning[],
    recordId: string
): T[] => {
    const seen = new Map<string, string>();
    return definitions.flatMap(definition =>
        asObjects(definition.achievement[key]).flatMap((item, index) => {
            const path = itemPath(definition.achievement[key], `${definition.path}.${key}`, index);
            const identity =
                typeof item.id === 'string' ? `id:${item.id}` : `value:${stableJson(item)}`;
            const serialized = stableJson(item);
            const previous = seen.get(identity);
            if (previous === serialized) return [];
            if (previous !== undefined) {
                warnings.push({
                    code: 'CONFLICTING_ACHIEVEMENT_DEFINITION',
                    message: `Achievement definitions contain conflicting ${key} entries for ${identity}.`,
                    sourcePath: path,
                    recordId,
                });
            }
            seen.set(identity, serialized);
            return [mapper(item, path, definition.kind)];
        })
    );
};

const mapResults = (
    value: unknown,
    sourcePath: string,
    descriptions: ClrResultDescriptionModel[],
    recordId: string,
    warnings: ClrNormalizationWarning[]
): ClrResultModel[] => {
    const descriptionsById = new Map<string, ClrResultDescriptionModel[]>();
    descriptions.forEach(description => {
        const id = description.id?.value;
        if (!id) return;
        descriptionsById.set(id, [...(descriptionsById.get(id) ?? []), description]);
    });

    return asObjects(value).map((result, index) => {
        const path = itemPath(value, sourcePath, index);
        const resultDescriptionId = stringValue(
            result,
            'resultDescription',
            path,
            'embeddedCredential'
        );
        const matches = resultDescriptionId
            ? (descriptionsById.get(resultDescriptionId.value) ?? [])
            : [];
        const resultDescription = matches.length === 1 ? matches[0] : undefined;
        const resolved = resultDescriptionId === undefined || matches.length === 1;

        if (resultDescriptionId && matches.length !== 1) {
            warnings.push({
                code: 'UNRESOLVED_RESULT_DESCRIPTION',
                message:
                    matches.length === 0
                        ? `Result description ${resultDescriptionId.value} could not be resolved.`
                        : `Result description ${resultDescriptionId.value} is ambiguous.`,
                sourcePath: resultDescriptionId.sourcePath,
                recordId,
            });
        }

        const valueField = primitiveValue(result, 'value', path, 'embeddedCredential');
        const achievedLevelId = stringValue(result, 'achievedLevel', path, 'embeddedCredential');
        const rubricLevels = resultDescription?.rubricLevels ?? [];
        const achievedLevel = achievedLevelId
            ? rubricLevels.find(level => level.id?.value === achievedLevelId.value)
            : typeof valueField?.value === 'string'
              ? rubricLevels.find(
                    level =>
                        level.name?.value === valueField.value ||
                        level.level?.value === valueField.value
                )
              : undefined;
        const requiredLevelId = resultDescription?.requiredLevel?.value;
        const requiredLevel = requiredLevelId
            ? rubricLevels.find(
                  level =>
                      level.id?.value === requiredLevelId ||
                      level.name?.value === requiredLevelId ||
                      level.level?.value === requiredLevelId
              )
            : undefined;

        return {
            id: stringValue(result, 'id', path, 'embeddedCredential'),
            types: stringValues(result.type, `${path}.type`, 'embeddedCredential'),
            value: valueField,
            status: stringValue(result, 'status', path, 'embeddedCredential'),
            achievedLevelId,
            resultDescriptionId,
            resultDescription,
            resultDescriptionResolved: resolved,
            achievedLevel,
            requiredLevel,
            alignments: [
                ...(resultDescription?.alignments ?? []),
                ...mapAlignments(
                    result.alignment,
                    `${path}.alignment`,
                    'embeddedCredential',
                    'result'
                ),
            ],
            source: result,
            sourcePath: path,
        };
    });
};

const PROGRAM_TYPES = new Set([
    'AssociateDegree',
    'BachelorDegree',
    'Degree',
    'Diploma',
    'DoctoralDegree',
    'GeneralEducationDevelopment',
    'LearningProgram',
    'MasterDegree',
    'ProfessionalDoctorate',
    'ResearchDoctorate',
    'SecondarySchoolDiploma',
]);

const QUALIFICATION_TYPES = new Set([
    'ApprenticeshipCertificate',
    'Certificate',
    'CertificateOfCompletion',
    'Certification',
    'JourneymanCertificate',
    'License',
    'MasterCertificate',
    'MicroCredential',
    'QualityAssuranceCredential',
]);

const presentationHints = (
    achievementTypes: string[],
    subject: ClrJsonObject | undefined
): ClrPresentationHint[] => {
    const hints = new Set<ClrPresentationHint>();
    achievementTypes.forEach(type => {
        if (type === 'Course') hints.add('course');
        else if (type === 'Assessment' || type === 'Assignment') hints.add('assessment');
        else if (type === 'Competency') hints.add('competency');
        else if (type === 'Membership') hints.add('membership');
        else if (type === 'Award' || type === 'Badge') hints.add('award');
        else if (PROGRAM_TYPES.has(type)) hints.add('program');
        else if (QUALIFICATION_TYPES.has(type)) hints.add('qualification');
        else if (type === 'CommunityService' || type === 'CoCurricular' || type === 'Fieldwork') {
            hints.add('activity');
        }
    });
    // Hints are non-exclusive: a course can also supply activity dates or a role.
    // Presentation consumers must prioritize specific types over this broad activity hint.
    if (subject?.activityStartDate || subject?.activityEndDate || subject?.role) {
        hints.add('activity');
    }
    if (hints.size === 0) hints.add('generic');
    return [...hints];
};

type BuildRecordOptions = {
    id: string;
    credential?: ClrJsonObject;
    subject?: ClrJsonObject;
    credentialPath?: string;
    definitions: DefinitionSource[];
    warnings: ClrNormalizationWarning[];
};

const buildRecord = ({
    id,
    credential,
    subject,
    credentialPath,
    definitions,
    warnings,
}: BuildRecordOptions): ClrNormalizedRecord => {
    const primaryDefinition = definitions[0];
    const credentialId =
        credential && credentialPath !== undefined
            ? stringValue(credential, 'id', credentialPath, 'embeddedCredential')
            : undefined;
    const achievementId = definitionScalar(
        definitions,
        'id',
        (value): value is string => typeof value === 'string',
        id,
        warnings
    );
    const achievementTypes = definitionStrings(definitions, 'achievementType');
    const resultDescriptions = mapDefinitionItems(
        definitions,
        'resultDescription',
        mapResultDescription,
        warnings,
        id
    );
    const criteriaSource = definitionScalar(definitions, 'criteria', isObject, id, warnings);
    const definitionAlignments = mapDefinitionItems(
        definitions,
        'alignment',
        (alignment, path, kind) => mapAlignment(alignment, path, kind, 'achievement'),
        warnings,
        id
    );
    const subjectPath =
        credential && credentialPath !== undefined
            ? getClrSubjectPath(credential, credentialPath)
            : undefined;
    const language =
        definitionScalar(
            definitions,
            'inLanguage',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ) ??
        definitionScalar(
            definitions,
            '@language',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        );
    const aliases = [credentialId?.value, achievementId?.value, id].filter(
        (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index
    );

    return {
        id,
        aliases,
        origins: [
            ...(credential && credentialPath !== undefined
                ? [
                      {
                          kind: 'embeddedCredential' as const,
                          path: credentialPath,
                          credential,
                          subject,
                          achievement: primaryDefinition?.achievement,
                          definitionOnly: false,
                      },
                  ]
                : []),
            ...definitions
                .filter(definition => definition.kind === 'topLevelAchievement')
                .map(definition => ({
                    kind: definition.kind,
                    path: definition.path,
                    achievement: definition.achievement,
                    definitionOnly: true,
                })),
        ],
        sourceCredential: credential,
        sourceSubject: subject,
        sourceAchievement: primaryDefinition?.achievement,
        credentialId,
        credentialTypes:
            credential && credentialPath !== undefined
                ? stringValues(
                      credential.type,
                      propertyPath(credentialPath, 'type'),
                      'embeddedCredential'
                  )
                : [],
        credentialName:
            credential && credentialPath !== undefined
                ? stringValue(credential, 'name', credentialPath, 'embeddedCredential')
                : undefined,
        credentialDescription:
            credential && credentialPath !== undefined
                ? stringValue(credential, 'description', credentialPath, 'embeddedCredential')
                : undefined,
        achievementId,
        achievementTypes,
        name: definitionScalar(
            definitions,
            'name',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        description: definitionScalar(
            definitions,
            'description',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        humanCode: definitionScalar(
            definitions,
            'humanCode',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        fieldOfStudy: definitionScalar(
            definitions,
            'fieldOfStudy',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        specialization: definitionScalar(
            definitions,
            'specialization',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        language,
        version: definitionScalar(
            definitions,
            'version',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        tags: definitionStrings(definitions, 'tag'),
        creditsAvailable: definitionScalar(
            definitions,
            'creditsAvailable',
            (value): value is number => typeof value === 'number',
            id,
            warnings
        ),
        creditsEarned:
            subject && subjectPath && typeof subject.creditsEarned === 'number'
                ? sourceValue(
                      subject.creditsEarned,
                      `${subjectPath}.creditsEarned`,
                      'embeddedCredential'
                  )
                : undefined,
        creditsEarnedUnit:
            subject && subjectPath
                ? stringValue(subject, 'creditUnit', subjectPath, 'embeddedCredential')
                : undefined,
        creditsAvailableUnit: definitionScalar(
            definitions,
            'creditUnit',
            (value): value is string => typeof value === 'string',
            id,
            warnings
        ),
        term:
            subject && subjectPath
                ? stringValue(subject, 'term', subjectPath, 'embeddedCredential')
                : undefined,
        subjectId:
            subject && subjectPath
                ? stringValue(subject, 'id', subjectPath, 'embeddedCredential')
                : undefined,
        subjectIdentifiers:
            subject && subjectPath
                ? mapIdentifiers(
                      subject.identifier,
                      `${subjectPath}.identifier`,
                      'embeddedCredential'
                  )
                : [],
        achievementIdentifiers: definitions.flatMap(definition =>
            mapIdentifiers(
                definition.achievement.otherIdentifier,
                `${definition.path}.otherIdentifier`,
                definition.kind
            )
        ),
        criteria: criteriaSource
            ? mapCriteria(
                  criteriaSource.value,
                  criteriaSource.sourcePath,
                  criteriaSource.sourceKind
              )
            : undefined,
        provenance: {
            issuer:
                credential && credentialPath !== undefined
                    ? mapProfile(
                          credential.issuer,
                          propertyPath(credentialPath, 'issuer'),
                          'embeddedCredential'
                      )
                    : undefined,
            assessor:
                subject && subjectPath
                    ? mapProfile(subject.source, `${subjectPath}.source`, 'embeddedCredential')
                    : undefined,
            creator: (() => {
                const creator = definitionScalar(definitions, 'creator', isObject, id, warnings);
                return creator
                    ? mapProfile(creator.value, creator.sourcePath, creator.sourceKind)
                    : undefined;
            })(),
        },
        dates: {
            activityStart:
                subject && subjectPath
                    ? stringValue(subject, 'activityStartDate', subjectPath, 'embeddedCredential')
                    : undefined,
            activityEnd:
                subject && subjectPath
                    ? stringValue(subject, 'activityEndDate', subjectPath, 'embeddedCredential')
                    : undefined,
            awarded:
                credential && credentialPath !== undefined
                    ? stringValue(credential, 'awardedDate', credentialPath, 'embeddedCredential')
                    : undefined,
            validFrom:
                credential && credentialPath !== undefined
                    ? stringValue(credential, 'validFrom', credentialPath, 'embeddedCredential')
                    : undefined,
            validUntil:
                credential && credentialPath !== undefined
                    ? stringValue(credential, 'validUntil', credentialPath, 'embeddedCredential')
                    : undefined,
        },
        role:
            subject && subjectPath
                ? stringValue(subject, 'role', subjectPath, 'embeddedCredential')
                : undefined,
        narrative:
            subject && subjectPath
                ? stringValue(subject, 'narrative', subjectPath, 'embeddedCredential')
                : undefined,
        licenseNumber:
            subject && subjectPath
                ? stringValue(subject, 'licenseNumber', subjectPath, 'embeddedCredential')
                : undefined,
        resultDescriptions,
        results:
            subject && subjectPath
                ? mapResults(
                      subject.result,
                      `${subjectPath}.result`,
                      resultDescriptions,
                      id,
                      warnings
                  )
                : [],
        evidence: [
            ...(credential && credentialPath !== undefined
                ? mapEvidence(
                      credential.evidence,
                      propertyPath(credentialPath, 'evidence'),
                      'embeddedCredential'
                  )
                : []),
            ...(subject && subjectPath
                ? mapEvidence(subject.evidence, `${subjectPath}.evidence`, 'embeddedCredential')
                : []),
        ],
        alignments: definitionAlignments,
        presentationHints: presentationHints(
            achievementTypes.map(type => type.value),
            subject
        ),
    };
};

const addAlias = (aliases: Map<string, Set<string>>, alias: string, recordId: string): void => {
    const recordIds = aliases.get(alias) ?? new Set<string>();
    recordIds.add(recordId);
    aliases.set(alias, recordIds);
};

const resolveAlias = (
    id: string | undefined,
    aliases: Map<string, Set<string>>
): { resolution: ClrAssociationResolution; recordId?: string } => {
    if (!id) return { resolution: 'missing' };
    const matches = aliases.get(id);
    if (!matches || matches.size === 0) return { resolution: 'unresolved' };
    if (matches.size > 1) return { resolution: 'ambiguous' };
    return { resolution: 'resolved', recordId: [...matches][0] };
};

/**
 * Normalizes a CLR without mutating or cloning source credentials. Each embedded
 * credential remains a distinct assertion; matching top-level Achievements only
 * supply scoped definition data.
 */
export const normalizeClrCredential = (
    rawCredential: Readonly<Record<string, unknown>>
): ClrNormalizedModel => {
    const collection = rawCredential as ClrJsonObject;
    const warnings: ClrNormalizationWarning[] = [];
    const subject = getSingleClrSubject(collection) ?? {};
    const subjectPath = getClrSubjectPath(collection);
    const standalone = isStandaloneCourseCredential(collection);
    if (Array.isArray(collection.credentialSubject) && collection.credentialSubject.length > 1) {
        warnings.push({
            code: 'AMBIGUOUS_SUBJECT',
            message: 'Multiple credential subjects cannot be reduced to a single learner.',
            sourcePath: 'credentialSubject',
        });
    }
    const collectionId = typeof collection.id === 'string' ? collection.id : 'clr';
    const embeddedCredentials = standalone ? [collection] : asObjects(subject.verifiableCredential);
    const topLevelAchievements = standalone ? [] : asObjects(subject.achievement);

    const topDefinitionsById = new Map<string, DefinitionSource[]>();
    topLevelAchievements.forEach((achievement, index) => {
        if (typeof achievement.id !== 'string') return;
        const definition: DefinitionSource = {
            achievement,
            path: itemPath(subject.achievement, `${subjectPath}.achievement`, index),
            kind: 'topLevelAchievement',
        };
        topDefinitionsById.set(achievement.id, [
            ...(topDefinitionsById.get(achievement.id) ?? []),
            definition,
        ]);
    });

    const matchedTopLevelIndexes = new Set<number>();
    // Reserve supplied IDs before allocating synthetic IDs, including later records.
    const suppliedIds = new Set(
        [...embeddedCredentials, ...topLevelAchievements]
            .map(item => item.id)
            .filter((id): id is string => typeof id === 'string')
    );
    const usedRecordIds = new Set<string>();
    const allocateSyntheticId = (candidate: string): string => {
        while (usedRecordIds.has(candidate) || suppliedIds.has(candidate))
            candidate += '#duplicate';
        return candidate;
    };
    const credentialIds = new Map<string, number>();

    const records = embeddedCredentials.map((credential, index) => {
        const path = standalone
            ? ''
            : itemPath(subject.verifiableCredential, `${subjectPath}.verifiableCredential`, index);
        const embeddedSubject = getSingleClrSubject(credential);
        const embeddedSubjectPath = getClrSubjectPath(credential, path);
        if (
            Array.isArray(credential.credentialSubject) &&
            credential.credentialSubject.length > 1
        ) {
            warnings.push({
                code: 'AMBIGUOUS_SUBJECT',
                message:
                    'Embedded credential has multiple subjects; no learner claims were selected.',
                sourcePath: embeddedSubjectPath,
            });
        }
        const embeddedAchievement = embeddedSubject
            ? asObjects(embeddedSubject.achievement)[0]
            : undefined;
        const achievementId =
            embeddedAchievement && typeof embeddedAchievement.id === 'string'
                ? embeddedAchievement.id
                : undefined;
        const definitions: DefinitionSource[] = [
            ...(embeddedAchievement
                ? [
                      {
                          achievement: embeddedAchievement,
                          path: `${embeddedSubjectPath}.achievement${Array.isArray(embeddedSubject?.achievement) ? '[0]' : ''}`,
                          kind: 'embeddedCredential' as const,
                      },
                  ]
                : []),
            ...(achievementId ? (topDefinitionsById.get(achievementId) ?? []) : []),
        ];

        if (achievementId) {
            topLevelAchievements.forEach((achievement, topIndex) => {
                if (achievement.id === achievementId) matchedTopLevelIndexes.add(topIndex);
            });
        }

        const rawCredentialId =
            typeof credential.id === 'string'
                ? credential.id
                : allocateSyntheticId(`${collectionId}#embedded-${index}`);
        const occurrences = (credentialIds.get(rawCredentialId) ?? 0) + 1;
        credentialIds.set(rawCredentialId, occurrences);
        const recordId =
            occurrences === 1 && !usedRecordIds.has(rawCredentialId)
                ? rawCredentialId
                : allocateSyntheticId(`${rawCredentialId}#occurrence-${index}`);
        usedRecordIds.add(recordId);

        if (occurrences > 1) {
            warnings.push({
                code: 'DUPLICATE_CREDENTIAL_ID',
                message: `Credential ID ${rawCredentialId} appears more than once; assertions remain distinct.`,
                sourcePath: propertyPath(path, 'id'),
                recordId,
            });
        }
        if (!embeddedAchievement) {
            warnings.push({
                code: 'MISSING_ACHIEVEMENT',
                message: 'Embedded credential does not contain an Achievement definition.',
                sourcePath: `${embeddedSubjectPath}.achievement`,
                recordId,
            });
        }

        return buildRecord({
            id: recordId,
            credential,
            subject: embeddedSubject,
            credentialPath: path,
            definitions,
            warnings,
        });
    });

    topLevelAchievements.forEach((achievement, index) => {
        if (matchedTopLevelIndexes.has(index)) return;
        const path = itemPath(subject.achievement, `${subjectPath}.achievement`, index);
        const rawId =
            typeof achievement.id === 'string'
                ? achievement.id
                : allocateSyntheticId(`${collectionId}#achievement-${index}`);
        const recordId = usedRecordIds.has(rawId)
            ? allocateSyntheticId(`${rawId}#definition-${index}`)
            : rawId;
        usedRecordIds.add(recordId);
        records.push(
            buildRecord({
                id: recordId,
                definitions: [{ achievement, path, kind: 'topLevelAchievement' }],
                warnings,
            })
        );
    });

    const aliases = new Map<string, Set<string>>();
    records.forEach(record => record.aliases.forEach(alias => addAlias(aliases, alias, record.id)));

    const associations: ClrAssociationModel[] = asObjects(subject.association).map(
        (association, index) => {
            const path = itemPath(subject.association, `${subjectPath}.association`, index);
            const sourceId = stringValue(association, 'sourceId', path, 'collectionCredential');
            const targetId = stringValue(association, 'targetId', path, 'collectionCredential');
            const source = resolveAlias(sourceId?.value, aliases);
            const target = resolveAlias(targetId?.value, aliases);

            (
                [
                    ['source', sourceId, source],
                    ['target', targetId, target],
                ] as const
            ).forEach(([side, mappedId, resolution]) => {
                if (!mappedId || resolution.resolution === 'resolved') return;
                warnings.push({
                    code:
                        resolution.resolution === 'ambiguous'
                            ? 'AMBIGUOUS_ASSOCIATION_ENDPOINT'
                            : 'UNRESOLVED_ASSOCIATION_ENDPOINT',
                    message: `Association ${side} ${mappedId.value} is ${resolution.resolution}.`,
                    sourcePath: mappedId.sourcePath,
                });
            });

            return {
                types: stringValues(association.type, `${path}.type`, 'collectionCredential'),
                associationType: stringValue(
                    association,
                    'associationType',
                    path,
                    'collectionCredential'
                ),
                sourceId,
                targetId,
                sourceRecordId: source.recordId,
                targetRecordId: target.recordId,
                sourceResolution: source.resolution,
                targetResolution: target.resolution,
                source: association,
                sourcePath: path,
            };
        }
    );

    return {
        collection: {
            sourceCredential: collection,
            id: stringValue(collection, 'id', '', 'collectionCredential'),
            types: stringValues(collection.type, 'type', 'collectionCredential'),
            name: stringValue(collection, 'name', '', 'collectionCredential'),
            description: stringValue(collection, 'description', '', 'collectionCredential'),
            publisher: mapProfile(collection.issuer, 'issuer', 'collectionCredential'),
            image:
                typeof collection.image === 'string'
                    ? sourceValue(collection.image, 'image', 'collectionCredential')
                    : isObject(collection.image)
                      ? stringValue(collection.image, 'id', 'image', 'collectionCredential')
                      : undefined,
            subjectPath,
            hasProof: collection.proof !== undefined,
            nestedSignedCount: standalone
                ? 0
                : embeddedCredentials.filter(credential => credential.proof !== undefined).length,
            nestedUnsignedCount: standalone
                ? 0
                : embeddedCredentials.filter(credential => credential.proof === undefined).length,
            credentialStatusTypes: asObjects(collection.credentialStatus).flatMap(status =>
                asStrings(status.type)
            ),
            hasCredentialStatus: collection.credentialStatus !== undefined,
            subjectId: stringValue(subject, 'id', subjectPath, 'collectionCredential'),
            subjectIdentifiers: mapIdentifiers(
                subject.identifier,
                `${subjectPath}.identifier`,
                'collectionCredential'
            ),
            validFrom: stringValue(collection, 'validFrom', '', 'collectionCredential'),
            issued: stringValue(collection, 'issuanceDate', '', 'collectionCredential'),
            awarded: stringValue(collection, 'awardedDate', '', 'collectionCredential'),
            validUntil: stringValue(collection, 'validUntil', '', 'collectionCredential'),
            partial: collection.partial === true,
            evidence: [
                ...mapEvidence(collection.evidence, 'evidence', 'collectionCredential'),
                ...mapEvidence(subject.evidence, `${subjectPath}.evidence`, 'collectionCredential'),
            ],
        },
        records,
        associations,
        warnings,
    };
};
