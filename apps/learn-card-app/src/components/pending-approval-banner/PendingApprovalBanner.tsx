import React, { useEffect } from 'react';

import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { ModalTypes, useGetCurrentLCNUser, useModal } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import { useGuardianApprovalStatus } from '../../hooks/useGuardianApprovalStatus';
import EUParentalConsentModalContent from '../onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent';
import GuardianEmailStatusMessage from './GuardianEmailStatusMessage';

type PendingApprovalBannerProps = {
    className?: string;
};

/** Picks up a guardian's approval while the learner stays on the dashboard. */
export const APPROVAL_POLL_INTERVAL_MS = 30_000;

const PendingApprovalBanner: React.FC<PendingApprovalBannerProps> = ({ className = '' }) => {
    const { data: status } = useGuardianApprovalStatus(true, {
        refetchInterval: APPROVAL_POLL_INTERVAL_MS,
    });
    const { refetch: refetchCurrentLCNUser } = useGetCurrentLCNUser();
    const { newModal, closeModal } = useModal();
    const approved = status?.pendingApproval === false;

    useEffect(() => {
        if (approved) void refetchCurrentLCNUser();
    }, [approved, refetchCurrentLCNUser]);

    const openConsentModal = () =>
        newModal(
            <EUParentalConsentModalContent onClose={closeModal} />,
            {
                sectionClassName:
                    'bg-transparent! border-none! shadow-none! rounded-none! mx-auto!',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );

    if (approved) return null;

    return (
        <div
            data-testid="pending-guardian-approval-banner"
            className={`w-full p-4 bg-amber-50 border border-amber-200 rounded-[20px] flex items-start gap-3 font-poppins ${className}`}
        >
            <IonIcon
                icon={alertCircleOutline}
                aria-hidden="true"
                className="text-amber-600 text-lg mt-0.5 shrink-0"
            />
            <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                    {m['onboarding.consent.eu.banner.title']()}
                </p>
                <p role="status" className="text-xs text-amber-700 leading-relaxed mt-0.5">
                    <GuardianEmailStatusMessage status={status} />{' '}
                    {m['onboarding.consent.eu.banner.limited']()}
                </p>
                <button
                    type="button"
                    onClick={openConsentModal}
                    className="mt-2 text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                >
                    {m['onboarding.consent.eu.banner.manage']()}
                </button>
            </div>
        </div>
    );
};

export default PendingApprovalBanner;
