import { normalizeClrCredential } from './normalize';
import { summarizeClrCredits, getClrCreditTotal } from './credits';
import { getClrLearnerName, getClrProfileImage } from './selectors';
import { getEvidenceMimeType } from './evidence';
import { buildRelationshipGraph } from './relationships';
import type {
    ClrAlignmentModel,
    ClrEvidenceModel,
    ClrJsonObject,
    ClrMappedValue,
    ClrNormalizedModel,
    ClrResultModel,
    ClrRubricLevelModel,
} from './types';
import type {
    AlignmentDisplayModel,
    AssessmentDisplayModel,
    AwardDisplayModel,
    ClrTranscriptDisplayModel,
    CompetencyDisplayModel,
    CourseDisplayModel,
    DisplayWarning,
    EvidenceDisplayModel,
    OtherAcademicRecordModel,
    ProgramDisplayModel,
    ResultDisplayModel,
    RubricLevelDisplayModel,
    SourceMappedField,
    IssuerAddressDisplayModel,
} from './display.types';

export * from './display.types';

/** Adapts a canonical field without rebuilding or shortening its provenance. */
const mapped = <T>(
    field: ClrMappedValue<T> | undefined,
    recordId: string
): SourceMappedField<T> | undefined =>
    field && {
        ...field,
        specField: field.sourcePath,
        sourceCredentialId: recordId,
        directlyMapped: true,
    };

const text = (
    field: ClrMappedValue<string | number | boolean> | undefined,
    recordId: string
): SourceMappedField<string> | undefined =>
    field && mapped({ ...field, value: String(field.value) }, recordId);

const fallback = <T>(value: T, path: string, recordId: string): SourceMappedField<T> => ({
    value,
    sourcePath: path,
    specField: path,
    sourceCredentialId: recordId,
    directlyMapped: false,
});

const alignmentDisplay = (
    alignment: ClrAlignmentModel,
    recordId: string
): AlignmentDisplayModel => ({
    targetName: mapped(alignment.targetName, recordId),
    targetCode: mapped(alignment.targetCode, recordId),
    targetFramework: mapped(alignment.targetFramework, recordId),
    targetType: mapped(alignment.targetType, recordId),
    targetUrl: mapped(alignment.targetUrl, recordId),
    targetDescription: mapped(alignment.targetDescription, recordId),
    sourceCredentialId: recordId,
});

const evidenceDisplay = (evidence: ClrEvidenceModel, recordId: string): EvidenceDisplayModel => ({
    id: mapped(evidence.id, recordId),
    name: mapped(evidence.name, recordId),
    description: mapped(evidence.description, recordId),
    narrative: mapped(evidence.narrative, recordId),
    genre: mapped(evidence.genre, recordId),
    audience: mapped(evidence.audience, recordId),
    type: evidence.types.length
        ? {
              ...mapped(evidence.types[0], recordId)!,
              value: evidence.types.map(type => type.value),
              sourcePath: `${evidence.sourcePath}.type`,
          }
        : undefined,
    mimeType: getEvidenceMimeType(evidence.id?.value),
    isInlineDataUri: evidence.isInlineDataUri,
    isLargeInlineDataUri: evidence.isLargeInlineDataUri,
    sourceCredentialId: recordId,
});

const rubricDisplay = (level: ClrRubricLevelModel): RubricLevelDisplayModel => ({
    id: level.id?.value,
    name: level.name?.value ?? level.level?.value ?? level.id?.value ?? 'Unnamed level',
    level: level.level?.value,
    description: level.description?.value,
    points: level.points ? String(level.points.value) : undefined,
});

