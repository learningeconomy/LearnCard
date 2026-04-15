import { switchedProfileStore } from '../stores/walletStore';
import { useGetPreferencesForDid } from '../react-query/queries/preferences';
import { useGetCurrentLCNUser } from './useGetCurrentLCNUser';
import { getAiFeatureAgeGateState } from '../helpers/aiFeatureGate';

export type AiFeatureGateReason = 'enabled' | 'disabled_by_user' | 'disabled_minor' | 'loading';

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

    const ageGate = getAiFeatureAgeGateState({
        profileType,
        dob: currentLCNUser?.dob,
        country: currentLCNUser?.country,
    });

    if (ageGate.isAiAgeRestricted) {
        return { isAiEnabled: false, isLoading: false, reason: 'disabled_minor' };
    }

    if (isLoading) {
        return { isAiEnabled: false, isLoading: true, reason: 'loading' };
    }

    // Default true for existing non-child users who have no stored aiEnabled field,
    // but require an explicit approval for child profiles.
    const aiEnabled = ageGate.isChildProfile
        ? preferences?.aiEnabled ?? false
        : preferences?.aiEnabled ?? true;

    if (!aiEnabled) {
        return { isAiEnabled: false, isLoading: false, reason: 'disabled_by_user' };
    }

    return { isAiEnabled: true, isLoading: false, reason: 'enabled' };
}

export default useAiFeatureGate;
