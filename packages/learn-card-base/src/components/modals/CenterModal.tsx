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

        options?.onClose?.();
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
            beforeSection={
                options?.customCloseButton ? (
                    <button
                        type="button"
                        className={`center-modal-custom-close flex h-10 w-10 items-center justify-center rounded-full border border-grayscale-200 bg-white text-grayscale-700 shadow-box-bottom transition-colors hover:bg-grayscale-100 ${
                            options.customCloseButtonClass || ''
                        }`}
                        onClick={handleCloseModal}
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                ) : undefined
            }
        >
            {component}
        </AppModal>
    );
};

export default CenterModal;
