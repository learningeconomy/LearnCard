import React from 'react';

import useModal from './useModal';

import X from '../../svgs/X';

import { ModalContainer } from './types/Modals';
import AppModal from './surfaces/AppModal';

export const CenterModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();

    const optionalClass = options?.className || 'd-c-modal';
    const hideButton = typeof options?.hideButton === 'boolean' ? options.hideButton : true;
    const customSectionClass = options?.sectionClassName || '';

    const handleCloseModal = () => {
        if (options.disableCloseHandlers) return;

        if (options?.onClose?.() === false) return;
        closeModal();
    };

    return (
        <AppModal
            rootId="center-modal"
            variant="center"
            open={open}
            onDimmerClick={handleCloseModal}
            hideDimmer={options?.hideDimmer}
            rootClassName={`${optionalClass} ${options?.hideDimmer ? 'hide-dimmer' : ''}`}
            sectionClassName={`${optionalClass} ${options?.widen ? 'widen' : ''} ${
                options?.addShadow ? 'add-shadow' : ''
            } ${customSectionClass}`}
            header={
                !hideButton ? (
                    <button type="button" className="center-modal-x" onClick={handleCloseModal}>
                        <X strokeWidth="4" />
                    </button>
                ) : undefined
            }
        >
            {component}
        </AppModal>
    );
};

export default CenterModal;
