import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ModalTypes, useModal } from 'learn-card-base';

import UserProfileSetup from '../user-profile/UserProfileSetup';
import useLogout from '../../hooks/useLogout';

/**
 * Opens the account settings form, where the date of birth is set, for a "keep your
 * account" refusal that needs one (`age_unknown`). When it closes, the account
 * continuity answer is re-read, so the step updates without a reload.
 */
export const useOpenBirthDateSettings = (): (() => void) => {
    const { newModal, closeModal } = useModal();
    const { handleLogout } = useLogout();
    const queryClient = useQueryClient();

    return () => {
        newModal(
            <div className="h-full">
                <UserProfileSetup
                    handleCloseModal={() => {
                        closeModal();
                        void queryClient.invalidateQueries({
                            queryKey: ['classlinkAccountContinuity'],
                        });
                    }}
                    handleLogout={() => handleLogout({ overrideRedirectUrl: '/login' })}
                    showDeleteAccountButton={false}
                    showNotificationsModal={false}
                />
            </div>,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };
};
