import type { ClrNormalizedRecord } from './types';

export type ClrLayoutKind = 'academic' | 'military' | 'general';
export type ClrLayoutInference = {
    kind: ClrLayoutKind;
    reason:
        | 'military-title'
        | 'academic-title'
        | 'academic-structure'
        | 'conflicting-title'
        | 'inconclusive';
};
export type ClrSectionKind =
    | 'training'
    | 'courses'
    | 'programs'
    | 'activities'
    | 'assessments'
    | 'competencies'
    | 'qualifications'
    | 'awards'
    | 'other';
export interface ClrRecordSection {
    kind: ClrSectionKind;
    records: ClrNormalizedRecord[];
}
