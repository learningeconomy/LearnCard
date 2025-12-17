import React from 'react';

import ShortBoostUserOptions from '../boost-options/boostUserOptions/ShortBoostUserOptions';

import { ModalTypes, useModal } from 'learn-card-base';
import { RouteComponentProps } from 'react-router-dom';
import { UnsignedVC, VC } from '@learncard/types';

const useShortBoost = (
    history: RouteComponentProps['history'],
    boostCredential: VC | UnsignedVC,
    boostUri: string,
    profileId: string,
    boost: any
) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const handlePresentShortBoostModal = () => {
        newModal(
            <ShortBoostUserOptions
                handleCloseModal={closeModal}
                showCloseButton={false}
                boostCredential={boostCredential}
                boost={boost}
                boostUri={boostUri}
                profileId={profileId}
                title={
                    <p className="flex items-center justify-center text-2xl w-full h-full text-grayscale-900">
                        Who do you want to send to?
                    </p>
                }
                history={history}
            />
        );
    };

    return {
        handlePresentShortBoostModal,
    };
};

export default useShortBoost;
