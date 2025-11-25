import React from 'react';

import useModal from './useModal';

type ConfirmationProps = {
    title?: string;
    text: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    className?: string;
    confirmButtonClassName?: string;
    cancelButtonClassName?: string;
};

const Confirmation: React.FC<ConfirmationProps> = ({
    text,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    title,
    className = '',
    confirmButtonClassName = '',
    cancelButtonClassName = '',
}) => {
    const { closeModal } = useModal();

    const confirm = () => {
        onConfirm();
        closeModal();
    };

    const cancel = () => {
        onCancel?.();
        closeModal();
    };

    return (
        <section role="alert" className={`confirmation text-grayscale-900 ${className}`}>
            {title && <h2>{title}</h2>}

            {typeof text === 'string' ? <strong className="font-medium">{text}</strong> : text}

            <footer>
                <button className={`font-medium ${confirmButtonClassName}`} onClick={confirm}>
                    {confirmText ?? 'Ok'}
                </button>
                <button className={`font-medium ${cancelButtonClassName}`} onClick={cancel}>
                    {cancelText ?? 'Cancel'}
                </button>
            </footer>
        </section>
    );
};

export default Confirmation;
