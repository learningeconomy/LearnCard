import type { ClrNormalizedModel, ClrNormalizedRecord } from './types';
import type {
    ClrLayoutInference,
    ClrLayoutKind,
    ClrRecordSection,
    ClrSectionKind,
} from './layout.types';
export type {
    ClrLayoutInference,
    ClrLayoutKind,
    ClrRecordSection,
    ClrSectionKind,
} from './layout.types';

const MILITARY_TITLE =
    /\bmilitary\s+(?:(?:training|qualifications?|service)\s*(?:[&/—–-]|and)?\s*)*(?:training|records?|transcripts?|qualifications?)\b/i;
const ACADEMIC_TITLE =
    /\b(?:academic\s+(?:record|history|transcript)|student\s+record|grade\s+report)\b/i;
const DEGREES = new Set([
    'AssociateDegree',
    'BachelorDegree',
    'Degree',
    'Diploma',
    'DoctoralDegree',
    'GeneralEducationDevelopment',
    'MasterDegree',
    'ProfessionalDoctorate',
    'ResearchDoctorate',
    'SecondarySchoolDiploma',
]);
const ACADEMIC_TYPES = new Set([
    ...DEGREES,
    'Course',
    'Assessment',
    'Assignment',
    'Competency',
    'LearningProgram',
    'Award',
    'Badge',
    'CoCurricular',
]);

/** Selects presentation only. CLR use-case categories are not credential sector claims. */
export const inferClrLayout = (model: ClrNormalizedModel): ClrLayoutInference => {
    if (
        model.records.length === 1 &&
        model.records[0].sourceCredential === model.collection.sourceCredential &&
        model.records[0].presentationHints.includes('course')
    ) {
        return { kind: 'academic', reason: 'academic-structure' };
    }
    const title = model.collection.name?.value ?? '';
    const military = MILITARY_TITLE.test(title);
    // A military transcript is not itself a conflicting academic signal.
    const academic =
        ACADEMIC_TITLE.test(title) || /\btranscript\b/i.test(title.replace(MILITARY_TITLE, ''));
    if (military && academic) return { kind: 'general', reason: 'conflicting-title' };
    if (military) return { kind: 'military', reason: 'military-title' };
    if (academic) return { kind: 'academic', reason: 'academic-title' };
    const academicRecords =
        model.records.length > 0 &&
        model.records.every(
            record =>
                record.achievementTypes.length > 0 &&
                record.achievementTypes.every(type => ACADEMIC_TYPES.has(type.value))
        );
    const academicSignal = model.records.some(
        record =>
            record.achievementTypes.some(type => DEGREES.has(type.value)) ||
            record.results.some(
                result =>
                    result.resultDescription?.resultType?.value === 'GradePointAverage' &&
                    result.value !== undefined
            )
    );
    return academicRecords && academicSignal
        ? { kind: 'academic', reason: 'academic-structure' }
        : { kind: 'general', reason: 'inconclusive' };
};

const primarySection = (record: ClrNormalizedRecord): ClrSectionKind => {
    const hints = record.presentationHints;
    // Specific record types win over the broad activity hint contributed by dates/roles.
    if (hints.includes('qualification')) return 'qualifications';
    if (hints.includes('course')) return 'courses';
    if (hints.includes('program')) return 'programs';
    if (hints.includes('assessment')) return 'assessments';
    if (hints.includes('competency')) return 'competencies';
    if (hints.includes('award')) return 'awards';
    if (hints.includes('membership')) return 'other';
    if (hints.includes('activity')) return 'activities';
    return 'other';
};

/** Partitions every canonical occurrence exactly once, preserving source order within sections. */
export const groupClrRecords = (
    records: ClrNormalizedRecord[],
    layout: ClrLayoutKind
): ClrRecordSection[] => {
    const order: ClrSectionKind[] =
        layout === 'military'
            ? [
                  'training',
                  'activities',
                  'assessments',
                  'competencies',
                  'qualifications',
                  'awards',
                  'other',
              ]
            : [
                  'courses',
                  'programs',
                  'activities',
                  'assessments',
                  'competencies',
                  'qualifications',
                  'awards',
                  'other',
              ];
    const groups = new Map<ClrSectionKind, ClrNormalizedRecord[]>();
    for (const record of records) {
        let kind = primarySection(record);
        if (layout === 'military' && (kind === 'courses' || kind === 'programs')) kind = 'training';
        const group = groups.get(kind) ?? [];
        group.push(record);
        groups.set(kind, group);
    }
    return order.flatMap(kind => (groups.has(kind) ? [{ kind, records: groups.get(kind)! }] : []));
};
