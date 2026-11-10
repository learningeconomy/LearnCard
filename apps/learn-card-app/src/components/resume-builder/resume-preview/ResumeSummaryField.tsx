import React from 'react';

interface ResumeSummaryFieldProps {
    value: string;
    placeholder: string;
    readOnly?: boolean;
    onChange: (value: string) => void;
}

/** The rounded summary surface owns focus; the inset textarea has no separate ring. */
export const ResumeSummaryField: React.FC<ResumeSummaryFieldProps> = ({
    value,
    placeholder,
    readOnly = false,
    onChange,
}) => (
    <div
        data-focus-ring
        className="w-full max-w-full rounded-xl bg-grayscale-100 px-3 py-3 min-h-[96px] flex flex-col justify-between sm:flex-1"
    >
        {readOnly ? (
            value.trim() ? (
                <p className="w-full max-w-full wrap-break-word text-[13px] text-grayscale-900 leading-relaxed whitespace-pre-wrap">
                    {value}
                </p>
            ) : null
        ) : (
            <textarea
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                rows={4}
                className="w-full max-w-full resize-none bg-transparent border-none outline-hidden text-[13px] text-grayscale-900 leading-relaxed placeholder:text-grayscale-500"
            />
        )}
    </div>
);
