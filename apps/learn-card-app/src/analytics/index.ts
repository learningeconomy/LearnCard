export { AnalyticsContextProvider, useAnalytics, useAnalyticsContext } from './context';
export { useSetAnalyticsUserId } from './useSetAnalyticsUserId';
export { useScreenView, normalizeScreenName } from './useScreenView';
export { useAnalyticsAgeGate } from './useAnalyticsAgeGate';

export { AnalyticsEvents } from './events';
export type { AnalyticsEventName, AnalyticsEventPayloads, EventPayload } from './events';
export { ProfileBuildMethod } from './events';
export type { ProfileSnapshot, ClaimEntryPoint } from './events';

export {
    detectAnalyticsEnvironment,
    getSharedEventContext,
    newFlowId,
    shouldDropEvents,
} from './sharedContext';
export type { AnalyticsEnvironment, SharedEventContext } from './sharedContext';
export {
    useProfileSnapshot,
    useProfileSnapshotCapture,
    ACCOUNT_CREATED_AT_KEY,
    ACCOUNT_CREATED_KEY,
    SESSION_START_KEY,
    LAST_SESSION_KEY,
    NEW_SIGNUP_FLAG_KEY,
    ONBOARDING_STARTED_AT_KEY,
    PROFILE_DATA_COUNT_KEY,
} from './useProfileSnapshot';
export { useAccountCreatedAndReturningSession } from './useAccountCreatedAndReturningSession';
export { useEngagementSignal } from './useEngagementSignal';
export type { EngagementSignalType } from './useEngagementSignal';

export type { AnalyticsProvider, AnalyticsProviderName, PostHogConfig } from './types';