/** Preserves all results, including status-only, rubric-only, and unresolved references. */
const resultDisplay = (result: ClrResultModel, recordId: string): ResultDisplayModel => {
    const description = result.resultDescription;
    return {
        value: mapped(result.value, recordId),
        status: mapped(result.status, recordId),
        achievedLevelId: mapped(result.achievedLevelId, recordId),
        resultDescriptionId: mapped(result.resultDescriptionId, recordId),
        resultDescriptionResolved: result.resultDescriptionResolved,
        resultType: mapped(description?.resultType, recordId),
        label: mapped(description?.name, recordId),
        valueMin: text(description?.valueMin, recordId),
        valueMax: text(description?.valueMax, recordId),
        allowedValue: description?.allowedValue.length
            ? {
                  ...mapped(description.allowedValue[0], recordId)!,
                  value: description.allowedValue.map(value => value.value),
                  sourcePath: `${description.sourcePath}.allowedValue`,
              }
            : undefined,
        requiredValue: text(description?.requiredValue, recordId),
        requiredLevel: mapped(description?.requiredLevel, recordId),
        rubricLevels: description?.rubricLevels.length
            ? description.rubricLevels.map(rubricDisplay)
            : undefined,
        achievedLevel: result.achievedLevel ? rubricDisplay(result.achievedLevel) : undefined,
        requiredRubricLevel: result.requiredLevel ? rubricDisplay(result.requiredLevel) : undefined,
        alignments: result.alignments.map(alignment => alignmentDisplay(alignment, recordId)),
    };
};

/** Legacy display-only credit fallback. It never becomes a canonical credit claim. */
export const parseCreditsFromDescription = (description?: string): number | undefined => {
    const match = description?.match(/course,\s*(\d+(?:\.\d+)?)\s*credit/i);
    return match ? Number(match[1]) : undefined;
};

const addressDisplay = (address?: ClrJsonObject): IssuerAddressDisplayModel | undefined => {
    if (!address) return undefined;
    const string = (key: string) =>
        typeof address[key] === 'string' ? (address[key] as string) : undefined;
    const fields = {
        streetAddress: string('streetAddress'),
        addressLocality: string('addressLocality'),
        addressRegion: string('addressRegion'),
        postalCode: string('postalCode'),
        addressCountry: string('addressCountry'),
    };
    return Object.values(fields).some(Boolean)
        ? { ...fields, sourcePath: 'issuer.address' }
        : undefined;
};

/**
 * Projects the shared model into the existing transcript UI contract. Classification,
 * summary wording, and display fallbacks are policies; source claims remain canonical.
 */
