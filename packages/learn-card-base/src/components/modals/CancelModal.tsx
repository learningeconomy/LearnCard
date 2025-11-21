import React, { useEffect, useState } from 'react';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';
import useModal from './useModal';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

interface CancelModalOptions {
    customButtonText?: string;
    customButtonClass?: string;
    usePortal?: boolean;
}

export const CancelModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();
    const safeArea = useSafeArea();
    const optionalClass = options?.className || 'd-c-modal';
    const hideButton = options?.hideButton;
    const customSectionClass = options?.sectionClassName || '';
    const topSectionClass = options?.topSectionClassName || '';
    const buttonText = options?.cancelButtonTextOverride ?? 'Close';
    const usePortal = options?.usePortal || false;
    const portalClass = options?.portalClassName || '';
    const androidClass = options?.androidClassName || '';

    const handleCloseModal = () => {
        if (options?.disableCloseHandlers) return;

        options?.onClose?.();
        closeModal();
    };

    return (
        <aside
            id="cancel-modal"
            className={`${optionalClass} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
            style={{
                paddingBottom: `${safeArea.bottom + 10}px`,
            }}
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
                className={`${topSectionClass} ${optionalClass} ${options?.widen ? 'widen' : ''} ${
                    options?.addShadow ? 'add-shadow' : ''
                } ${customSectionClass}`}
            >
                <GenericErrorBoundary>{component}</GenericErrorBoundary>
            </section>

            {!hideButton && (
                <section
                    className={`${androidClass} shrink-0 ${optionalClass} ${
                        options?.widen ? 'widen' : ''
                    } ${options?.addShadow ? 'add-shadow' : ''} ${customSectionClass}`}
                >
                    <button
                        type="button"
                        className="shrink-0 w-full py-2 h-full flex items-center justify-center text-grayscale-900 text-lg bg-white rounded-[20px] shadow-bottom-4-4 font-notoSans"
                        onClick={handleCloseModal}
                    >
                        {buttonText}
                    </button>
                </section>
            )}
            {/* This section creates a portal-like container for scenarios where you need 
            to display a custom button layout with a cancel action, e.g. LearnCardFooter.tsx */}
            {usePortal && (
                <section
                    id="section-cancel-portal"
                    className={`${portalClass} !bg-transparent !shadow-none`}
                ></section>
            )}
        </aside>
    );
};

export default CancelModal;

export const SelectModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();

    const optionalClass = options?.className || 'd-c-modal';
    const hideButton = options?.hideButton;
    const customSectionClass = options?.sectionClassName || '';

    const handleCloseModal = () => {
        if (options.disableCloseHandlers) return;

        options?.onClose?.();
        closeModal();
    };

    return (
        <aside
            id="cancel-modal"
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
                <GenericErrorBoundary>{component}</GenericErrorBoundary>
            </section>

            {!hideButton && (
                <section
                    className={`${optionalClass} ${options?.widen ? 'widen' : ''} ${
                        options?.addShadow ? 'add-shadow' : ''
                    } ${customSectionClass}`}
                >
                    <button
                        type="button"
                        className="w-full py-3 h-full flex items-center justify-center bg-white text-xl text-black font-medium rounded-[20px]"
                        onClick={handleCloseModal}
                    >
                        Select
                    </button>
                </section>
            )}
        </aside>
    );
};
