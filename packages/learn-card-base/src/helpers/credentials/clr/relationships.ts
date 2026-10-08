import type { ClrNavigableRecord, ClrRecordNavigator } from './display.types';
export type { ClrNavigableRecord, ClrRecordNavigator } from './display.types';
import type {
    AssociationDisplayModel,
    RelationshipGraph,
    RelationshipDisplayModel,
    RelationshipKind,
    CompetencyDisplayModel,
    ClrTranscriptDisplayModel,
    ViewOptions,
} from './display.types';
import { resolveClrRecord } from './selectors';

export const buildRelationshipGraph = (
    associations: AssociationDisplayModel[],
    navigableRecordIds: Set<string>
): RelationshipGraph => {
    const relationshipsByRecordId = new Map<string, RelationshipDisplayModel[]>();
    const seen = new Set<string>();

    const add = (
        association: AssociationDisplayModel,
        recordId: string | undefined,
        relatedRecordId: string | undefined,
        relatedRecordName: string | undefined,
        kind: RelationshipKind,
        labelPrefix: string
    ): void => {
        if (!recordId) return;
        const forward = recordId === association.sourceRecordId;
        const resolution = forward ? association.targetResolution : association.sourceResolution;
        relatedRecordId ??= forward ? association.targetId : association.sourceId;
        relatedRecordName ??= relatedRecordId;
        if (!relatedRecordId || !relatedRecordName) return;

        const dedupeKey = `${recordId}\u0000${kind}\u0000${relatedRecordId}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        const relationships = relationshipsByRecordId.get(recordId) ?? [];
        relationships.push({
            kind,
            recordId,
            relatedRecordId,
            relatedRecordName,
            navigable:
                (!resolution || resolution === 'resolved') &&
                navigableRecordIds.has(relatedRecordId),
            resolution,
            label: `${labelPrefix} ${relatedRecordName}`,
            source: association.source,
        });
        relationshipsByRecordId.set(recordId, relationships);
    };

    for (const association of associations) {
        const { associationType, sourceRecordId, targetRecordId, sourceName, targetName } =
            association;

        switch (associationType) {
            case 'isChildOf':
            case 'isPartOf':
                add(association, sourceRecordId, targetRecordId, targetName, 'parent', 'Part of');
                add(association, targetRecordId, sourceRecordId, sourceName, 'child', 'Includes');
                break;
            case 'isParentOf':
                add(association, sourceRecordId, targetRecordId, targetName, 'child', 'Includes');
                add(association, targetRecordId, sourceRecordId, sourceName, 'parent', 'Part of');
                break;
            case 'precedes':
                add(association, sourceRecordId, targetRecordId, targetName, 'unlock', 'Unlocks');
                add(
                    association,
                    targetRecordId,
                    sourceRecordId,
                    sourceName,
                    'prerequisite',
                    'Requires'
                );
                break;
            case 'isPeerOf':
                add(
                    association,
                    sourceRecordId,
                    targetRecordId,
                    targetName,
                    'peer',
                    'Taken alongside'
                );
                add(
                    association,
                    targetRecordId,
                    sourceRecordId,
                    sourceName,
                    'peer',
                    'Taken alongside'
                );
                break;
            case 'exactMatchOf':
                add(
                    association,
                    sourceRecordId,
                    targetRecordId,
                    targetName,
                    'equivalent',
                    'Equivalent to'
                );
                add(
                    association,
                    targetRecordId,
                    sourceRecordId,
                    sourceName,
                    'equivalent',
                    'Equivalent to'
                );
                break;
            case 'replacedBy':
                add(
                    association,
                    sourceRecordId,
                    targetRecordId,
                    targetName,
                    'supersededBy',
                    'Superseded by'
                );
                add(
                    association,
                    targetRecordId,
                    sourceRecordId,
                    sourceName,
                    'replacement',
                    'Replaces'
                );
                break;
            case 'isRelatedTo':
                add(association, sourceRecordId, targetRecordId, targetName, 'related', 'Related');
                add(association, targetRecordId, sourceRecordId, sourceName, 'related', 'Related');
                break;
        }
    }

    return Object.fromEntries(relationshipsByRecordId);
};

const COMPETENCY_LINK_TYPES: Record<string, true> = {
    isRelatedTo: true,
    isChildOf: true,
    isParentOf: true,
    isPartOf: true,
};

export const getLinkedCompetencies = (
    recordId: string,
    competencies: CompetencyDisplayModel[],
    associations: AssociationDisplayModel[]
): CompetencyDisplayModel[] => {
    const linkedIds = new Set<string>();
    for (const association of associations) {
        if (!Object.hasOwn(COMPETENCY_LINK_TYPES, association.associationType)) continue;
        const sourceId =
            association.sourceResolution && association.sourceResolution !== 'resolved'
                ? undefined
                : (association.sourceRecordId ?? association.sourceId);
        const targetId =
            association.targetResolution && association.targetResolution !== 'resolved'
                ? undefined
                : (association.targetRecordId ?? association.targetId);
        if (sourceId === recordId && targetId) linkedIds.add(targetId);
        else if (targetId === recordId && sourceId) linkedIds.add(sourceId);
    }
    return competencies.filter(competency => linkedIds.has(competency.sourceCredentialId));
};

/** Index display records once per model, preserving the canonical lookup precedence. */
export const createClrRecordMap = (
    model: ClrTranscriptDisplayModel
): ReadonlyMap<string, ClrNavigableRecord> => {
    const records = new Map<string, ClrNavigableRecord>();
    const add = (selected: ClrNavigableRecord): void => {
        const id = selected.record.sourceCredentialId;
        if (!records.has(id)) records.set(id, selected);
    };
    model.courses.forEach(record => add({ kind: 'course', record }));
    model.programs.forEach(record => add({ kind: 'program', record }));
    model.assessments.forEach(record => add({ kind: 'assessment', record }));
    model.competencies.forEach(record => add({ kind: 'competency', record }));
    model.awards.forEach(record => add({ kind: 'award', record }));
    model.otherRecords.forEach(record => add({ kind: 'other', record }));
    return records;
};

/** Looks up an internal canonical ID; source aliases still use conservative resolution. */
export const findClrRecordByCanonicalId = (
    model: ClrTranscriptDisplayModel,
    id: string
): ClrNavigableRecord | undefined => {
    const course = model.courses.find(record => record.sourceCredentialId === id);
    if (course) return { kind: 'course', record: course };

    const program = model.programs.find(record => record.sourceCredentialId === id);
    if (program) return { kind: 'program', record: program };

    const assessment = model.assessments.find(record => record.sourceCredentialId === id);
    if (assessment) return { kind: 'assessment', record: assessment };

    const competency = model.competencies.find(record => record.sourceCredentialId === id);
    if (competency) return { kind: 'competency', record: competency };

    const award = model.awards.find(record => record.sourceCredentialId === id);
    if (award) return { kind: 'award', record: award };

    const other = model.otherRecords.find(record => record.sourceCredentialId === id);
    if (other) return { kind: 'other', record: other };

    return undefined;
};

export const findClrRecordById = (
    model: ClrTranscriptDisplayModel,
    id: string
): ClrNavigableRecord | undefined => {
    const resolved = resolveClrRecord(model.canonical, id);
    if (resolved.resolution !== 'resolved' || !resolved.record) return undefined;
    id = resolved.record.id;
    return findClrRecordByCanonicalId(model, id);
};

export const createClrRecordSelection = (
    model: ClrTranscriptDisplayModel,
    onOpenRecord: (selected: ClrNavigableRecord) => void,
    records = createClrRecordMap(model)
): ClrRecordNavigator => {
    const selectRecord = (recordId: string): void => {
        const canonical = records.get(recordId);
        const resolved = canonical ? undefined : resolveClrRecord(model.canonical, recordId);
        const selected =
            canonical ??
            (resolved?.resolution === 'resolved' && resolved.record
                ? records.get(resolved.record.id)
                : undefined);
        if (selected) onOpenRecord(selected);
    };

    return { selectRecord, openRecord: onOpenRecord };
};

export const getRelationshipsForRecord = (
    relationships: RelationshipGraph,
    recordId: string
): RelationshipDisplayModel[] => relationships[recordId] ?? [];

export const selectClrTranscriptView = (
    model: ClrTranscriptDisplayModel,
    options: ViewOptions
):
    | 'VerifierInspectionView'
    | 'StructuredTranscriptView'
    | 'SparseAcademicRecordView'
    | 'CredentialSummaryView' => {
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

    if (
        model.evidence.length > 0 ||
        model.assessments.length > 0 ||
        model.awards.length > 0 ||
        model.otherRecords.length > 0
    ) {
        return 'SparseAcademicRecordView';
    }

    return 'CredentialSummaryView';
};
