import React, { useEffect } from 'react';

import { useModal, ModalTypes, useGetProfile, useIsLoggedIn } from 'learn-card-base';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';

import EUParentalConsentModalContent from 'apps/learn-card-app/src/components/onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent';
import { requiresEUParentalConsent } from 'apps/learn-card-app/src/components/onboarding/onboardingNetworkForm/helpers/gdpr';

export const useEUParentalConsentModal = (onDismiss?: () => void) => {
    const { data: cachedProfile, isLoading: cachedLoading } = useGetProfile();
    const profileId = cachedProfile?.profileId;
    const {
        data: freshProfile,
        isLoading: freshLoading,
        refetch: refetchFresh,
    } = useGetProfile(profileId, Boolean(profileId));

    const profile = freshProfile ?? cachedProfile;
    const isLoading = cachedLoading || freshLoading;

    const isLoggedIn = useIsLoggedIn();

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    useEffect(() => {
        if (profileId) refetchFresh();
    }, [profileId]);

    const presentEUParentalConsentModal = () => {
        newModal(
            <EUParentalConsentModalContent
                name={profile?.displayName}
                dob={profile?.dob}
                country={profile?.country}
                onClose={() => {
                    closeModal();
                    onDismiss?.();
                }}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
            },
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
    };

    const handlePresentEUParentalConsentModal = async () => {
        if (!isLoading && isLoggedIn && profile) {
            const age = profile?.dob ? calculateAge(profile.dob) : Number.NaN;
            const needsConsent = Boolean(
                profile?.country &&
                    !Number.isNaN(age) &&
                    requiresEUParentalConsent(profile.country, age)
            );
            const isExplicitlyUnapproved = profile?.approved === false;

            if (isExplicitlyUnapproved && needsConsent) {
                presentEUParentalConsentModal();
                return { prompted: true } as const;
            }
        }

        return { prompted: false } as const;
    };

    return {
        handlePresentEUParentalConsentModal,
        dismissEUParentalConsentModal: closeModal,
    };
};

export default useEUParentalConsentModal;
