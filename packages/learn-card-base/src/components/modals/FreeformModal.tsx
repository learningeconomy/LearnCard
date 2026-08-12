import React from 'react';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';
import { useModal } from './useModal';

export const FreeformModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();

    const handleBackdropClick = () => {
        if (options?.disableCloseHandlers) return;
        options?.onClose?.();
        closeModal();
    };

    return (
        <aside
            className={`freeform-modal ${options?.className ?? ''} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
        >
            {!options?.hideDimmer && (
                <button
                    className="freeform-modal-dimmer"
                    type="button"
                    onClick={handleBackdropClick}
                    aria-label="Close modal"
                />
            )}
            <div
                className={`freeform-section ${options?.widen ? 'widen' : ''} ${
                    options?.addShadow ? 'add-shadow' : ''
                } ${options?.sectionClassName ?? ''}`}
            >
                <GenericErrorBoundary>{component}</GenericErrorBoundary>
            </div>
        </aside>
    );
};

export default FreeformModal;
