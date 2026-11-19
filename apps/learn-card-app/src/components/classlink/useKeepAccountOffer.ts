import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import { useClassLinkAccountContinuity, useFeatureConfig } from 'learn-card-base';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import {
    needsKeepAccount,
    resolveKeepAccountStep,
    useKeepAccountSessionContext,
    type KeepAccountStepKind,
} from './keepAccountContext';
import { isKeepAccountEnabled } from './keepAccountFlags';
import { useClassLinkSession } from './useClassLinkSession';

export {
    needsKeepAccount,
    resolveKeepAccountStep,
    useKeepAccountSessionContext,
    type KeepAccountSessionContext,
    type KeepAccountStepKind,
} from './keepAccountContext';

/**
 * Server-driven "should we offer the keep-your-account step here?" for a ClassLink
 * session. Makes no lca-api call unless `enabled`, the tenant flags, a ready account and a
 * ClassLink session all allow it; the server then decides via `getAccountContinuity`.
 * `pending` is true while that answer is still coming, so hosts can wait rather than show
 * something else first. `step` is the step this session can act on.
 */
export const useKeepAccountOffer = (
    enabled = true
): {
    offer: boolean;
    pending: boolean;
    continuity?: ClassLinkAccountContinuity;
    step?: KeepAccountStepKind;
} => {
    const features = useFeatureConfig();
    const { state } = useAppAuth();
    const context = useKeepAccountSessionContext();
    const active = enabled && isKeepAccountEnabled(features) && state.status === 'ready';
    const classlinkSession = useClassLinkSession(active);
    const query = useClassLinkAccountContinuity({ enabled: active && classlinkSession === true });
    const continuity = active && classlinkSession === true ? query.data : undefined;

    return {
        offer: needsKeepAccount(continuity, context),
        pending: active && (classlinkSession === null || (classlinkSession && query.isLoading)),
        continuity,
        step: continuity ? resolveKeepAccountStep(continuity, context) : undefined,
    };
};
