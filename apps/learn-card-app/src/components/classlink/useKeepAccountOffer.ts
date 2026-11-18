import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import { useClassLinkAccountContinuity, useFeatureConfig } from 'learn-card-base';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { isKeepAccountEnabled } from './keepAccountFlags';
import { useClassLinkSession } from './useClassLinkSession';

/**
 * Whether an entry point should invite the user: add a personal email (when the server
 * allows one), then, once it is in, create a PIN (escrow accounts) or add a passkey or
 * recovery phrase (`method`: only accounts that cannot have escrow, e.g. a placeholder
 * school email). Each host decides which of these it asks for.
 */
export const needsKeepAccount = (continuity: ClassLinkAccountContinuity | undefined): boolean =>
    continuity?.nextStep === 'pin' ||
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
