import React, { useCallback, useId, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { shieldOutline } from 'ionicons/icons';
import type { LCNProfile } from '@learncard/types';

import { ModalTypes, useAuthStatus, useGetCurrentLCNUser, useModal } from 'learn-card-base';
import { hasNetworkProfile } from 'learn-card-base/auth-status/authStatus';

import EUParentalConsentModalContent from '../../components/onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent';
import * as m from '../../paraglide/messages.js';

export interface InboxAccountApprovalNoticeProps {
    variant?: 'inline' | 'page';
    className?: string;
}

/**
 * Narrows the `useGetCurrentLCNUser` union to a full LCN profile that actually
 * carries the account-approval field. Visible/public profile variants have no
 * `approved`, and an absent flag is "unknown", never "unapproved".
 */
const hasAccountApproval = (value: unknown): value is LCNProfile =>
    Boolean(value) && typeof value === 'object' && 'approved' in (value as object);

/**
 * Account-level guardian approval nudge for the inbox claim flow.
 *
 * Distinct from the credential-scoped `InboxGuardianPending` summary: this is
 * about the learner's *account* (`profile.approved`), not the guardian status of
 * any single credential. It renders only once the auth/profile question has
 * settled with a real profile that is explicitly `approved === false` — never
 * while loading, errored, missing, or approved, and never inferred from age.
 *
 * The action reuses the existing EU parental-consent form through the shared
 * modal stack (no local `useIonModal`) and refetches the profile on completion
 * without ever optimistically marking the account approved.
 */
const InboxAccountApprovalNotice: React.FC<InboxAccountApprovalNoticeProps> = ({
    variant = 'inline',
    className = '',
}) => {
    const headingId = useId();
    const authStatus = useAuthStatus();
    const { currentLCNUser, currentLCNUserLoading, refetch } = useGetCurrentLCNUser();
    const { newModal, closeModalById } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalIdRef = useRef<number | null>(null);

    // `useGetCurrentLCNUser` returns a union that also covers visible/public
    // profiles which have no account-approval fields. Narrow to the full LCN
    // profile before reading `approved`/`dob`/`country`; never infer approval.
    const lcnProfile = hasAccountApproval(currentLCNUser) ? currentLCNUser : null;

    const closeOwnModal = useCallback(() => {
        const modalId = modalIdRef.current;
        modalIdRef.current = null;
        setIsModalOpen(false);
        if (modalId !== null) closeModalById(modalId);
    }, [closeModalById]);

    const handleRequestApproval = useCallback(() => {
        if (!lcnProfile || isModalOpen) return;

        setIsModalOpen(true);
        modalIdRef.current = newModal(
            <EUParentalConsentModalContent
                name={lcnProfile.displayName}
                dob={lcnProfile.dob}
                country={lcnProfile.country}
                onClose={closeOwnModal}
                onComplete={() => {
                    // Sending the request is not an approval. Close only this
                    // notice's own modal and refetch the profile so a guardian
                    // approval that landed elsewhere is picked up — but never
                    // set `approved` locally.
                    closeOwnModal();
                    void refetch();
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
                onClose: () => {
                    modalIdRef.current = null;
                    setIsModalOpen(false);
                },
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [lcnProfile, isModalOpen, newModal, closeOwnModal, refetch]);

    const isUnapprovedProfile =
        hasNetworkProfile(authStatus) && !currentLCNUserLoading && lcnProfile?.approved === false;

    if (!isUnapprovedProfile) return null;

    const isPage = variant === 'page';
    const cardClassName = [
        'rounded-[20px] border border-grayscale-200 bg-white p-5 font-poppins',
        isPage ? 'w-full max-w-md shadow-xl' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section
            role="status"
            aria-live="polite"
            aria-labelledby={headingId}
            aria-busy={isModalOpen || undefined}
            className={cardClassName}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grayscale-100">
                    <IonIcon
                        icon={shieldOutline}
                        aria-hidden="true"
                        className="text-2xl text-grayscale-600"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <h2
                        id={headingId}
                        className="text-base font-semibold leading-snug text-grayscale-900"
                    >
                        {m['claim.accountApproval.title']()}
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                        {m['claim.accountApproval.description']()}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={handleRequestApproval}
                disabled={isModalOpen}
                aria-busy={isModalOpen || undefined}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {m['claim.accountApproval.request']()}
            </button>
        </section>
    );
};

export default InboxAccountApprovalNotice;
