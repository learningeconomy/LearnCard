import React from 'react';

import Search from '../../svgs/Search';
import X from '../../svgs/X';

import TextInput from './TextInput';

type SearchInputProps = Omit<
    React.ComponentProps<typeof TextInput>,
    'type' | 'startIcon' | 'endIcon' | 'startButton' | 'endButton'
> & {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    clearButtonAriaLabel?: string;
    searchIconClassName?: string;
    clearIconClassName?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    onClear,
    clearButtonAriaLabel = 'Clear search',
    searchIconClassName = 'text-grayscale-900 w-[25px] h-[25px]',
    clearIconClassName = 'text-grayscale-500 h-[25px] w-[25px]',
    disabled = false,
    placeholder = 'Search',
    autoFocus = false,
    ...textInputProps
}) => {
    const handleClear = () => {
        if (disabled) return;

        onChange('');
        onClear?.();
    };

    return (
        <TextInput
            {...textInputProps}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            type="search"
            startIcon={<Search className={searchIconClassName} />}
            endButton={
                value ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label={clearButtonAriaLabel}
                        disabled={disabled}
                        className="flex items-center justify-center"
                    >
                        <X className={clearIconClassName} />
                    </button>
                ) : undefined
            }
        />
    );
};

export default SearchInput;
