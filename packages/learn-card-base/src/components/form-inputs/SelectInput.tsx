import React from 'react';
import useModal from '../modals/useModal';
import { ModalTypes } from '../modals/types/Modals';

import ChevronDown from 'learn-card-base/svgs/ChevronDown';

type SelectOption = {
    value: string | number;
    displayText?: string;
    selectedText?: string;
};

type SelectInputProps = {
    value: string | number | null | undefined;
    onChange: (newValue: string | number) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

const SelectInput: React.FC<SelectInputProps> = ({
    value,
    options,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    className = '',
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const selectedOption = options.find(o => o.value === value);

    const openSelectModal = () => {
        if (disabled) return;

        newModal(
            <div className="text-grayscale-900 flex flex-col py-[10px]">
                {options.map(o => (
                    <button
                        key={o.value}
                        className={`py-[10px] ${o.value === value ? 'font-[700]' : ''}`}
                        onClick={() => {
                            onChange(o.value);
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
            return (
                selectedOption.selectedText ?? selectedOption.displayText ?? selectedOption.value
            );
        }
        return placeholder;
    })();

    const isPlaceholder = !selectedOption;

    return (
        <button
            type="button"
            onClick={openSelectModal}
            disabled={disabled}
            className={`flex items-center justify-between bg-grayscale-100 rounded-[15px] px-[16px] py-[12px] min-h-[48px] w-full
                ${isPlaceholder ? 'text-grayscale-500' : 'text-grayscale-900'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}`}
        >
            <span className="font-poppins text-[16px] leading-[130%]">{buttonText}</span>
            <ChevronDown className="ml-[8px] flex-shrink-0 text-grayscale-800" />
        </button>
    );
};

export default SelectInput;
