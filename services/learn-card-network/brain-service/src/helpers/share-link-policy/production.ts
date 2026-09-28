import { isProfileManaged } from '@accesslayer/profile/relationships/read';

import type { ShareLinkOwnerAge, ShareLinkPolicySource } from './types';

/**
 * Production policy source.
 *
 * Managed status comes from the authoritative persisted profile relationship
 * (`getProfilesThatManageAProfile`). There is currently **no trustworthy
 * persisted age source** in Brain: profile metadata carries no verified
 * birthdate, and claiming an adult from the absence of a manager would be an
 * unsafe inference. The adapter therefore reports `unknown` age, which maps to
 * the conservative no-views/30-day policy for every owner until a reviewed
 * authoritative age source is wired in.
 *
 * For example, a future verified-age worker could pass `resolveOwnerAge` here
 * without changing the policy decision table or the routes.
 */
export const createProductionShareLinkPolicySource = (options?: {
    resolveOwnerAge?: (profileId: string) => Promise<ShareLinkOwnerAge>;
}): ShareLinkPolicySource => ({
    resolveOwnerAge: options?.resolveOwnerAge ?? (async () => 'unknown'),
    isManaged: isProfileManaged,
});
