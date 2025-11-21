import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import ShortBoostUserOptions from '../boost-options/boostUserOptions/ShortBoostUserOptions';

import { useModal, ModalTypes } from 'learn-card-base';

import { UnsignedVC, VC } from '@learncard/types';

const useShortBoost = (
    history: RouteComponentProps['history'],
    boostCredential: VC | UnsignedVC,
    boostUri: string,
    profileId: string,
    boost: any,
    handleEditOnClick: () => void
) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const presentModal = () => {
        closeModal();
        newModal(
            <ShortBoostUserOptions
                handleCloseModal={() => closeModal()}
                boostCredential={boostCredential}
                boost={boost}
                boostUri={boostUri}
                profileId={profileId}
                history={history}
                handleEditOnClick={handleEditOnClick}
            />,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
                usePortal: true,
                portalClassName: '!max-w-[500px]',
            }
        );
    };

    return {
        handlePresentShortBoostModal: presentModal,
    };
};

export default useShortBoost;
