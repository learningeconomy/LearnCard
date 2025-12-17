import React from 'react';

import useModal from 'learn-card-base/components/modals/useModal';
import { ModalTypes } from 'learn-card-base/components/modals/types/Modals';

import Confirmation from 'learn-card-base/components/modals/Confirmation';

type UseConfirmationConfirmProps = {
    title?: string;
    text: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    cancelButtonClassName?: string;
    confirmButtonClassName?: string;
};

type UseConfirmationProps = {
    widen?: boolean;
    className?: string;
};

/**
 * React hook for showing a confirmation dialog for
 *
 * Use like so:
 *
 * const confirm = useConfirmation();
 *
 * const confirmSomething = () => {
 *     confirm({
 *         text: "Are you sure?",
 *         onConfirm: () => alert("You said yes!"),
 *         onCancel: () => alert("You said no!"),
 *     });
 * };
 *
 * return (
 *     <button type="button" onClick={confirmSomething}>Confirm Something for me please!</button>
 * );
 */
export const useConfirmation = ({ widen = false, className = '' }: UseConfirmationProps = {}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.Center });

    const confirm = ({
        title,
        text,
        onConfirm,
        onCancel,
        confirmText,
        cancelText,
        cancelButtonClassName,
        confirmButtonClassName,
    }: UseConfirmationConfirmProps) => {
        return new Promise<boolean>(resolve => {
            const _onConfirm = () => {
                resolve(true);
                onConfirm?.();
            };

            const _onCancel = () => {
                resolve(false);
                onCancel?.();
            };

            newModal(
                <Confirmation
                    title={title}
                    text={text}
                    onConfirm={_onConfirm}
                    onCancel={_onCancel}
                    confirmText={confirmText}
                    cancelText={cancelText}
                    className={className}
                    cancelButtonClassName={cancelButtonClassName}
                    confirmButtonClassName={confirmButtonClassName}
                />,
                {
                    hideButton: true,
                    onClose: _onCancel,
                    className: 'confirmation-modal',
                    sectionClassName: '!max-w-[350px]',
                    widen,
                    addShadow: widen,
                }
            );
        });
    };

    return confirm;
};
