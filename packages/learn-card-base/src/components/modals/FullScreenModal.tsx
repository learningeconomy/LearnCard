import React from 'react';

import useModal from './useModal';
import { insertParamsToFilestackUrl } from 'learn-card-base/filestack/images/filestack.helpers';
import { ModalContainer } from './types/Modals';
import AppModal from './surfaces/AppModal';

export const FullScreenModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();

    const optionalClass = options?.className || '';
    const customSectionClass = options?.sectionClassName || '';

    const handleCloseModal = () => {
        if (options?.disableCloseHandlers) return;

        options?.onClose?.();
        closeModal();
    };

    const backgroundImage = insertParamsToFilestackUrl(
        options?.backgroundImage,
        'resize=width:1000/quality=value:75/'
    );

    return (
        <AppModal
            rootId="full-screen-modal"
            variant="fullscreen"
            open={open}
            onDimmerClick={handleCloseModal}
            hideDimmer={options?.hideDimmer}
            rootClassName={`${optionalClass} ${options?.hideDimmer ? 'hide-dimmer' : ''}`}
            rootStyle={
                backgroundImage
                    ? {
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }
                    : undefined
            }
            sectionClassName={`${optionalClass} ${options?.widen ? 'widen' : ''} ${
                options?.addShadow ? 'add-shadow' : ''
            } ${customSectionClass}`}
            errorBoundaryButtons={[{ label: 'Close Modal', onClick: handleCloseModal }]}
        >
            {component}
        </AppModal>
    );
};

export default FullScreenModal;
