import React from 'react';
import useModal from '../modals/useModal';
import { ModalTypes } from '../modals/types/Modals';

import ChevronDown from 'learn-card-base/svgs/ChevronDown';

type SelectOption = {
    value: string | number;
    displayText?: string;
    selectedText?: string;
    description?: string;
};

type SelectInputProps = {
    value: string | number | null | undefined;
    onChange: (newValue: string | number | null) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    allowDeselect?: boolean;
};

const SelectInput: React.FC<SelectInputProps> = ({
    value,
    options,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    className = '',
    allowDeselect = false,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const selectedOption = options.find(o => o.value === value);

    const hasDescriptions = options.some(o => o.description);

    const openSelectModal = () => {
        if (disabled) return;

        newModal(
            <div
                className={`text-grayscale-900 flex flex-col max-h-[70vh] overflow-y-auto ${
                    hasDescriptions ? 'py-[8px] px-[6px] gap-[2px]' : 'py-[10px]'
                }`}
            >
                {allowDeselect && value !== null && value !== undefined && (
                    <button
                        className={`text-grayscale-500 italic ${
                            hasDescriptions
                                ? 'py-[10px] px-[16px] text-left rounded-[12px] hover:bg-grayscale-10 transition-colors'
                                : 'py-[10px]'
                        }`}
                        onClick={() => {
                            onChange(null);
                            closeModal();
                        }}
                    >
                        Clear selection
                    </button>
                )}
                {options.map(o =>
                    o.description ? (
                        <button
                            key={o.value}
                            className={`flex flex-col gap-[2px] text-left px-[16px] py-[12px] rounded-[12px] transition-colors hover:bg-grayscale-10 ${
                                o.value === value ? 'bg-grayscale-100' : ''
                            }`}
                            onClick={() => {
                                onChange(o.value);
                                closeModal();
                            }}
                        >
                            <span
                                className={`${
                                    o.value === value
                                        ? 'font-[700] text-grayscale-900'
                                        : 'font-[600] text-grayscale-800'
                                }`}
                            >
                                {o.displayText ?? o.value}
                            </span>
                            <span className="text-[13px] leading-[130%] text-grayscale-500">
                                {o.description}
                            </span>
                        </button>
                    ) : (
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
                    )
                )}
            </div>,
            { sectionClassName: hasDescriptions ? '!max-w-[400px] !w-[90%]' : '!max-w-[300px]' }
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