export const createClrTranscriptDisplayModel = (
    canonical: ClrNormalizedModel
): ClrTranscriptDisplayModel => {
    const { collection, records } = canonical;
    const credentialId = collection.id?.value ?? 'unknown-credential-id';
    const warnings: DisplayWarning[] = canonical.warnings.map(warning => ({
        ...warning,
        severity: 'warning',
        sourceCredentialId: warning.recordId,
    }));
    const courses: CourseDisplayModel[] = [];
    const programs: ProgramDisplayModel[] = [];
    const competencies: CompetencyDisplayModel[] = [];
    const assessments: AssessmentDisplayModel[] = [];
    const awards: AwardDisplayModel[] = [];
    const otherRecords: OtherAcademicRecordModel[] = [];
    const isStandalone = records.some(
        record => record.sourceCredential === collection.sourceCredential
    );
    const evidence = isStandalone
        ? []
        : collection.evidence.map(item => evidenceDisplay(item, credentialId));
    let explicitGpa: SourceMappedField<string | number | boolean> | undefined;

    for (const record of records) {
        const id = record.id;
        const results = record.results.map(result => resultDisplay(result, id));
        const recordEvidence = record.evidence.map(item => evidenceDisplay(item, id));
        const type = record.achievementTypes[0];
        const common = {
            sourceCredentialId: id,
            achievementId: record.achievementId?.value,
            name: mapped(record.name ?? record.credentialName, id),
            description: mapped(record.description ?? record.credentialDescription, id),
            // Retain the legacy display fallback; the independent dates remain in canonical.records.
            earnedAt: mapped(
                record.dates.activityEnd ?? record.dates.awarded ?? record.dates.validFrom,
                id
            ),
            validUntil: mapped(record.dates.validUntil, id),
            results,
            alignments: record.alignments.map(alignment => alignmentDisplay(alignment, id)),
            evidence: recordEvidence,
        };
        evidence.push(...recordEvidence);
        explicitGpa ??= results.find(
            result => result.resultType?.value === 'GradePointAverage'
        )?.value;

        // An explicit type chooses a legacy category; every remaining child has a catch-all row.
        const achievementType = mapped(type, id) ?? fallback('Achievement', '', id);
        if (record.presentationHints.includes('course')) {
            const courseType = record.achievementTypes.find(value => value.value === 'Course')!;
            const parsedCredits =
                !record.creditsEarned && !record.creditsAvailable
                    ? parseCreditsFromDescription(record.description?.value)
                    : undefined;
            courses.push({
                ...common,
                achievementType: { ...mapped(courseType, id)!, value: 'Course' },
                humanCode: mapped(record.humanCode, id),
                fieldOfStudy: mapped(record.fieldOfStudy, id),
                creditsAvailable: mapped(record.creditsAvailable, id),
                creditsEarned: mapped(record.creditsEarned, id),
                creditsEarnedUnit: mapped(record.creditsEarnedUnit, id),
                creditsAvailableUnit: mapped(record.creditsAvailableUnit, id),
                creditsFromDescription:
                    parsedCredits === undefined
                        ? undefined
                        : fallback(parsedCredits, record.description!.sourcePath, id),
                term: mapped(record.term, id),
            });
        } else if (record.presentationHints.includes('competency')) {
            const competencyType = record.achievementTypes.find(
                value => value.value === 'Competency'
            )!;
            competencies.push({
                ...common,
                achievementType: { ...mapped(competencyType, id)!, value: 'Competency' },
            });
        } else if (record.presentationHints.includes('program')) {
            programs.push({ ...common, achievementType });
        } else if (
            record.presentationHints.includes('assessment') ||
            record.fieldOfStudy?.value === 'Assessment'
        ) {
            assessments.push({
                ...common,
                achievementType,
                isRubric: results.some(result => Boolean(result.rubricLevels?.length)),
            });
        } else if (
            record.presentationHints.some(hint => hint === 'award' || hint === 'qualification')
        ) {
            awards.push({
                ...common,
                achievementType,
                criteria: mapped(record.criteria?.narrative, id),
            });
        } else {
            otherRecords.push({
                ...common,
                reason: type ? 'unsupportedAchievementType' : 'missingAchievement',
            });
        }
    }

    const recordById = new Map(records.map(record => [record.id, record]));
    const nameOf = (id?: string) =>
        id && (recordById.get(id)?.name?.value ?? recordById.get(id)?.credentialName?.value ?? id);
    const associations = canonical.associations.flatMap(association => {
        if (!association.associationType || !association.sourceId || !association.targetId)
            return [];
        return [
            {
                associationType: association.associationType.value,
                sourceId: association.sourceId.value,
                targetId: association.targetId.value,
                sourceRecordId: association.sourceRecordId,
                targetRecordId: association.targetRecordId,
                sourceResolution: association.sourceResolution,
                targetResolution: association.targetResolution,
                sourceName: nameOf(association.sourceRecordId),
                targetName: nameOf(association.targetRecordId),
                source: mapped(association.associationType, credentialId)!,
            },
        ];
    });
    const navigableIds = new Set(
        [...courses, ...programs, ...competencies, ...assessments, ...awards, ...otherRecords].map(
            record => record.sourceCredentialId
        )
    );
    const relationships = buildRelationshipGraph(associations, navigableIds);
    for (const item of evidence) {
        if (item.isLargeInlineDataUri)
            warnings.push({
                code: 'LARGE_INLINE_EVIDENCE',
                severity: 'warning',
                message: 'Large inline evidence should not be eagerly rendered in compact views.',
                sourceCredentialId: item.sourceCredentialId,
                sourcePath: item.id?.sourcePath,
            });
    }
    if (collection.partial)
        warnings.push({
            code: 'PARTIAL_CLR',
            severity: 'warning',
            message:
                'This CLR is explicitly marked partial and may not contain all known assertions.',
            sourcePath: 'partial',
        });
    if (!collection.subjectIdentifiers.length)
        warnings.push({
            code: 'MISSING_LEARNER_IDENTIFIER',
            severity: 'warning',
            message: 'No learner identifier present.',
            sourcePath: `${collection.subjectPath}.identifier`,
        });
    if (!courses.length)
        warnings.push({
            code: 'MISSING_COURSES',
            severity: 'info',
            message: 'No explicitly typed course records found.',
        });
    if (!explicitGpa)
        warnings.push({
            code: 'MISSING_GPA',
            severity: 'info',
            message: 'No explicit GPA result was found via resultDescription.resultType.',
        });
    if (!collection.hasProof)
        warnings.push({
            code: 'UNSIGNED_CREDENTIAL',
            severity: 'warning',
            message: 'Credential is unsigned or proof was not provided.',
            sourcePath: 'proof',
        });
    if (collection.nestedUnsignedCount)
        warnings.push({
            code: 'NESTED_UNSIGNED_CREDENTIALS',
            severity: 'info',
            message: 'One or more nested credentials are unsigned or missing proof.',
        });

    const creditTotals = summarizeClrCredits(courses);
    const qualityLevel = courses.length
        ? 'rich'
        : programs.length
          ? 'usable'
          : evidence.length || assessments.length || awards.length || otherRecords.length
            ? 'sparse'
            : 'poor';
    const credentialStatusType = collection.credentialStatusTypes[0];
    return {
        canonical,
        records,
        meta: { partial: collection.partial, credentialStatusType },
        header: {
            id: mapped(collection.id, credentialId) ?? fallback(credentialId, 'id', credentialId),
            type: {
                ...(mapped(collection.types[0], credentialId) ??
                    fallback('VerifiableCredential', 'type', credentialId)),
                value: collection.types.map(type => type.value),
                sourcePath: 'type',
            },
            title:
                mapped(collection.name, credentialId) ??
                fallback('Academic Record', 'name', credentialId),
            description: mapped(collection.description, credentialId),
            image: mapped(collection.image, credentialId),
            issuerName: mapped(collection.publisher?.name, credentialId),
            issuerId: mapped(collection.publisher?.id, credentialId),
            issuerImage: mapped(getClrProfileImage(collection.publisher), credentialId),
            issuerAddress: addressDisplay(collection.publisher?.address),
            issuedAt: mapped(collection.issued, credentialId),
            validFrom: mapped(collection.validFrom, credentialId),
            awardedDate: mapped(collection.awarded, credentialId),
            validUntil: mapped(collection.validUntil, credentialId),
            learnerName: mapped(
                getClrLearnerName(collection.subjectIdentifiers, collection.subjectId),
                credentialId
            ),
            learnerIdentifiers: {
                value: collection.subjectIdentifiers.map(identifier => identifier.source),
                sourcePath: `${collection.subjectPath}.identifier`,
                specField: 'credentialSubject.identifier',
                sourceCredentialId: credentialId,
                directlyMapped: true,
            },
        },
        summary: {
            gpa: explicitGpa,
            courseCount: courses.length,
            assessmentCount: assessments.length,
            awardCount: awards.length,
            creditTotals,
            totalCreditsAvailable: getClrCreditTotal(creditTotals, 'available'),
            totalCreditsEarned: getClrCreditTotal(creditTotals, 'earned'),
            totalCreditsInferred: getClrCreditTotal(creditTotals, 'inferred'),
            explicitCompetencyCount: competencies.length,
            evidenceCount: evidence.length,
        },
        courses,
        programs,
        competencies,
        assessments,
        awards,
        otherRecords,
        evidence,
        associations,
        relationships,
        warnings,
        quality: {
            level: qualityLevel,
            reasons: [
                `courses=${courses.length}`,
                `programs=${programs.length}`,
                `assessments=${assessments.length}`,
                `awards=${awards.length}`,
                `evidence=${evidence.length}`,
                ...(collection.partial ? ['partial=true'] : []),
            ],
        },
        verification: {
            credentialSigned: collection.hasProof,
            credentialVerified: false,
            nestedCredentialSignedCount: collection.nestedSignedCount,
            nestedCredentialUnsignedCount: collection.nestedUnsignedCount,
            status: collection.hasProof ? 'signed-unverified' : 'unsigned',
            hasCredentialStatus: collection.hasCredentialStatus,
            credentialStatusType,
        },
    };
};

/** Normalizes once, then builds the backward-compatible transcript presentation. */
export const normalizeClrTranscriptDisplayModel = (
    credential: ClrJsonObject
): ClrTranscriptDisplayModel => createClrTranscriptDisplayModel(normalizeClrCredential(credential));
