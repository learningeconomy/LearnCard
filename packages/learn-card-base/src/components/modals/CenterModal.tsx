import React from 'react';

import useModal from './useModal';

import X from '../../svgs/X';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

export const CenterModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();

    const optionalClass = options?.className || 'd-c-modal';
    const hideButton = typeof options?.hideButton === 'boolean' ? options.hideButton : true;
    const customSectionClass = options?.sectionClassName || '';

    const handleCloseModal = () => {
        if (options.disableCloseHandlers) return;

        options?.onClose?.();
        closeModal();
    };

    return (
        <aside
            id="center-modal"
            className={`${optionalClass} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
        >
            {!options?.hideDimmer && (
                <button
                    className="center-modal-dimmer"
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
                {!hideButton && (
                    <button type="button" className="center-modal-x" onClick={handleCloseModal}>
                        <X strokeWidth="4" />
                    </button>
                )}
                <GenericErrorBoundary>{component}</GenericErrorBoundary>
            </section>
        </aside>
    );
};

export default CenterModal;
