import React from 'react';

import { ModalContainer } from './types/Modals';
import AppModal from './surfaces/AppModal';
import { useModal } from './useModal';

export const FreeformModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();

    const handleBackdropClick = () => {
        if (options?.disableCloseHandlers) return;
        options?.onClose?.();
        closeModal();
    };

    return (
        <AppModal
            // Legacy freeform aside had no id; AppModal requires a rootId, and the
            // SCSS is keyed to `.freeform-modal` / `.freeform-modal-dimmer` classes,
            // so `freeform-modal` is a purely additive id.
            rootId="freeform-modal"
            variant="freeform"
            open={open}
            onDimmerClick={handleBackdropClick}
            hideDimmer
            rootClassName={`freeform-modal ${options?.className ?? ''} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
            sectionClassName={`freeform-section ${options?.widen ? 'widen' : ''} ${
                options?.addShadow ? 'add-shadow' : ''
            } ${options?.sectionClassName ?? ''}`}
            beforeSection={
                !options?.hideDimmer && (
                    <button
                        className="freeform-modal-dimmer"
                        type="button"
                        onClick={handleBackdropClick}
                        aria-label="Close modal"
                    />
                )
            }
        >
            {component}
        </AppModal>
    );
};

export default FreeformModal;
