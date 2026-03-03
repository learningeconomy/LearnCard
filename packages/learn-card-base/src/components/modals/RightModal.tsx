import React from 'react';

import useModal from './useModal';
import useConfirmation from './useConfirmation';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

const RightModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();
    const confirm = useConfirmation({ widen: true, className: options?.confirmationClassName });

    const optionalClass = options?.className || '';
    const sectionClass = options?.sectionClassName || '';

    const handleCloseModal = () => {
        if (options.disableCloseHandlers) return;

        if (options?.confirmClose) {
            confirm({ text: options.confirmClose, onConfirm: () => setTimeout(closeModal, 350) });
        } else {
            options?.onClose?.();
            closeModal();
        }
    };

    return (
        <aside
            id="right-modal"
            className={`${optionalClass} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
        >
            {!options?.hideDimmer && (
                <button
                    className="right-modal-dimmer"
                    type="button"
                    onClick={handleCloseModal}
                    aria-label="modal-dimmer"
                    aria-hidden
                />
            )}

            <section
                className={`${optionalClass} ${sectionClass} ${options?.widen ? 'widen' : ''} ${
                    options?.addShadow ? 'add-shadow' : ''
                }`}
            >
                <GenericErrorBoundary>{component}</GenericErrorBoundary>
            </section>
        </aside>
    );
};

export default RightModal;
