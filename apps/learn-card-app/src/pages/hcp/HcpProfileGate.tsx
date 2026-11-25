import React from 'react';
import { shouldPromptProfileOnboarding, useAuthStatus, useGetProfile } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import useJoinLCNetworkModal from '../../components/network-prompts/hooks/useJoinLCNetworkModal';
import { HcpError, HcpLoading } from './HcpStates';

/**
 * HCP data belongs to a LearnCard Network profile. A signed-in person without one
 * gets the app's own profile setup (OnboardingFlow) instead of an error. "No profile"
 * is the auth gate's confirmed `absent`, never a failed request, so real failures
 * still show the error state (and never offer Allow).
 */
export const HcpProfileGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const status = useAuthStatus();
    const profile = useGetProfile();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    if (shouldPromptProfileOnboarding(status)) {
        return (
            <div className="py-10 px-6 text-center">
                <p className="text-[15px] font-semibold text-grayscale-900 mb-1">
                    {m['hcp.profile.title']()}
                </p>
                <p className="text-sm text-grayscale-600 mb-5">{m['hcp.profile.body']()}</p>
                <button
                    type="button"
                    // Stay on this page: once the profile exists, it shows what was asked for.
                    onClick={() => void handlePresentJoinNetworkModal(() => profile.refetch())}
                    className="py-3 px-6 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium"
                >
                    {m['hcp.profile.setUp']()}
                </button>
            </div>
        );
    }
    if (status.tag === 'ready') {
        if (status.profile.tag === 'present') return <>{children}</>;
        if (status.profile.tag === 'error' || status.profile.tag === 'unconfirmed')
            return <HcpError onRetry={() => void profile.refetch()} />;
    }
    // Wait for the answer so a missing profile never flashes an error first.
    return <HcpLoading />;
};

export default HcpProfileGate;
