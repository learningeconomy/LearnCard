import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ModalTypes, redirectStore, useAuthStatus, useGetProfile, useModal } from 'learn-card-base';
import deletingAccountStore from 'learn-card-base/stores/deletingAccountStore';

import OnboardingFlow from '../../components/onboarding/v2/OnboardingFlow';
import { buildInboxClaimRedirect, deriveInboxClaimProfileState } from './inboxClaimGate';
import * as m from '../../paraglide/messages.js';

export type InboxClaimProfileGateProps = {
    vc_request_url?: string | (string | null)[] | null;
};

/** Require a confirmed account before the app participates in an inbox claim. */
export const InboxClaimProfileGate: React.FC<InboxClaimProfileGateProps> = ({ vc_request_url }) => {
    const history = useHistory();
    const authStatus = useAuthStatus();
    const profileState = deriveInboxClaimProfileState(authStatus);
    const { refetch } = useGetProfile();
    const [retrying, setRetrying] = useState(false);
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const didPromptRef = useRef(false);

    const openOnboarding = useCallback(() => {
        if (profileState !== 'absent' || deletingAccountStore.get.deletingAccount()) return;
        const pendingRedirect = buildInboxClaimRedirect(vc_request_url);
        if (pendingRedirect) redirectStore.set.lcnRedirect(pendingRedirect);
        if (redirectStore.get.isOnboardingOpen()) return;
        redirectStore.set.isOnboardingOpen(true);
        newModal(
            <OnboardingFlow />,
            {},
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    }, [profileState, vc_request_url, newModal]);

    useEffect(() => {
        if (profileState !== 'absent' || didPromptRef.current) return;
        didPromptRef.current = true;
        openOnboarding();
    }, [profileState, openOnboarding]);

    const retry = async () => {
        setRetrying(true);
        try {
            await refetch();
        } finally {
            setRetrying(false);
        }
    };
    const connectionIssue =
        authStatus.tag === 'ready' &&
        (authStatus.profile.tag === 'error' || authStatus.profile.tag === 'unconfirmed');
    const loading = retrying || (profileState === 'pending' && !connectionIssue);

    return (
        <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] p-8 max-w-md w-full text-center space-y-5">
                <p
                    className="text-sm text-grayscale-600 leading-relaxed"
                    role={connectionIssue ? 'alert' : 'status'}
                >
                    {loading
                        ? m['common.loading']()
                        : connectionIssue
                          ? m['inboxClaimSetup.connection']()
                          : m['inboxClaimSetup.setup']()}
                </p>
                {loading && (
                    <span
                        aria-hidden="true"
                        className="inline-block w-5 h-5 border-2 border-grayscale-300 border-t-emerald-600 rounded-full animate-spin"
                    />
                )}
                {(profileState === 'absent' || connectionIssue) && (
                    <button
                        type="button"
                        disabled={retrying}
                        onClick={connectionIssue ? () => void retry() : openOnboarding}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {retrying
                            ? m['common.loading']()
                            : connectionIssue
                              ? m['common.tryAgain']()
                              : m['inboxClaimSetup.continue']()}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => history.push('/')}
                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                >
                    {m['common.cancel']()}
                </button>
            </div>
        </div>
    );
};

export default InboxClaimProfileGate;
