/**
 * Pathways Provider IDs
 *
 * This enum is in a separate file to avoid circular dependencies.
 * Provider implementations import this enum, and the aggregator imports both.
 */

export enum PathwaysProviderEnum {
    CareerOneStop = 'careerOneStop',
    OpenSyllabus = 'openSyllabus',
    YouTube = 'youtube',
}
