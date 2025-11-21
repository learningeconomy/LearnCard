import React from 'react';
import useModal from '../modals/useModal';
import { ModalTypes } from '../modals/types/Modals';
import CaretDown from 'learn-card-base/svgs/CaretDown';

type SelectProps = {
    value: string | number;
    setValue: (newValue: string | number) => void;
    options: { value: string | number; displayText?: string; selectedText?: string }[];
    placeholder?: string;
    className?: string;
};

const Select: React.FC<SelectProps> = ({
    value,
    options,
    setValue,
    placeholder,
    className = '',
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const selectedOption = options.find(o => o.value === value);

    const openSelectModal = () => {
        newModal(
            <div className="text-grayscale-900 flex flex-col py-[10px]">
                {options.map(o => (
                    <button
                        key={o.value}
                        className={`py-[10px] ${o.value === value ? 'font-[700]' : ''}`}
                        onClick={() => {
                            setValue(o.value);
                            closeModal();
                        }}
                    >
                        {o.displayText ?? o.value}
                    </button>
                ))}
            </div>,
            { sectionClassName: '!max-w-[300px]' }
        );
    };

    const buttonText = (() => {
        if (selectedOption) {
            return selectedOption.selectedText ?? selectedOption.displayText;
        }

        if (!value) {
            return placeholder ?? 'Select...';
        }

        return value;
    })();

    return (
        <button onClick={openSelectModal} className={`flex items-center gap-[5px] ${className}`}>
            {buttonText}
            <CaretDown className="opacity-70" />
        </button>
    );
};

export default Select;
