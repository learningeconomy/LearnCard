import React from 'react';

type TextBoxProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    label?: string;
    multiline?: boolean;
};

const TextBox: React.FC<TextBoxProps> = ({
    value,
    onChange,
    className = '',
    label = '',
    multiline = false,
}) => {
    return (
        <label
            className={`w-1/2 flex gap-2 justify-between ${
                multiline ? 'flex-col' : 'flex-row items-center'
            } ${className}`}
        >
            {label}
            {multiline ? (
                <textarea
                    className="h-80 w-full p-4"
                    onChange={e => onChange(e.target.value)}
                    value={value}
                />
            ) : (
                <input
                    className="p-4 flex-grow"
                    onChange={e => onChange(e.target.value)}
                    value={value}
                />
            )}
        </label>
    );
};

export default TextBox;
