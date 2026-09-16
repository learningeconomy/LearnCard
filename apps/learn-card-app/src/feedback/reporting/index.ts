/**
 * Public surface of the LC-2086 feedback reporting feature.
 *
 * Consumers mount `FeedbackProvider` near the app root and reach the flow
 * through `useFeedback()`; `useFeedbackBusyState` is exported for the
 * automatic listener wiring (shake / iOS screenshot observers).
 */

export { FeedbackProvider, useFeedback, useFeedbackOptional } from './FeedbackContext';
export type {
    CollectFeedbackContextForKind,
    FeedbackController,
    FeedbackProviderDeps,
} from './FeedbackContext';
export { useFeedbackBusyState } from './useFeedbackBusyState';
