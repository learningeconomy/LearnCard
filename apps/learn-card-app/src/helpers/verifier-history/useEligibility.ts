import { useCallback, useRef } from 'react';
import { useGetCurrentLCNUser } from 'learn-card-base';
import { getAiFeatureAgeGateState } from 'learn-card-base/helpers/aiFeatureGate';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { isHistoryAccountEligible, useHistoryAccountRevision } from './account';

/** One age/managed-account policy for controls and every protocol; no history-storage lookup. */
export const useVerifierHistoryEligibility = (): (() => boolean) => {
    useHistoryAccountRevision();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    // Private age fields may be absent from public-profile SDK declarations. Validate runtime values.
    const dob: unknown = Reflect.get(currentLCNUser ?? {}, 'dob');
    const country: unknown = Reflect.get(currentLCNUser ?? {}, 'country');
    const age = getAiFeatureAgeGateState({
        profileType: switchedProfileStore.get.profileType(),
        dob: typeof dob === 'string' ? dob : undefined,
        country: typeof country === 'string' ? country : undefined,
    });
    const allowed = useRef(false);
    allowed.current =
        Boolean(currentLCNUser) &&
        !currentLCNUserLoading &&
        !age.isChildProfile &&
        !age.isMinorByAge &&
        isHistoryAccountEligible();
    return useCallback(() => allowed.current, []);
};
