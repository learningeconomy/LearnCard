import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { ModalTypes, redirectStore, useAuthStatus, useGetProfile, useModal } from 'learn-card-base';

import OnboardingFlow from '../../components/onboarding/v2/OnboardingFlow';
import { buildInboxClaimRedirect, deriveInboxClaimProfileState } from './inboxClaimGate';
import ExchangeLoading from './ExchangeLoading';
import ExchangeErrorDisplay from './ExchangeErrorDisplay';

export type InboxClaimProfileGateProps = {
    vc_request_url?: string | (string | null)[] | null;
};

/**
 * Blocks a Universal Inbox VC-API exchange until the signed-in user has a
 * confirmed LCN profile.
 *
 * - Confirmed absence → start the existing onboarding flow and preserve the
 *   exact claim link so it resumes after profile creation.
 * - Loading / offline / recovery / error → wait; never treat "couldn't
 *   determine" as "no profile", and never participate in the exchange.
 *
 * The gate is mounted by `ClaimFromRequest` for inbox claims only, so generic
 * VC-API flows are unaffected.
 */
export const InboxClaimProfileGate: React.FC<InboxClaimProfileGateProps> = ({ vc_request_url }) => {
    const history = useHistory();
    const authStatus = useAuthStatus();
    const profileState = deriveInboxClaimProfileState(authStatus);
    const { refetch } = useGetProfile();
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const didOpenOnboardingRef = useRef(false);

    useEffect(() => {
        if (profileState !== 'absent' || didOpenOnboardingRef.current) return;

        // Claim this gate's prompt before inspecting the shared flag so a
        // cancelled/dismissed onboarding can never re-open in a loop.
        didOpenOnboardingRef.current = true;

        // Another surface already owns an open onboarding modal; don't stack a
        // second one or clobber its redirect intent.
        if (redirectStore.get.isOnboardingOpen()) return;

        const pendingRedirect = buildInboxClaimRedirect(vc_request_url);
        if (pendingRedirect) redirectStore.set.lcnRedirect(pendingRedirect);
        redirectStore.set.isOnboardingOpen(true);

        newModal(
            <OnboardingFlow />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [profileState, vc_request_url, newModal]);

    const isProfileError = authStatus.tag === 'ready' && authStatus.profile.tag === 'error';

    if (isProfileError) {
        return (
            <ExchangeErrorDisplay
                errorData="We couldn't confirm your network profile. Check your connection and try again."
                onRetry={() => void refetch()}
                onCancel={() => history.push('/')}
            />
        );
    }

    return <ExchangeLoading />;
};

export default InboxClaimProfileGate;
