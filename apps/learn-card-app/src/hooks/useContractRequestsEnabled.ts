import { useFlags } from 'launchdarkly-react-client-sdk';
import { useFeatureConfig } from 'learn-card-base';

/** Tenant kill switch and per-user rollout must both explicitly allow referrals. */
export const useContractRequestsEnabled = (): boolean => {
    const features = useFeatureConfig();
    const flags = useFlags();
    return features.contractRequests === true && flags?.enableContractRequests === true;
};
