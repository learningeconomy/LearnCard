import React from 'react';

import useModal from './useModal';
import { insertParamsToFilestackUrl } from 'learn-card-base/filestack/images/filestack.helpers';
import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

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
        <aside
            id="full-screen-modal"
            className={`${optionalClass} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
            style={
                backgroundImage
                    ? {
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }
                    : undefined
            }
        >
            {!options?.hideDimmer && (
                <button
                    className="full-screen-modal-dimmer"
                    type="button"
                    onClick={handleCloseModal}
                    aria-label="modal-dimmer"
                    aria-hidden
                />
            )}
            <section
                className={`${optionalClass} ${options?.widen ? 'widen' : ''} ${
                    options?.addShadow ? 'add-shadow' : ''
                } ${customSectionClass}`}
            >
                <GenericErrorBoundary
                    extraButtons={[{ label: 'Close Modal', onClick: handleCloseModal }]}
                >
                    {component}
                </GenericErrorBoundary>
            </section>
        </aside>
    );
};

export default FullScreenModal;
