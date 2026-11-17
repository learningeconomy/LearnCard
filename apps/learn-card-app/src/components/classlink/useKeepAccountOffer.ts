import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import { useClassLinkAccountContinuity, useFeatureConfig } from 'learn-card-base';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { useClassLinkSession } from './useClassLinkSession';

/** Tenant flags for the "keep your account" entry points (inside the personal-email switch). */
export const isKeepAccountEnabled = (features: {
    classlinkSso?: boolean;
    classlinkPersonalEmail?: boolean;
    classlinkKeepAccount?: boolean;
}): boolean =>
    features.classlinkSso === true &&
    features.classlinkPersonalEmail === true &&
    features.classlinkKeepAccount === true;

/**
 * Whether the account has something to do that it is allowed to do: add a recovery method
 * after verifying an email, or add an email when the server allows it.
 */
export const needsKeepAccount = (continuity: ClassLinkAccountContinuity | undefined): boolean =>
    continuity?.nextStep === 'method' ||
    (continuity?.nextStep === 'email' && continuity.personalEmail.allowed);

/**
 * Server-driven "should we offer the keep-your-account step here?" for a ClassLink
 * session. Makes no lca-api call unless `enabled`, the tenant flags, a ready account and a
 * ClassLink session all allow it; the server then decides via `getAccountContinuity`.
 * `pending` is true while that answer is still coming, so hosts can wait rather than show
 * something else first.
 */
export const useKeepAccountOffer = (
    enabled = true
): { offer: boolean; pending: boolean; continuity?: ClassLinkAccountContinuity } => {
    const features = useFeatureConfig();
    const { state } = useAppAuth();
    const active = enabled && isKeepAccountEnabled(features) && state.status === 'ready';
    const classlinkSession = useClassLinkSession(active);
    const query = useClassLinkAccountContinuity({ enabled: active && classlinkSession === true });
    const continuity = active && classlinkSession === true ? query.data : undefined;

    return {
        offer: needsKeepAccount(continuity),
        pending: active && (classlinkSession === null || (classlinkSession && query.isLoading)),
        continuity,
    };
};
