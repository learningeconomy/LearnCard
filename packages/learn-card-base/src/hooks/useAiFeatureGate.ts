import { switchedProfileStore } from '../stores/walletStore';
import { useGetPreferencesForDid } from '../react-query/queries/preferences';
import { useGetCurrentLCNUser } from './useGetCurrentLCNUser';
import { calculateAge } from '../helpers/dateHelpers';

export type AiFeatureGateReason =
    | 'enabled'
    | 'disabled_by_user'
    | 'disabled_minor'
    | 'loading';

/**
 * Returns whether AI features are currently enabled for the current user.
 * Uses stored preferences when available, with a local DOB/age fallback
 * so minors are gated even if preferences haven't been persisted yet.
 */
export function useAiFeatureGate(): {
    isAiEnabled: boolean;
    isLoading: boolean;
    reason: AiFeatureGateReason;
} {
    const { data: preferences, isLoading } = useGetPreferencesForDid();
    const profileType = switchedProfileStore.use.profileType();
    const { currentLCNUser } = useGetCurrentLCNUser();

    // Always block AI for child profiles regardless of stored preferences
    if (profileType === 'child') {
        return { isAiEnabled: false, isLoading: false, reason: 'disabled_minor' };
    }

    // Local DOB fallback: gate minors even when preferences haven't been written yet
    const dob = currentLCNUser?.dob;
    const age = dob ? calculateAge(dob) : null;
    const isMinorByAge = age !== null && !isNaN(age) && age < 18;

    if (isMinorByAge) {
        return { isAiEnabled: false, isLoading: false, reason: 'disabled_minor' };
    }

    if (isLoading) {
        return { isAiEnabled: false, isLoading: true, reason: 'loading' };
    }

    // Default true for existing users who have no stored aiEnabled field
    const aiEnabled = preferences?.aiEnabled ?? true;
    const isMinor = preferences?.isMinor ?? false;

    if (!aiEnabled && isMinor) {
        return { isAiEnabled: false, isLoading: false, reason: 'disabled_minor' };
    }

    if (!aiEnabled) {
        return { isAiEnabled: false, isLoading: false, reason: 'disabled_by_user' };
    }

    return { isAiEnabled: true, isLoading: false, reason: 'enabled' };
}

export default useAiFeatureGate;
