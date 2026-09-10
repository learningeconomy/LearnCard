import React from 'react';

import useModal from './useModal';
import useConfirmation from './useConfirmation';

import { ModalContainer } from './types/Modals';
import AppModal from './surfaces/AppModal';

const RightModal: ModalContainer = ({ component, options, open }) => {
    const { requestCloseModal } = useModal();
    const confirm = useConfirmation({ widen: true, className: options?.confirmationClassName });

    const optionalClass = options?.className || '';
    const sectionClass = options?.sectionClassName || '';

    const handleCloseModal = () => {
        if (options?.disableCloseHandlers) return;

        if (options?.confirmClose) {
            confirm({
                text: options.confirmClose,
                onConfirm: () => setTimeout(() => void requestCloseModal(), 350),
            });
        } else {
            void requestCloseModal();
        }
    };

    return (
        <AppModal
            rootId="right-modal"
            variant="right"
            open={open}
            onDimmerClick={handleCloseModal}
            hideDimmer={options?.hideDimmer}
            rootClassName={`${optionalClass} ${options?.hideDimmer ? 'hide-dimmer' : ''}`}
            sectionClassName={`${optionalClass} ${sectionClass} ${options?.widen ? 'widen' : ''} ${
                options?.addShadow ? 'add-shadow' : ''
            }`}
        >
            {component}
        </AppModal>
    );
};

export default RightModal;
