/** Transcript UI compatibility API, backed exclusively by the canonical CLR model. */
export * from './display';
export * from './relationships';
export { formatClrDate } from './presentation';
export { createClrCanonicalRecordMap, isStandaloneCourseCredential } from './selectors';
